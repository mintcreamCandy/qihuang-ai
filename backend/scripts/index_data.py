import os
import sys
import io

# 强制设置标准输出为 UTF-8 编码，防止 Windows 控制台下 GBK 报错
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# 必须在导入 sentence_transformers 之前设置环境变量以生效镜像源
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

import pickle
import jieba
import chromadb
from sentence_transformers import SentenceTransformer

# 将当前文件夹加入 Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app import models
from app.core.config import BM25_INDEX_PATH, CHROMA_DB_PATH, TCM_DICT_PATH

def build_rag_index():
    print("====== [RAG] 岐黄 RAG 知识建库系统 ======")
    
    # 1. 读取数据库数据
    db = SessionLocal()
    herbs = db.query(models.Herb).all()
    prescriptions = db.query(models.Prescription).all()
    db.close()
    
    if not herbs and not prescriptions:
        print("警告: 数据库中没有中药和方剂数据，请先运行 seed_data.py！")
        return

    print(f"从数据库读取到: {len(herbs)} 味中药，{len(prescriptions)} 首方剂。")

    # 2. 构造文本 Document 和元数据
    documents = []
    metadatas = []
    ids = []

    # 格式化中药数据
    for h in herbs:
        meridians_str = "、".join(h.meridians) if isinstance(h.meridians, list) else str(h.meridians)
        content = (
            f"名称: {h.name}。拼音: {h.pinyin}。分类: {h.category}。"
            f"药性: {h.temperature}。药味: {h.nature}。归经: {meridians_str}。"
            f"功效: {h.functions}。用法: {h.usage}。出处: {h.classic_ref or '未知'}。"
            f"描述: {h.description}。禁忌: {h.contraindications or '无'}"
        )
        documents.append(content)
        metadatas.append({
            "type": "herb",
            "id": h.id,
            "name": h.name,
            "category": h.category
        })
        ids.append(f"herb_{h.id}")

    # 格式化方剂数据
    for p in prescriptions:
        # composition 格式化
        comp_parts = []
        if isinstance(p.composition, dict):
            for herb, dosage in p.composition.items():
                comp_parts.append(f"{herb}({dosage})")
        comp_str = "、".join(comp_parts)

        content = (
            f"名称: {p.name}。拼音: {p.pinyin}。来源: {p.source or '未知'}。"
            f"组成: {comp_str}。功用: {p.functions}。主治: {p.indications}。"
            f"用法: {p.usage}。描述: {p.description or ''}。禁忌: {p.contraindications or '无'}"
        )
        documents.append(content)
        metadatas.append({
            "type": "prescription",
            "id": p.id,
            "name": p.name,
            "source": p.source or "未知"
        })
        ids.append(f"pres_{p.id}")

    print(f"总计生成 {len(documents)} 个知识文档。")

    # 3. 载入中医自定义分词词典并进行 Jieba 分词
    dict_path = TCM_DICT_PATH
    if os.path.exists(dict_path):
        print(f"加载中医自定义词典: {dict_path}")
        jieba.load_userdict(dict_path)
    else:
        print("未找到中医自定义词典，使用默认分词。")

    print("开始对语料进行分词，构建 BM25 稀疏检索索引...")
    tokenized_corpus = []
    for doc in documents:
        # 英文转小写，中文分词
        tokens = [token.lower() for token in jieba.cut(doc) if token.strip()]
        tokenized_corpus.append(tokens)

    # 序列化 BM25 数据
    bm25_data = {
        "tokenized_corpus": tokenized_corpus,
        "documents": documents,
        "metadatas": metadatas,
        "ids": ids
    }
    bm25_path = BM25_INDEX_PATH
    with open(bm25_path, "wb") as f:
        pickle.dump(bm25_data, f)
    print(f"BM25 索引构建完毕，已保存至: {bm25_path}")

    # 4. 生成稠密向量并写入 ChromaDB 向量数据库
    print("载入本地 BAAI/bge-small-zh-v1.5 Embedding 模型...")
    # 优先尝试从 ModelScope 镜像源下载模型，防止 Hugging Face 连接报错
    try:
        from modelscope import snapshot_download
        print("正在从 ModelScope 下载 BAAI/bge-small-zh-v1.5 模型...")
        model_dir = snapshot_download('baai/bge-small-zh-v1.5')
        print(f"模型已成功下载至本地目录: {model_dir}")
        model = SentenceTransformer(model_dir)
    except Exception as e:
        print(f"从 ModelScope 加载模型失败 ({e})，尝试使用默认 HuggingFace 方式加载...")
        # SentenceTransformer 会自动从 HuggingFace 缓存目录加载或下载模型。
        # 对于中国区网络，模型下载可能不稳定，可以通过国内镜像或使用 HuggingFaceHub 下载。
        # 这里通过设置环境变量确保下载顺利：
        os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
        model = SentenceTransformer("BAAI/bge-small-zh-v1.5")
    
    print("正在为文档生成稠密向量 Embedding...")
    # BGE 模型建议在编码时对文本添加查询指令，但对于库内文档直接编码即可，normalize_embeddings=True 保证其余弦相似度计算准确。
    embeddings = model.encode(documents, normalize_embeddings=True, show_progress_bar=True).tolist()

    print("写入 ChromaDB 本地持久化向量数据库...")
    chroma_path = CHROMA_DB_PATH
    chroma_client = chromadb.PersistentClient(path=chroma_path)
    
    # 获取或创建集合（使用余弦相似度度量距离）
    collection = chroma_client.get_or_create_collection(
        name="qihuang_rag", 
        metadata={"hnsw:space": "cosine"}
    )
    
    # 清空集合中的旧数据
    existing_ids = collection.get()["ids"]
    if existing_ids:
        print(f"清空旧向量数据 {len(existing_ids)} 条...")
        collection.delete(ids=existing_ids)

    # 批量添加向量和文档
    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )
    
    print(f"ChromaDB 向量索引构建完毕！已保存至: {chroma_path}")
    print("====== RAG 数据建库全部完成 ======")

if __name__ == "__main__":
    build_rag_index()
