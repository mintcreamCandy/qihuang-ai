import os

# Base directory calculations
CORE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/app/core
APP_DIR = os.path.dirname(CORE_DIR)                   # backend/app
BACKEND_DIR = os.path.dirname(APP_DIR)               # backend

# Centralized data directory (all database/indexes/caches reside here)
DATA_DIR = os.path.join(BACKEND_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Centralized paths
DATABASE_PATH = os.path.join(DATA_DIR, "qihuang.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

BM25_INDEX_PATH = os.path.join(DATA_DIR, "bm25_index.pkl")
CHROMA_DB_PATH = os.path.join(DATA_DIR, "chroma_db")
TCM_DICT_PATH = os.path.join(DATA_DIR, "tcm_dict.txt")
KG_CACHE_PATH = os.path.join(DATA_DIR, "kg_cache.pkl")
