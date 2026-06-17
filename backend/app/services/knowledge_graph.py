import os
import pickle
import threading
import networkx as nx
from sqlalchemy.orm import Session
from app import models
import json
from app.core.config import DATABASE_PATH, KG_CACHE_PATH

# 中医经典症状与同义词映射词典
SYMPTOMS_DICT = {
    "发热": ["发热", "身热", "大热", "潮热", "壮热", "往来寒热"],
    "畏寒": ["恶风", "恶寒", "畏寒", "怕冷", "寒战"],
    "头痛": ["头痛", "偏头痛", "头胀痛"],
    "头晕": ["头晕", "目眩", "眩晕", "头昏"],
    "咳嗽": ["咳嗽", "咳喘", "气喘", "喘息", "咳唾"],
    "失眠": ["失眠", "不寐", "多梦", "难入睡", "不眠", "虚烦不眠"],
    "疲劳": ["疲劳", "神疲", "乏力", "倦怠", "气短", "少气懒言"],
    "食欲不振": ["食欲不振", "纳呆", "不欲饮食", "纳差", "食少", "脾虚不磨"],
    "腹胀": ["腹胀", "脘腹胀满", "腹满", "心下痞满", "痞胀"],
    "腹痛": ["腹痛", "脘腹疼痛", "少腹痛", "腹中痛"],
    "腹泻": ["泄泻", "便溏", "下利", "腹泻", "溏泄"],
    "便秘": ["便秘", "大便干结", "大便燥结", "大便难"],
    "口渴": ["口渴", "消渴", "渴喜冷饮", "口燥咽干"],
    "自汗": ["自汗", "多汗"],
    "盗汗": ["盗汗"],
    "腰痛": ["腰痛", "腰膝酸软", "腰膝酸痛"],
    "呕吐": ["呕吐", "干呕", "喜呕", "恶心", "呕逆"],
    "心悸": ["心悸", "怔忡", "心慌", "惊悸"],
    "水肿": ["水肿", "利水", "小便不利", "尿少", "小便难"]
}

class KnowledgeGraphService:
    def __init__(self):
        self.graph = nx.Graph()
        self.lock = threading.Lock()
        # 缓存与数据库文件路径配置 (从 app.core.config 获取)
        self.db_path = DATABASE_PATH
        self.cache_path = KG_CACHE_PATH
        self._cache_mtime = -1.0
        
    def build_graph(self, db: Session, force: bool = False):
        with self.lock:
            # 1. 检测数据库最后修改时间戳
            db_mtime = 0.0
            if os.path.exists(self.db_path):
                db_mtime = os.path.getmtime(self.db_path)
                
            # 如果内存中已经构建过图谱，且数据库文件自上次载入后未曾修改，则无需重算
            if not force and len(self.graph) > 0 and self._cache_mtime == db_mtime:
                return
                
            # 2. 尝试从本地 pickle 缓存文件加载
            if not force and os.path.exists(self.cache_path):
                try:
                    with open(self.cache_path, "rb") as f:
                        cache_data = pickle.load(f)
                    
                    # 如果缓存里的时间戳同当前数据库文件匹配，则直接载入
                    if cache_data.get("db_mtime") == db_mtime:
                        self.graph = cache_data["graph"]
                        self._cache_mtime = db_mtime
                        print("[KG] 成功从本地文件缓存加载知识图谱 (Cache Hit)！")
                        return
                except Exception as e:
                    print(f"[KG] 从本地文件缓存加载失败 ({e})，将重新从数据库加载构建...")
    
            # 3. 缓存失效，重新查询数据库构建
            print("[KG] 本地文件缓存失效或不存在，开始从数据库重新构建知识图谱...")
            self.graph.clear()
            
            # 从数据库查询所有中药与方剂
            herbs = db.query(models.Herb).all()
            prescriptions = db.query(models.Prescription).all()
            
            # 建立症状关键字到标准症状名的反向映射
            symptom_map = {}
            for std_name, kw_list in SYMPTOMS_DICT.items():
                for kw in kw_list:
                    symptom_map[kw] = std_name
                    
            # 2. 构建中药节点及关系
            for h in herbs:
                self.graph.add_node(
                    h.name,
                    type="herb",
                    category=h.category,
                    nature=h.nature,
                    temperature=h.temperature,
                    functions=h.functions,
                    classic_ref=h.classic_ref,
                    description=h.description or ""
                )
                
                # 建立 中药 -[归经]-> 脏腑经络 关系
                meridians = h.meridians or []
                if isinstance(meridians, str):
                    try:
                        meridians = json.loads(meridians)
                    except:
                        meridians = []
                for m in meridians:
                    self.graph.add_node(m, type="meridian")
                    self.graph.add_edge(h.name, m, type="BELONGS_TO")
                    
                # 建立 中药 -[治疗]-> 症状 关系 (扫描功效和描述文本)
                for kw, std_symptom in symptom_map.items():
                    if kw in (h.functions or "") or kw in (h.description or ""):
                        self.graph.add_node(std_symptom, type="symptom")
                        self.graph.add_edge(h.name, std_symptom, type="TREATS_SYMPTOM")
                        
            # 3. 构建方剂节点及关系
            for p in prescriptions:
                self.graph.add_node(
                    p.name,
                    type="prescription",
                    source=p.source or "",
                    functions=p.functions or "",
                    indications=p.indications or "",
                    usage=p.usage or "",
                    description=p.description or ""
                )
                
                # 建立 方剂 -[包含]-> 中药 关系 (解析组成成分 JSON)
                composition = p.composition or {}
                if isinstance(composition, str):
                    try:
                        composition = json.loads(composition)
                    except:
                        composition = {}
                for herb_name, dose in composition.items():
                    # 确保中药节点存在
                    if not self.graph.has_node(herb_name):
                        self.graph.add_node(herb_name, type="herb")
                    self.graph.add_edge(p.name, herb_name, type="CONTAINS", dose=dose)
                    
                # 提取证型并建立关系 (方剂 indications 的第一句通常为证型，如“心脾两虚证”)
                indications = p.indications or ""
                parts = indications.split("。")
                syndrome_name = parts[0].strip() if parts else "未知证型"
                
                # 如果证型名字不长，通常说明是一个标准证型，而非一长串症状描述
                if syndrome_name and len(syndrome_name) < 15:
                    self.graph.add_node(syndrome_name, type="syndrome")
                    self.graph.add_edge(p.name, syndrome_name, type="TREATS_SYNDROME")
                    
                    # 提取方剂/证型针对的症状关系
                    for kw, std_symptom in symptom_map.items():
                        if kw in indications:
                            self.graph.add_node(std_symptom, type="symptom")
                            self.graph.add_edge(p.name, std_symptom, type="TREATS_SYMPTOM")
                            self.graph.add_edge(syndrome_name, std_symptom, type="HAS_SYMPTOM")
                    # 备用：直接匹配方剂与症状
                    for kw, std_symptom in symptom_map.items():
                        if kw in indications:
                            self.graph.add_node(std_symptom, type="symptom")
                            self.graph.add_edge(p.name, std_symptom, type="TREATS_SYMPTOM")
                            
            # 4. 构建完成后写入本地 pickle 缓存并更新内存时间戳
            self._cache_mtime = db_mtime
            try:
                cache_data = {
                    "db_mtime": db_mtime,
                    "graph": self.graph
                }
                with open(self.cache_path, "wb") as f:
                    pickle.dump(cache_data, f)
                print("[KG] 知识图谱构建完成并成功保存至本地文件缓存！")
            except Exception as e:
                print(f"[KG] 保存知识图谱缓存到本地文件失败: {e}")
                        
    def get_graph_data(self):
        """格式化导出完整的图节点和关系列表，供前端可视化"""
        nodes_list = []
        for n, data in self.graph.nodes(data=True):
            node_info = {"id": n, "name": n}
            node_info.update(data)
            nodes_list.append(node_info)
            
        edges_list = []
        for u, v, data in self.graph.edges(data=True):
            edge_info = {"source": u, "target": v}
            edge_info.update(data)
            edges_list.append(edge_info)
            
        return {"nodes": nodes_list, "links": edges_list}
        
    def extract_symptoms(self, text: str) -> list[str]:
        """从输入问诊文本中，抽取出匹配的症状实体"""
        matched = []
        for std_name, kw_list in SYMPTOMS_DICT.items():
            for kw in kw_list:
                if kw in text:
                    matched.append(std_name)
                    break
        return matched

    def query_reasoning(self, query: str, db: Session) -> dict:
        """从查询中识别症状，并在图谱中进行辨证与推荐推理"""
        # 每次推理直接调用 build_graph（其内部会进行时间戳秒级检查以支持热重载）
        self.build_graph(db)
            
        symptoms = self.extract_symptoms(query)
        if not symptoms:
            return {
                "symptoms": [],
                "syndromes": [],
                "prescriptions": [],
                "herbs": [],
                "explanation": "在您的描述中未能匹配到明确的身体症状。建议尝试描述具体寒热、出汗、睡眠或脾胃消化状况。"
            }
            
        # 统计相连的候选节点得分
        syndromes_score = {}
        prescriptions_score = {}
        herbs_score = {}
        
        for sym in symptoms:
            if not self.graph.has_node(sym):
                continue
            for neighbor in self.graph.neighbors(sym):
                node_type = self.graph.nodes[neighbor].get("type", "")
                
                if node_type == "syndrome":
                    syndromes_score[neighbor] = syndromes_score.get(neighbor, 0) + 1
                elif node_type == "prescription":
                    prescriptions_score[neighbor] = prescriptions_score.get(neighbor, 0) + 1
                elif node_type == "herb":
                    herbs_score[neighbor] = herbs_score.get(neighbor, 0) + 1
                    
        # 降序排序截取最匹配节点
        top_syndromes = sorted(syndromes_score.keys(), key=lambda x: syndromes_score[x], reverse=True)[:3]
        top_prescriptions = sorted(prescriptions_score.keys(), key=lambda x: prescriptions_score[x], reverse=True)[:3]
        top_herbs = sorted(herbs_score.keys(), key=lambda x: herbs_score[x], reverse=True)[:5]
        
        # 自动串联生成图谱辨证分析说明
        explanation_parts = []
        explanation_parts.append(f"【图谱辨识】从您的描述中匹配到核心症状：{', '.join(symptoms)}。")
        
        if top_syndromes:
            explanation_parts.append(f"【辨证分析】在图关系中，这些症状主要指向证型：{', '.join(top_syndromes)}。")
            
        if top_prescriptions:
            p_name = top_prescriptions[0]
            # 获取该方剂在图中的配伍中药
            associated_herbs = []
            for neighbor in self.graph.neighbors(p_name):
                if self.graph.nodes[neighbor].get("type") == "herb":
                    associated_herbs.append(neighbor)
            
            explanation_parts.append(f"【治法推荐】图谱推荐调理经典方剂为【{p_name}】。该方由 {', '.join(associated_herbs[:5])} 等中药配伍组成，相辅相成。")
            
        explanation = "\n".join(explanation_parts)
        
        return {
            "symptoms": symptoms,
            "syndromes": top_syndromes,
            "prescriptions": top_prescriptions,
            "herbs": top_herbs,
            "explanation": explanation
        }
