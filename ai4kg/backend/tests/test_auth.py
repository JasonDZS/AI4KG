"""
认证接口测试 - 测试 auth.py 路由
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.auth
class TestUserRegistration:
    """用户注册测试"""
    
    def test_register_success(self, client: TestClient, sample_user_data):
        """测试成功注册"""
        response = client.post("/api/auth/register", json=sample_user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "用户注册成功"
        assert "data" in data
        assert "user" in data["data"]
        assert "token" in data["data"]
        
        # 验证用户信息
        user = data["data"]["user"]
        assert user["username"] == sample_user_data["username"]
        assert user["email"] == sample_user_data["email"]
        assert "id" in user
        assert "created_at" in user
        
        # 验证token存在
        assert isinstance(data["data"]["token"], str)
        assert len(data["data"]["token"]) > 0
    
    def test_register_duplicate_username(self, client: TestClient, sample_user_data):
        """测试重复用户名注册"""
        # 第一次注册
        response1 = client.post("/api/auth/register", json=sample_user_data)
        assert response1.status_code == 200
        
        # 第二次注册相同用户名
        response2 = client.post("/api/auth/register", json=sample_user_data)
        assert response2.status_code in [400, 409]  # 可能是400或409状态码
        
        data = response2.json()
        assert "detail" in data
    
    def test_register_duplicate_email(self, client: TestClient, sample_user_data):
        """测试重复邮箱注册"""
        # 第一次注册
        response1 = client.post("/api/auth/register", json=sample_user_data)
        assert response1.status_code == 200
        
        # 第二次注册不同用户名但相同邮箱
        duplicate_email_data = sample_user_data.copy()
        duplicate_email_data["username"] = "different_user"
        
        response2 = client.post("/api/auth/register", json=duplicate_email_data)
        assert response2.status_code in [400, 409]
        
        data = response2.json()
        assert "detail" in data
    
    def test_register_invalid_email(self, client: TestClient, sample_user_data):
        """测试无效邮箱格式"""
        invalid_data = sample_user_data.copy()
        invalid_data["email"] = "invalid-email"
        
        response = client.post("/api/auth/register", json=invalid_data)
        assert response.status_code == 422
        
        data = response.json()
        assert "detail" in data
    
    def test_register_missing_fields(self, client: TestClient):
        """测试缺少必填字段"""
        incomplete_data = {"username": "testuser"}
        
        response = client.post("/api/auth/register", json=incomplete_data)
        assert response.status_code == 422
        
        data = response.json()
        assert "detail" in data
    
    def test_register_weak_password(self, client: TestClient, sample_user_data):
        """测试弱密码"""
        weak_password_data = sample_user_data.copy()
        weak_password_data["password"] = "123"
        
        response = client.post("/api/auth/register", json=weak_password_data)
        # 根据实际的密码验证规则，应该返回400
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        assert "密码长度至少6位" in data["detail"]


@pytest.mark.auth
class TestUserLogin:
    """用户登录测试"""
    
    def test_login_success(self, client: TestClient, sample_user_data):
        """测试成功登录"""
        # 先注册用户
        register_response = client.post("/api/auth/register", json=sample_user_data)
        assert register_response.status_code == 200
        
        # 登录
        login_data = {
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        }
        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "user" in data["data"]
        assert "token" in data["data"]
        
        # 验证用户信息
        user = data["data"]["user"]
        assert user["username"] == sample_user_data["username"]
        assert user["email"] == sample_user_data["email"]
        
        # 验证token
        assert isinstance(data["data"]["token"], str)
        assert len(data["data"]["token"]) > 0
    
    def test_login_wrong_password(self, client: TestClient, sample_user_data):
        """测试错误密码登录"""
        # 先注册用户
        register_response = client.post("/api/auth/register", json=sample_user_data)
        assert register_response.status_code == 200
        
        # 使用错误密码登录
        login_data = {
            "username": sample_user_data["username"],
            "password": "wrongpassword"
        }
        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 401
        
        data = response.json()
        assert "detail" in data
        assert "用户名或密码错误" in data["detail"]
    
    def test_login_nonexistent_user(self, client: TestClient):
        """测试不存在的用户登录"""
        login_data = {
            "username": "nonexistent",
            "password": "password"
        }
        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 401
        
        data = response.json()
        assert "detail" in data
        assert "用户名或密码错误" in data["detail"]
    
    def test_login_missing_fields(self, client: TestClient):
        """测试缺少登录字段"""
        incomplete_data = {"username": "testuser"}
        
        response = client.post("/api/auth/login", json=incomplete_data)
        assert response.status_code == 422
        
        data = response.json()
        assert "detail" in data
    
    def test_login_empty_credentials(self, client: TestClient):
        """测试空凭据登录"""
        empty_data = {"username": "", "password": ""}
        
        response = client.post("/api/auth/login", json=empty_data)
        assert response.status_code in [400, 401, 422]


@pytest.mark.auth
class TestTokenAuthentication:
    """Token认证测试"""
    
    def test_token_validation(self, client: TestClient, authenticated_user):
        """测试token验证"""
        # 使用token访问需要认证的端点
        response = client.get(
            "/api/graphs",
            headers=authenticated_user["headers"]
        )
        # 应该返回200而不是401
        assert response.status_code == 200
    
    def test_invalid_token(self, client: TestClient):
        """测试无效token"""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/graphs", headers=headers)
        assert response.status_code == 401
    
    def test_missing_token(self, client: TestClient):
        """测试缺少token"""
        response = client.get("/api/graphs")
        assert response.status_code == 401
    
    def test_malformed_token_header(self, client: TestClient):
        """测试格式错误的token header"""
        headers = {"Authorization": "InvalidFormat token"}
        response = client.get("/api/graphs", headers=headers)
        assert response.status_code == 401
    
    def test_empty_token(self, client: TestClient):
        """测试空token"""
        headers = {"Authorization": "Bearer "}
        response = client.get("/api/graphs", headers=headers)
        assert response.status_code == 401


@pytest.mark.auth
class TestUserProfile:
    """用户档案测试"""
    
    def test_get_current_user_info(self, client: TestClient, authenticated_user):
        """测试获取当前用户信息"""
        # 如果有获取用户信息的端点，可以在这里测试
        # 目前基于提供的代码，这个端点可能还未实现
        pass
    
    def test_user_permissions(self, client: TestClient, authenticated_user):
        """测试用户权限"""
        # 测试用户只能访问自己的资源
        pass


@pytest.mark.auth
class TestAuthenticationEdgeCases:
    """认证边界情况测试"""
    
    def test_concurrent_registrations(self, client: TestClient):
        """测试并发注册"""
        # 这个测试可能需要更复杂的并发测试框架
        pass
    
    def test_sql_injection_attempts(self, client: TestClient):
        """测试SQL注入防护"""
        malicious_data = {
            "username": "'; DROP TABLE users; --",
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = client.post("/api/auth/register", json=malicious_data)
        # 应该正常处理或返回验证错误，而不是500错误
        assert response.status_code in [200, 400, 422]
    
    def test_xss_prevention(self, client: TestClient):
        """测试XSS防护"""
        xss_data = {
            "username": "<script>alert('xss')</script>",
            "email": "test@example.com", 
            "password": "password123"
        }
        
        response = client.post("/api/auth/register", json=xss_data)
        # 应该正常处理或返回验证错误
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            data = response.json()
            # 确保返回的用户名中没有原始脚本标签
            user = data["data"]["user"]
            assert "<script>" not in user["username"]
            # 验证用户名已被清理和HTML转义
            assert user["username"] == "alert(&#x27;xss&#x27;)"
