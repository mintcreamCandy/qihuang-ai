import datetime
import os
import sys

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import models
from app.core.database import engine, SessionLocal

# 自动创建 SQLite 数据库表 (如果已存在则不会重新创建)
models.Base.metadata.create_all(bind=engine)


# 确保把当前路径放入 sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入并初始化 RAG 双路召回服务
rag_service = None
try:
    from app.services.rag_service import RAGService
    rag_service = RAGService()
except Exception as e:
    print(f"[RAG] RAG 服务启动加载失败: {e}")

# 导入并初始化知识图谱服务
kg_service = None
try:
    from app.services.knowledge_graph import KnowledgeGraphService
    kg_service = KnowledgeGraphService()
    db = SessionLocal()
    try:
        kg_service.build_graph(db)
        print("[KG] 内存知识图谱初始化构建成功")
    finally:
        db.close()
except Exception as e:
    print(f"[KG] 知识图谱服务启动加载失败: {e}")


app = FastAPI(
    title="岐黄 AI - 中医智能问诊助手 API",
    description="融合 RAG & 知识图谱的中医智能问诊后端服务",
    version="0.1.0"
)

# 在 app.state 中注册底层服务实例，便于关系复杂的路由器获取服务引用而不引入循环导入
app.state.rag_service = rag_service
app.state.kg_service = kg_service

# 配置跨域资源共享 (CORS)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载各个业务模块的路由器
from app.routers import auth as auth_router
from app.routers import chat as chat_router
from app.routers import tcm as tcm_router

app.include_router(auth_router.router)
app.include_router(chat_router.router)
app.include_router(tcm_router.router)


@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "欢迎使用岐黄 AI - 中医智能问诊助手 API",
        "version": "0.1.0"
    }

@app.get("/api/health")
async def health_check():
    rag_status = "offline"
    if app.state.rag_service and getattr(app.state.rag_service, "initialized", False):
        rag_status = "online"
    return {
        "status": "healthy",
        "database": "sqlite (WAL mode online)",
        "rag_service": rag_status
    }
