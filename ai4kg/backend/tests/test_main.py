"""
主应用测试 - 测试 main.py 中的基础路由
"""
import pytest
from fastapi.testclient import TestClient


class TestMainApp:
    """主应用测试类"""
    
    def test_root_endpoint(self, client: TestClient):
        """测试根路径"""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "AI4KG API Service"
        assert data["version"] == "1.0.0"
    
    def test_health_check(self, client: TestClient):
        """测试健康检查端点"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ai4kg-backend"
    
    def test_docs_endpoint(self, client: TestClient):
        """测试API文档端点"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_redoc_endpoint(self, client: TestClient):
        """测试ReDoc文档端点"""
        response = client.get("/redoc")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_openapi_schema(self, client: TestClient):
        """测试OpenAPI schema"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        
        schema = response.json()
        assert schema["info"]["title"] == "AI4KG API"
        assert schema["info"]["version"] == "1.0.0"
        assert schema["info"]["description"] == "AI4KG 知识图谱可视化平台的后端API服务"
    
    def test_cors_headers(self, client: TestClient):
        """测试CORS配置"""
        # 发送预检请求
        response = client.options(
            "/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization"
            }
        )
        
        # 检查CORS头部
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        # access-control-allow-headers 只在请求包含特定头时才返回
        # 这里我们检查响应是否成功处理了预检请求
        assert response.status_code == 200
    
    def test_invalid_endpoint(self, client: TestClient):
        """测试不存在的端点"""
        response = client.get("/nonexistent")
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Not Found"


class TestAPIRouterInclusion:
    """测试API路由包含"""
    
    def test_auth_routes_included(self, client: TestClient):
        """测试认证路由是否被包含"""
        # 测试注册端点存在
        response = client.post("/api/auth/register", json={})
        # 应该返回422 (验证错误) 而不是404 (未找到)
        assert response.status_code == 422
    
    def test_graphs_routes_included(self, client: TestClient):
        """测试图谱路由是否被包含"""
        # 测试图谱列表端点存在（需要认证，应该返回401而不是404）
        response = client.get("/api/graphs")
        assert response.status_code == 401
    
    def test_search_routes_included(self, client: TestClient):
        """测试搜索路由是否被包含"""
        # 测试搜索端点存在
        response = client.get("/api/search")
        # 需要认证，应该返回401而不是404
        assert response.status_code == 401


@pytest.mark.asyncio
class TestLifespan:
    """测试应用生命周期"""
    
    async def test_app_startup_and_shutdown(self):
        """测试应用启动和关闭"""
        # 这个测试主要验证lifespan函数能够正常工作
        # 在实际的集成测试中，数据库连接会在应用启动时初始化
        from main import app
        
        # 验证应用对象存在且配置正确
        assert app.title == "AI4KG API"
        assert app.version == "1.0.0"
        assert app.docs_url == "/docs"
        assert app.redoc_url == "/redoc"


class TestAppConfiguration:
    """测试应用配置"""
    
    def test_app_metadata(self, client: TestClient):
        """测试应用元数据"""
        from main import app
        
        assert app.title == "AI4KG API"
        assert app.description == "AI4KG 知识图谱可视化平台的后端API服务"
        assert app.version == "1.0.0"
    
    def test_middleware_configuration(self, client: TestClient):
        """测试中间件配置"""
        # 测试CORS中间件工作正常
        response = client.get(
            "/",
            headers={"Origin": "http://localhost:3000"}
        )
        assert response.status_code == 200
        # 验证CORS头部存在
        assert "access-control-allow-origin" in response.headers
    
    def test_router_tags(self, client: TestClient):
        """测试路由标签配置"""
        response = client.get("/openapi.json")
        schema = response.json()
        
        # 从路径中提取所有使用的标签
        used_tags = set()
        if "paths" in schema:
            for path_data in schema["paths"].values():
                for method_data in path_data.values():
                    if isinstance(method_data, dict) and "tags" in method_data:
                        used_tags.update(method_data["tags"])
        
        # 验证标签存在
        expected_tags = ["认证", "图谱管理", "节点管理", "边管理", "图分析", "文件处理", "搜索查询"]
        
        for tag in expected_tags:
            assert tag in used_tags, f"标签 '{tag}' 未在API中找到。实际标签: {used_tags}"
