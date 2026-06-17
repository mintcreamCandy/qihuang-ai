from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import SQLALCHEMY_DATABASE_URL

# connect_args={"check_same_thread": False} 是 SQLite 特有的配置，
# 允许 FastAPI 在多线程环境下并发安全地访问 SQLite 数据库
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# 使用 event listener 监听数据库连接建立事件，自动开启 WAL (Write-Ahead Logging) 模式
# 从而大幅提升 SQLite 的多用户并发读写性能，解决读写互斥问题
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

# 数据库会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 声明式模型基类
Base = declarative_base()

# FastAPI 依赖项：获取数据库连接会话并在请求结束后自动关闭
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
