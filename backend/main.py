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

# SQLite 数据库表结构动态迁移 (为 users 表增加 is_admin 字段)
db_migration = SessionLocal()
try:
    # 检查 users 表是否包含 is_admin 字段
    cursor = db_migration.execute(text("PRAGMA table_info(users)"))
    columns = [row[1] for row in cursor.fetchall()]
    if "is_admin" not in columns:
        print("[DB] users 表中检测到缺失 is_admin 字段，正在执行动态迁移...")
        db_migration.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
        db_migration.commit()
        print("[DB] users 表 is_admin 字段迁移成功！")
        
    # 初始化默认超级管理员账户
    admin_email = "admin@qihuang.com"
    from app.core import auth  # 导入 auth 模块进行密码哈希
    admin_user = db_migration.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user:
        print("[DB] 超级管理员账号不存在，正在创建默认管理员...")
        hashed_password = auth.get_password_hash("admin123")
        new_admin = models.User(
            email=admin_email,
            hashed_password=hashed_password,
            name="超级管理员",
            is_admin=True
        )
        db_migration.add(new_admin)
        db_migration.commit()
        db_migration.refresh(new_admin)
        
        # 为超级管理员初始化空白健康画像 (Profile)
        new_profile = models.Profile(user_id=new_admin.id)
        db_migration.add(new_profile)
        db_migration.commit()
        print("[DB] 默认管理员创建成功: admin@qihuang.com / admin123")
except Exception as e:
    print(f"[DB] 数据库迁移或初始化管理员失败: {e}")
finally:
    db_migration.close()

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
