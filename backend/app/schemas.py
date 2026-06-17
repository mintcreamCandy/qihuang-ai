from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Union
import datetime

# --- 用户 Schema ---
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = "中医同道"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="密码，长度不低于6位")
    admin_key: Optional[str] = Field(None, description="管理员注册密钥")

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime
    is_admin: bool = False

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- JWT Token Schema ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- 用户健康画像 Schema ---
class ProfileBase(BaseModel):
    constitution: Optional[str] = "未测试"
    gender: Optional[str] = None
    age: Optional[Union[int, str]] = None  # 支持以字符串或整数存储，兼容前端展示与数据库整型字段
    characteristics: Optional[List[str]] = []

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    user_id: int
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# --- 问诊对话消息 Schema ---
class ChatMessageBase(BaseModel):
    role: str  # "user" 或 "assistant"
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- 问诊对话会话 Schema ---
class ChatSessionBase(BaseModel):
    id: str
    title: str

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionResponse(ChatSessionBase):
    created_at: datetime.datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

# --- 中药 Schema ---
class HerbBase(BaseModel):
    id: str
    name: str
    pinyin: str
    pinyin_flat: str
    latin: Optional[str] = None
    image: Optional[str] = None
    category: str
    nature: Optional[str] = None
    temperature: Optional[str] = None
    meridians: Optional[List[str]] = []
    functions: Optional[str] = None
    usage: Optional[str] = None
    classic_ref: Optional[str] = None
    description: Optional[str] = None
    contraindications: Optional[str] = None

class HerbCreate(HerbBase):
    pass

class HerbResponse(HerbBase):
    class Config:
        from_attributes = True

# --- 方剂 Schema ---
class PrescriptionBase(BaseModel):
    id: str
    name: str
    pinyin: str
    pinyin_flat: str
    source: Optional[str] = None
    composition: Optional[dict] = {}  # 键值对，例如 {"桂枝": "9g"}
    functions: Optional[str] = None
    indications: Optional[str] = None
    usage: Optional[str] = None
    description: Optional[str] = None
    contraindications: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionResponse(PrescriptionBase):
    class Config:
        from_attributes = True
