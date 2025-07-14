from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from neo4j import GraphDatabase
import redis
import os
from typing import AsyncGenerator

from app.core.config import get_settings

settings = get_settings()

# 确保数据目录存在
os.makedirs(os.path.dirname(settings.SQLITE_DB_PATH), exist_ok=True)

# SQLite 数据库配置
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # SQLite 需要这个参数
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()
Base = declarative_base(metadata=metadata)

# Neo4j 数据库配置
neo4j_driver = None

# Redis 配置
redis_client = None

async def init_databases():
    """初始化数据库连接"""
    global neo4j_driver, redis_client
    
    # 初始化 Neo4j（可选）
    try:
        neo4j_driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
        # 测试连接
        with neo4j_driver.session() as session:
            session.run("RETURN 1")
        print("✅ Neo4j连接成功")
    except Exception as e:
        print(f"⚠️ Neo4j连接失败，将跳过图数据存储: {e}")
        neo4j_driver = None
    
    # 初始化 Redis（可选）
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()
        print("✅ Redis连接成功")
    except Exception as e:
        print(f"⚠️ Redis连接失败，将跳过缓存功能: {e}")
        redis_client = None
    
    # 创建 SQLite 表
    Base.metadata.create_all(bind=engine)
    print("✅ SQLite数据库初始化完成")

async def close_databases():
    """关闭数据库连接"""
    global neo4j_driver, redis_client
    
    if neo4j_driver:
        neo4j_driver.close()
    
    if redis_client:
        await redis_client.close()

def get_db():
    """获取SQLite数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_neo4j_session():
    """获取Neo4j会话"""
    if neo4j_driver is None:
        raise Exception("Neo4j驱动未初始化")
    return neo4j_driver.session()

def get_redis():
    """获取Redis客户端"""
    return redis_client