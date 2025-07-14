"""
Pytest 配置文件和共享固件
"""
import pytest
import asyncio
import os
from typing import AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# 设置环境变量和路径
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 设置测试环境变量
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-jwt-signing"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

from main import app
from app.core.database import get_db, Base
from app.models.models import User, Graph, Node, Edge

# 测试数据库配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环用于异步测试"""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    """为每个测试创建独立的数据库会话"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
    
    # 清理表
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """创建测试客户端"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    """示例用户数据"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123"
    }


@pytest.fixture
def sample_graph_data():
    """示例图谱数据"""
    return {
        "title": "测试图谱",
        "description": "这是一个测试图谱"
    }


@pytest.fixture
def sample_node_data():
    """示例节点数据"""
    return {
        "label": "测试节点",
        "type": "person",
        "properties": {"name": "张三", "age": 30}
    }


@pytest.fixture
def sample_edge_data():
    """示例边数据"""
    return {
        "label": "认识",
        "type": "relationship",
        "properties": {"since": "2020"}
    }


@pytest.fixture
def authenticated_user(client, sample_user_data):
    """创建并返回已认证的用户和token"""
    # 注册用户
    register_response = client.post("/api/auth/register", json=sample_user_data)
    assert register_response.status_code == 200
    
    register_data = register_response.json()
    assert register_data["success"] is True
    
    token = register_data["data"]["token"]
    user = register_data["data"]["user"]
    
    return {
        "user": user,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.fixture
def sample_graph(client, authenticated_user, sample_graph_data):
    """创建示例图谱"""
    response = client.post(
        "/api/graphs",
        json=sample_graph_data,
        headers=authenticated_user["headers"]
    )
    assert response.status_code == 200
    
    graph_data = response.json()
    assert graph_data["success"] is True
    
    return graph_data["data"]


# 测试标记
pytest_plugins = ("pytest_asyncio",)


def pytest_configure(config):
    """Pytest 配置"""
    config.addinivalue_line(
        "markers", "auth: 认证相关测试"
    )
    config.addinivalue_line(
        "markers", "graphs: 图谱管理测试"
    )
    config.addinivalue_line(
        "markers", "nodes: 节点管理测试"
    )
    config.addinivalue_line(
        "markers", "edges: 边管理测试"
    )
    config.addinivalue_line(
        "markers", "analysis: 图分析测试"
    )
    config.addinivalue_line(
        "markers", "files: 文件处理测试"
    )
    config.addinivalue_line(
        "markers", "search: 搜索查询测试"
    )
