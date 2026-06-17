from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app import models
from app import schemas
from app.core import auth
from app.core.database import get_db
from app.background.background_tasks import (
    bg_update_herb_index,
    bg_delete_herb_index,
    bg_update_prescription_index,
    bg_delete_prescription_index
)

router = APIRouter()

async def get_current_admin(current_user: models.User = Depends(auth.get_current_user)) -> models.User:
    """验证当前用户是否为管理员"""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，仅限管理员操作"
        )
    return current_user


@router.get("/api/herbs", response_model=list[schemas.HerbResponse], tags=["TCM 百科数据库"])
def get_herbs(
    category: str = None,
    search: str = None,
    db: Session = Depends(get_db)
):
    """获取并过滤中药列表，支持分类筛选和模糊搜索"""
    query = db.query(models.Herb)
    
    # 分类过滤
    if category and category != "全部":
        query = query.filter(models.Herb.category == category)
        
    # 模糊检索
    if search:
        search_clean = search.strip().lower()
        search_pattern = f"%{search_clean}%"
        query = query.filter(
            or_(
                models.Herb.name.like(search_pattern),
                models.Herb.pinyin_flat.like(search_pattern),
                models.Herb.category.like(search_pattern),
                models.Herb.functions.like(search_pattern),
                models.Herb.description.like(search_pattern)
            )
        )
        
    return query.all()


@router.get("/api/prescriptions", response_model=list[schemas.PrescriptionResponse], tags=["TCM 百科数据库"])
def get_prescriptions(
    source: str = None,
    search: str = None,
    db: Session = Depends(get_db)
):
    """获取并过滤方剂列表，支持来源筛选和模糊搜索"""
    query = db.query(models.Prescription)
    
    # 来源过滤
    if source:
        query = query.filter(models.Prescription.source == source)
        
    # 模糊检索
    if search:
        search_clean = search.strip().lower()
        search_pattern = f"%{search_clean}%"
        query = query.filter(
            or_(
                models.Prescription.name.like(search_pattern),
                models.Prescription.pinyin_flat.like(search_pattern),
                models.Prescription.functions.like(search_pattern),
                models.Prescription.indications.like(search_pattern),
                models.Prescription.description.like(search_pattern)
            )
        )
        
    return query.all()


@router.post("/api/admin/herbs", response_model=schemas.HerbResponse, status_code=status.HTTP_201_CREATED, tags=["Admin 后台管理"])
def create_herb(
    herb: schemas.HerbCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """管理员新增中药材，并异步更新 RAG 索引与知识图谱"""
    db_herb = db.query(models.Herb).filter(or_(models.Herb.id == herb.id, models.Herb.name == herb.name)).first()
    if db_herb:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="药材 ID 或名称已存在"
        )
    
    new_herb = models.Herb(**herb.dict())
    db.add(new_herb)
    db.commit()
    db.refresh(new_herb)
    
    # 异步调度 RAG 索引和知识图谱重建任务
    background_tasks.add_task(
        bg_update_herb_index,
        new_herb.id,
        request.app.state.rag_service,
        request.app.state.kg_service,
        True
    )
    
    return new_herb


@router.put("/api/admin/herbs/{herb_id}", response_model=schemas.HerbResponse, tags=["Admin 后台管理"])
def update_herb(
    herb_id: str,
    herb_update: schemas.HerbCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """管理员编辑中药材，并异步更新 RAG 索引与知识图谱"""
    db_herb = db.query(models.Herb).filter(models.Herb.id == herb_id).first()
    if not db_herb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该药材"
        )
    
    # 更新字段
    for key, value in herb_update.dict().items():
        if key != "id":
            setattr(db_herb, key, value)
            
    db.commit()
    db.refresh(db_herb)
    
    # 异步调度 RAG 索引和知识图谱重建任务
    background_tasks.add_task(
        bg_update_herb_index,
        db_herb.id,
        request.app.state.rag_service,
        request.app.state.kg_service,
        False
    )

    return db_herb


@router.delete("/api/admin/herbs/{herb_id}", tags=["Admin 后台管理"])
def delete_herb(
    herb_id: str,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """管理员删除中药材，并异步更新 RAG 索引与知识图谱"""
    db_herb = db.query(models.Herb).filter(models.Herb.id == herb_id).first()
    if not db_herb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该药材"
        )
    
    herb_name = db_herb.name
    db.delete(db_herb)
    db.commit()
    
    # 异步调度 RAG 索引和知识图谱删除/重建任务
    background_tasks.add_task(
        bg_delete_herb_index,
        herb_id,
        herb_name,
        request.app.state.rag_service,
        request.app.state.kg_service
    )

    return {"status": "success", "detail": f"药材 {herb_name} 已成功删除"}


@router.post("/api/admin/prescriptions", response_model=schemas.PrescriptionResponse, status_code=status.HTTP_201_CREATED, tags=["Admin 后台管理"])
def create_prescription(
    prescription: schemas.PrescriptionCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """管理员新增方剂，并异步更新 RAG 索引与知识图谱"""
    db_pres = db.query(models.Prescription).filter(
        or_(models.Prescription.id == prescription.id, models.Prescription.name == prescription.name)
    ).first()
    if db_pres:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="方剂 ID 或名称已存在"
        )
    
    new_pres = models.Prescription(**prescription.dict())
    db.add(new_pres)
    db.commit()
    db.refresh(new_pres)
    
    # 异步调度 RAG 索引和知识图谱重建任务
    background_tasks.add_task(
        bg_update_prescription_index,
        new_pres.id,
        request.app.state.rag_service,
        request.app.state.kg_service,
        True
    )

    return new_pres


@router.put("/api/admin/prescriptions/{pres_id}", response_model=schemas.PrescriptionResponse, tags=["Admin 后台管理"])
def update_prescription(
    pres_id: str,
    pres_update: schemas.PrescriptionCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """管理员编辑方剂，并异步更新 RAG 索引与知识图谱"""
    db_pres = db.query(models.Prescription).filter(models.Prescription.id == pres_id).first()
    if not db_pres:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该方剂"
        )
    
    # 更新字段
    for key, value in pres_update.dict().items():
        if key != "id":
            setattr(db_pres, key, value)
            
    db.commit()
    db.refresh(db_pres)
    
    # 异步调度 RAG 索引和知识图谱重建任务
    background_tasks.add_task(
        bg_update_prescription_index,
        db_pres.id,
        request.app.state.rag_service,
        request.app.state.kg_service,
        False
    )

    return db_pres


@router.delete("/api/admin/prescriptions/{pres_id}", tags=["Admin 后台管理"])
def delete_prescription(
    pres_id: str,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """管理员删除方剂，并异步更新 RAG 索引与知识图谱"""
    db_pres = db.query(models.Prescription).filter(models.Prescription.id == pres_id).first()
    if not db_pres:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该方剂"
        )
    
    pres_name = db_pres.name
    db.delete(db_pres)
    db.commit()
    
    # 异步调度 RAG 索引和知识图谱删除/重建任务
    background_tasks.add_task(
        bg_delete_prescription_index,
        pres_id,
        pres_name,
        request.app.state.rag_service,
        request.app.state.kg_service
    )

    return {"status": "success", "detail": f"方剂 {pres_name} 已成功删除"}


@router.get("/api/kg/graph", tags=["KG 知识图谱"])
def get_kg_graph(request: Request, db: Session = Depends(get_db)):
    """获取完整的知识图谱拓扑数据 (nodes & links) 用于前端 Canvas 渲染"""
    kg_service = request.app.state.kg_service
    if not kg_service:
        raise HTTPException(status_code=500, detail="知识图谱服务不可用")
    kg_service.build_graph(db)
    return kg_service.get_graph_data()


@router.get("/api/kg/reason", tags=["KG 知识图谱"])
def get_kg_reason(query: str, request: Request, db: Session = Depends(get_db)):
    """基于知识图谱对查询进行辨证与推荐推理"""
    kg_service = request.app.state.kg_service
    if not kg_service:
        raise HTTPException(status_code=500, detail="知识图谱服务不可用")
    return kg_service.query_reasoning(query, db)
