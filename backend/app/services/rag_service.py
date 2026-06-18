import os
import sys

# 设置 Hugging Face 镜像源以加速模型加载
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

import pickle
import jieba
import chromadb
import threading
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from app.core.config import BM25_INDEX_PATH, CHROMA_DB_PATH, TCM_DICT_PATH

class RAGService:
    def __init__(self):
        self.lock = threading.RLock()
        # 1. 基础文件路径配置 (从 app.core.config 获取)
        self.bm25_path = BM25_INDEX_PATH
        self.chroma_path = CHROMA_DB_PATH
        self.dict_path = TCM_DICT_PATH
        
        # 2. 检查资源文件是否存在
        if not os.path.exists(self.bm25_path) or not os.path.exists(self.chroma_path):
            print("[RAG] 警告: RAG 索引文件不存在，请确保运行了 index_data.py 初始化索引！")
            self.initialized = False
            return
            
        self.initialized = True
        
        # 3. 加载自定义中医分词词典
        if os.path.exists(self.dict_path):
            jieba.load_userdict(self.dict_path)
            
        # 4. 加载 BM25 数据并重建索引
        print("正在加载 BM25 稀疏检索索引...")
        with open(self.bm25_path, "rb") as f:
            bm25_data = pickle.load(f)
            
        self.tokenized_corpus = bm25_data["tokenized_corpus"]
        self.documents = bm25_data["documents"]
        self.metadatas = bm25_data["metadatas"]
        self.ids = bm25_data["ids"]
        
        # 重建 BM25 检索实例
        self.bm25 = BM25Okapi(self.tokenized_corpus)
        
        # 5. 连接 ChromaDB 本地持久化数据库
        print("正在连接 ChromaDB 向量数据库...")
        self.chroma_client = chromadb.PersistentClient(path=self.chroma_path)
        self.collection = self.chroma_client.get_collection(name="qihuang_rag")
        
        # 6. 加载 SentenceTransformer 语义向量模型
        print("正在载入本地 BAAI/bge-small-zh-v1.5 Embedding 模型...")
        try:
            from modelscope import snapshot_download
            print("正在从 ModelScope 加载/下载 BAAI/bge-small-zh-v1.5 模型...")
            model_dir = snapshot_download('baai/bge-small-zh-v1.5')
            print(f"模型加载成功，本地目录: {model_dir}")
            self.model = SentenceTransformer(model_dir)
        except Exception as e:
            print(f"从 ModelScope 加载模型失败 ({e})，尝试使用默认 HuggingFace 方式加载...")
            self.model = SentenceTransformer("BAAI/bge-small-zh-v1.5")
        
        print("[RAG] RAG 双路召回检索系统初始化成功！")

    def search(self, query: str, top_k: int = 5):
        """
        双路召回主搜索方法：
        1. 稀疏检索 (BM25)
        2. 稠密检索 (ChromaDB Vector)
        3. RRF (Reciprocal Rank Fusion) 融合排序
        """
        if not self.initialized:
            raise ValueError("RAG 服务未成功初始化，请运行 index_data.py 生成索引数据。")
            
        query = query.strip()
        if not query:
            return []

        # --- 1. 稀疏检索通道 (BM25) ---
        query_tokens = [token.lower() for token in jieba.cut(query) if token.strip()]
        bm25_scores = self.bm25.get_scores(query_tokens)
        # 按照得分高低对索引下标进行降序排列
        bm25_ranked_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)
        
        # --- 2. 稠密检索通道 (ChromaDB Vector) ---
        # BGE 向量模型推荐添加查询前缀指令
        query_prefix = "为这个句子寻找相关文章："
        query_embedding = self.model.encode(query_prefix + query, normalize_embeddings=True).tolist()
        
        # 检索 ChromaDB，获取 top_k * 2 个候选文档以防重叠
        chroma_results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k * 2
        )
        
        # --- 3. 倒数排名融合 (RRF) ---
        rrf_scores = {}
        k_const = 60.0  # RRF 常量，平滑排名影响

        # 评分机制：RRF_Score = 1 / (k + rank + 1)
        
        # 融合 BM25 检索结果 (取前 top_k * 2 个结果)
        for rank, idx in enumerate(bm25_ranked_indices[:top_k * 2]):
            doc_id = self.ids[idx]
            score = 1.0 / (k_const + rank + 1)
            
            if doc_id not in rrf_scores:
                rrf_scores[doc_id] = {
                    "id": doc_id,
                    "document": self.documents[idx],
                    "metadata": self.metadatas[idx],
                    "score": 0.0,
                    "paths": []
                }
            rrf_scores[doc_id]["score"] += score
            rrf_scores[doc_id]["paths"].append("bm25")

        # 融合向量检索结果
        vector_doc_ids = chroma_results["ids"][0]
        for rank, doc_id in enumerate(vector_doc_ids):
            score = 1.0 / (k_const + rank + 1)
            
            # 从 ids 列表中找到对应的数据库全局下标
            try:
                idx = self.ids.index(doc_id)
            except ValueError:
                continue
                
            if doc_id not in rrf_scores:
                rrf_scores[doc_id] = {
                    "id": doc_id,
                    "document": self.documents[idx],
                    "metadata": self.metadatas[idx],
                    "score": 0.0,
                    "paths": []
                }
            rrf_scores[doc_id]["score"] += score
            rrf_scores[doc_id]["paths"].append("vector")

        # --- 4. 最终排序与截取 ---
        # 按照 RRF score 从大到小排序
        sorted_results = sorted(rrf_scores.values(), key=lambda x: x["score"], reverse=True)
        
        # 格式化输出前 top_k 个结果
        final_results = []
        for item in sorted_results[:top_k]:
            final_results.append({
                "id": item["id"],
                "document": item["document"],
                "metadata": item["metadata"],
                "rrf_score": round(item["score"], 5),
                "retrieval_paths": list(set(item["paths"]))  # 去重，可能包含 ["bm25", "vector"]
            })
            
        return final_results

    def _save_bm25(self):
        """将当前的 BM25 内存数据序列化保存到本地 pickle 文件"""
        try:
            bm25_data = {
                "tokenized_corpus": self.tokenized_corpus,
                "documents": self.documents,
                "metadatas": self.metadatas,
                "ids": self.ids
            }
            with open(self.bm25_path, "wb") as f:
                pickle.dump(bm25_data, f)
            print(f"[RAG] 成功保存 BM25 索引到本地缓存: {self.bm25_path}")
        except Exception as e:
            print(f"[RAG] 保存 BM25 索引失败: {e}")

    def add_document(self, doc_id: str, content: str, metadata: dict):
        """实时新增文档到 ChromaDB 与 BM25 索引中"""
        if not self.initialized:
            return
            
        with self.lock:
            # 1. 稠密向量库增量插入 (ChromaDB)
            embedding = self.model.encode(content, normalize_embeddings=True).tolist()
            try:
                self.collection.add(
                    ids=[doc_id],
                    embeddings=[embedding],
                    metadatas=[metadata],
                    documents=[content]
                )
                print(f"[RAG] ChromaDB 成功插入文档: {doc_id}")
            except Exception as e:
                print(f"[RAG] ChromaDB 插入文档 {doc_id} 失败: {e}")

            # 2. 稀疏索引增量插入 (BM25 内存列表)
            # 防止重复插入
            if doc_id in self.ids:
                self.update_document(doc_id, content, metadata)
                return

            self.ids.append(doc_id)
            self.documents.append(content)
            self.metadatas.append(metadata)
            
            # 分词并追加
            tokens = [token.lower() for token in jieba.cut(content) if token.strip()]
            self.tokenized_corpus.append(tokens)

            # 重建 BM25 实例并序列化保存
            self.bm25 = BM25Okapi(self.tokenized_corpus)
            self._save_bm25()

    def update_document(self, doc_id: str, content: str, metadata: dict):
        """实时更新 ChromaDB 与 BM25 中的现有文档"""
        if not self.initialized:
            return

        with self.lock:
            # 1. 稠密向量库更新 (ChromaDB upsert)
            embedding = self.model.encode(content, normalize_embeddings=True).tolist()
            try:
                self.collection.upsert(
                    ids=[doc_id],
                    embeddings=[embedding],
                    metadatas=[metadata],
                    documents=[content]
                )
                print(f"[RAG] ChromaDB 成功更新文档: {doc_id}")
            except Exception as e:
                print(f"[RAG] ChromaDB 更新文档 {doc_id} 失败: {e}")

            # 2. 稀疏检索更新 (BM25 内存列表)
            if doc_id in self.ids:
                idx = self.ids.index(doc_id)
                self.documents[idx] = content
                self.metadatas[idx] = metadata
                
                tokens = [token.lower() for token in jieba.cut(content) if token.strip()]
                self.tokenized_corpus[idx] = tokens
                
                # 重建 BM25 实例并保存
                self.bm25 = BM25Okapi(self.tokenized_corpus)
                self._save_bm25()
            else:
                # 容错：如果不在内存中，直接按新增处理
                self.add_document(doc_id, content, metadata)

    def delete_document(self, doc_id: str):
        """从 ChromaDB 与 BM25 中实时删除文档"""
        if not self.initialized:
            return

        with self.lock:
            # 1. 从 ChromaDB 删除
            try:
                self.collection.delete(ids=[doc_id])
                print(f"[RAG] ChromaDB 成功删除文档: {doc_id}")
            except Exception as e:
                print(f"[RAG] 从 ChromaDB 删除文档 {doc_id} 失败: {e}")

            # 2. 从 BM25 内存列表删除
            if doc_id in self.ids:
                idx = self.ids.index(doc_id)
                self.ids.pop(idx)
                self.documents.pop(idx)
                self.metadatas.pop(idx)
                self.tokenized_corpus.pop(idx)

                # 重建 BM25 实例并保存
                self.bm25 = BM25Okapi(self.tokenized_corpus)
                self._save_bm25()
            else:
                print(f"[RAG] 警告: 未在 BM25 索引中找到待删除的文档 {doc_id}")
