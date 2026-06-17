from app import models
from app.core.database import SessionLocal

def bg_update_herb_index(herb_id: str, rag_service, kg_service, is_new: bool = False):
    db = SessionLocal()
    try:
        db_herb = db.query(models.Herb).filter(models.Herb.id == herb_id).first()
        if not db_herb:
            print(f"[BG-TASK] Warning: Herb {herb_id} not found in database for indexing.")
            return
            
        if rag_service and getattr(rag_service, "initialized", False):
            try:
                meridians_str = "、".join(db_herb.meridians) if isinstance(db_herb.meridians, list) else str(db_herb.meridians)
                content = (
                    f"名称: {db_herb.name}。拼音: {db_herb.pinyin}。分类: {db_herb.category}。"
                    f"药性: {db_herb.temperature}。药味: {db_herb.nature}。归经: {meridians_str}。"
                    f"功效: {db_herb.functions}。用法: {db_herb.usage}。出处: {db_herb.classic_ref or '未知'}。"
                    f"描述: {db_herb.description}。禁忌: {db_herb.contraindications or '无'}"
                )
                metadata = {
                    "type": "herb",
                    "id": db_herb.id,
                    "name": db_herb.name,
                    "category": db_herb.category
                }
                if is_new:
                    rag_service.add_document(f"herb_{db_herb.id}", content, metadata)
                else:
                    rag_service.update_document(f"herb_{db_herb.id}", content, metadata)
                print(f"[BG-TASK] RAG index updated for herb: {db_herb.name}")
            except Exception as e:
                print(f"[BG-TASK] RAG index update failed for herb {herb_id}: {e}")
                
        if kg_service:
            try:
                kg_service.build_graph(db, force=True)
                print(f"[BG-TASK] Knowledge Graph successfully rebuilt for herb: {db_herb.name}")
            except Exception as e:
                print(f"[BG-TASK] Knowledge Graph rebuild failed for herb {herb_id}: {e}")
    finally:
        db.close()

def bg_delete_herb_index(herb_id: str, herb_name: str, rag_service, kg_service):
    db = SessionLocal()
    try:
        if rag_service and getattr(rag_service, "initialized", False):
            try:
                rag_service.delete_document(f"herb_{herb_id}")
                print(f"[BG-TASK] RAG index deleted for herb: {herb_name}")
            except Exception as e:
                print(f"[BG-TASK] RAG index delete failed for herb {herb_id}: {e}")
                
        if kg_service:
            try:
                kg_service.build_graph(db, force=True)
                print(f"[BG-TASK] Knowledge Graph successfully rebuilt after deleting herb: {herb_name}")
            except Exception as e:
                print(f"[BG-TASK] Knowledge Graph rebuild failed after deleting herb {herb_id}: {e}")
    finally:
        db.close()

def bg_update_prescription_index(pres_id: str, rag_service, kg_service, is_new: bool = False):
    db = SessionLocal()
    try:
        db_pres = db.query(models.Prescription).filter(models.Prescription.id == pres_id).first()
        if not db_pres:
            print(f"[BG-TASK] Warning: Prescription {pres_id} not found in database for indexing.")
            return
            
        if rag_service and getattr(rag_service, "initialized", False):
            try:
                comp_parts = []
                if isinstance(db_pres.composition, dict):
                    for herb, dosage in db_pres.composition.items():
                        comp_parts.append(f"{herb}({dosage})")
                comp_str = "、".join(comp_parts)

                content = (
                    f"名称: {db_pres.name}。拼音: {db_pres.pinyin}。来源: {db_pres.source or '未知'}。"
                    f"组成: {comp_str}。功用: {db_pres.functions}。主治: {db_pres.indications}。"
                    f"用法: {db_pres.usage}。描述: {db_pres.description or ''}。禁忌: {db_pres.contraindications or '无'}"
                )
                metadata = {
                    "type": "prescription",
                    "id": db_pres.id,
                    "name": db_pres.name,
                    "source": db_pres.source or "未知"
                }
                if is_new:
                    rag_service.add_document(f"pres_{db_pres.id}", content, metadata)
                else:
                    rag_service.update_document(f"pres_{db_pres.id}", content, metadata)
                print(f"[BG-TASK] RAG index updated for prescription: {db_pres.name}")
            except Exception as e:
                print(f"[BG-TASK] RAG index update failed for prescription {pres_id}: {e}")
                
        if kg_service:
            try:
                kg_service.build_graph(db, force=True)
                print(f"[BG-TASK] Knowledge Graph successfully rebuilt for prescription: {db_pres.name}")
            except Exception as e:
                print(f"[BG-TASK] Knowledge Graph rebuild failed for prescription {pres_id}: {e}")
    finally:
        db.close()

def bg_delete_prescription_index(pres_id: str, pres_name: str, rag_service, kg_service):
    db = SessionLocal()
    try:
        if rag_service and getattr(rag_service, "initialized", False):
            try:
                rag_service.delete_document(f"pres_{pres_id}")
                print(f"[BG-TASK] RAG index deleted for prescription: {pres_name}")
            except Exception as e:
                print(f"[BG-TASK] RAG index delete failed for prescription {pres_id}: {e}")
                
        if kg_service:
            try:
                kg_service.build_graph(db, force=True)
                print(f"[BG-TASK] Knowledge Graph successfully rebuilt after deleting prescription: {pres_name}")
            except Exception as e:
                print(f"[BG-TASK] Knowledge Graph rebuild failed after deleting prescription {pres_id}: {e}")
    finally:
        db.close()
