import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, default="中医同道")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_admin = Column(Boolean, default=False)

    # 一对一关系：每个用户对应一个健康画像
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # 一对多关系：一个用户可以有多个对话会话
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    constitution = Column(String, default="未测试")  # 体质类型，如：平和质、气虚质等
    gender = Column(String, nullable=True)           # 性别
    age = Column(Integer, nullable=True)              # 年龄
    characteristics = Column(JSON, default=list)      # 体质特征标签列表 (存储为 JSON 数组)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True)  # 对话会话 UUID
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, default="新问诊会话")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # "user" 或 "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class Herb(Base):
    __tablename__ = "herbs"

    id = Column(String, primary_key=True)  # 例如 'renshen'
    name = Column(String, unique=True, index=True, nullable=False)
    pinyin = Column(String, nullable=False)
    pinyin_flat = Column(String, index=True, nullable=False)
    latin = Column(String, nullable=True)
    image = Column(String, nullable=True)
    category = Column(String, index=True, nullable=False)
    nature = Column(String, nullable=True)
    temperature = Column(String, nullable=True)
    meridians = Column(JSON, nullable=True)  # 存储为 JSON 数组，如 ["脾", "肺", "心"]
    functions = Column(Text, nullable=True)
    usage = Column(Text, nullable=True)
    classic_ref = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    contraindications = Column(Text, nullable=True)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String, primary_key=True)  # 例如 'gui-zhi-tang'
    name = Column(String, unique=True, index=True, nullable=False)
    pinyin = Column(String, nullable=False)
    pinyin_flat = Column(String, index=True, nullable=False)
    source = Column(String, index=True, nullable=True)      # 例如 '《伤寒论》'
    composition = Column(JSON, nullable=True)              # 存储为 JSON 键值对，如 {"桂枝": "9g", "芍药": "9g"}
    functions = Column(Text, nullable=True)
    indications = Column(Text, nullable=True)
    usage = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    contraindications = Column(Text, nullable=True)
