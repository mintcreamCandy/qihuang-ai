from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app import models
from app import schemas
from app.core import auth
from app.core.database import get_db

router = APIRouter()

@router.get("/api/rag/search", tags=["RAG 检索"])
def rag_search(query: str, request: Request, top_k: int = 5):
    """
    RAG 双路召回检索接口 (BM25 + 向量检索 + RRF 融合)
    """
    # 从 app.state 获取 RAG 服务实例
    rag_service = request.app.state.rag_service
    
    # 动态兜底加载 RAG 服务，防止启动时尚未完成索引的构建
    if not rag_service or not getattr(rag_service, "initialized", False):
        try:
            from app.services.rag_service import RAGService
            rag_service = RAGService()
            request.app.state.rag_service = rag_service
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"RAG 检索服务暂不可用或未初始化: {str(e)}"
            )
            
    if not rag_service or not rag_service.initialized:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG 检索服务未成功初始化，请检查后台索引数据。"
        )
        
    try:
        results = rag_service.search(query, top_k=top_k)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG 检索执行出错: {str(e)}"
        )


@router.get("/api/chat/sessions", response_model=list[schemas.ChatSessionResponse], tags=["Chat 问诊会话"])
def get_chat_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有会话列表"""
    sessions = db.query(models.ChatSession).filter(
        models.ChatSession.user_id == current_user.id
    ).order_by(models.ChatSession.created_at.desc()).all()
    return sessions

@router.post("/api/chat/sessions", response_model=schemas.ChatSessionResponse, tags=["Chat 问诊会话"])
def create_chat_session(
    session_data: schemas.ChatSessionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """创建或保存新会话"""
    existing = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_data.id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if existing:
        return existing
        
    new_session = models.ChatSession(
        id=session_data.id,
        user_id=current_user.id,
        title=session_data.title
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.post("/api/chat/sessions/{session_id}/title", tags=["Chat 问诊会话"])
def update_chat_session_title(
    session_id: str,
    title_data: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """更新会话标题"""
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
        
    session.title = title_data.get("title", session.title)
    db.commit()
    return {"status": "success", "title": session.title}

@router.delete("/api/chat/sessions/{session_id}", tags=["Chat 问诊会话"])
def delete_chat_session(
    session_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """删除指定会话"""
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
        
    db.delete(session)
    db.commit()
    return {"status": "success", "detail": "会话已删除"}

@router.get("/api/chat/sessions/{session_id}/messages", response_model=list[schemas.ChatMessageResponse], tags=["Chat 问诊会话"])
def get_session_messages(
    session_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定会话下的所有消息记录"""
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
        
    return session.messages

@router.post("/api/chat/sessions/{session_id}/messages", response_model=schemas.ChatMessageResponse, tags=["Chat 问诊会话"])
def add_session_message(
    session_id: str,
    message_data: schemas.ChatMessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """向指定会话中添加一条新消息"""
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
        
    new_message = models.ChatMessage(
        session_id=session_id,
        role=message_data.role,
        content=message_data.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message
