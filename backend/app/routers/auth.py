from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import datetime

from app import models
from app import schemas
from app.core import auth
from app.core.database import get_db

router = APIRouter()

@router.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth 用户鉴权"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 检查邮箱是否已被注册
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册，请直接登录"
        )
    
    # 创建新用户
    hashed_password = auth.get_password_hash(user.password)
    is_admin = False
    if user.admin_key == "qihuangadmin123":
        is_admin = True
        
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        is_admin=is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 自动为新用户初始化空白健康画像 (Profile)
    new_profile = models.Profile(user_id=new_user.id)
    db.add(new_profile)
    db.commit()

    return new_user

@router.post("/api/auth/login", response_model=schemas.Token, tags=["Auth 用户鉴权"])
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # 查询用户
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱或密码不正确，请重新输入"
        )
    
    # 签发 JWT Token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/api/auth/me", response_model=schemas.UserResponse, tags=["Auth 用户鉴权"])
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    """获取当前登录用户信息"""
    return current_user

@router.get("/api/profile", response_model=schemas.ProfileResponse, tags=["User 健康画像"])
def get_profile(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    """获取当前登录用户的健康画像"""
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        # 兜底防御：若未找到，则立即为用户补建一个画像
        profile = models.Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/api/profile", response_model=schemas.ProfileResponse, tags=["User 健康画像"])
def update_profile(
    profile_update: schemas.ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """更新当前登录用户的健康画像 (如体质测试结果、性别、年龄等)"""
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        profile = models.Profile(user_id=current_user.id)
        db.add(profile)
        
    # 动态更新字段（仅更新不为 None 的字段，防止缺省字段抹去已存的年龄或性别）
    if profile_update.constitution is not None:
        profile.constitution = profile_update.constitution
    if profile_update.gender is not None:
        profile.gender = profile_update.gender
    if profile_update.age is not None:
        try:
            profile.age = int(profile_update.age)
        except (ValueError, TypeError):
            pass
    if profile_update.characteristics is not None:
        profile.characteristics = profile_update.characteristics
    profile.updated_at = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(profile)
    return profile
