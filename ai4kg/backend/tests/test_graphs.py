"""
图谱管理接口测试 - 测试 graphs.py 路由
"""
import pytest
from fastapi.testclient import TestClient
import uuid


@pytest.mark.graphs
class TestGraphList:
    """图谱列表测试"""
    
    def test_get_graphs_success(self, client: TestClient, authenticated_user):
        """测试获取图谱列表成功"""
        response = client.get(
            "/api/graphs",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取图谱列表成功"
        assert "data" in data
        assert "graphs" in data["data"]
        assert "total" in data["data"]
        assert isinstance(data["data"]["graphs"], list)
        assert isinstance(data["data"]["total"], int)
    
    def test_get_graphs_with_pagination(self, client: TestClient, authenticated_user):
        """测试分页获取图谱列表"""
        response = client.get(
            "/api/graphs?page=1&size=5",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["graphs"]) <= 5
    
    def test_get_graphs_with_search(self, client: TestClient, authenticated_user):
        """测试搜索图谱"""
        response = client.get(
            "/api/graphs?search=测试",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
    
    def test_get_graphs_invalid_pagination(self, client: TestClient, authenticated_user):
        """测试无效分页参数"""
        # 测试负数页码
        response = client.get(
            "/api/graphs?page=-1",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
        
        # 测试过大的size
        response = client.get(
            "/api/graphs?size=1000",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
    
    def test_get_graphs_unauthorized(self, client: TestClient):
        """测试未授权访问图谱列表"""
        response = client.get("/api/graphs")
        assert response.status_code == 401


@pytest.mark.graphs
class TestGraphCreation:
    """图谱创建测试"""
    
    def test_create_graph_success(self, client: TestClient, authenticated_user, sample_graph_data):
        """测试成功创建图谱"""
        response = client.post(
            "/api/graphs",
            json=sample_graph_data,
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "创建图谱成功"
        assert "data" in data
        
        graph = data["data"]
        assert graph["title"] == sample_graph_data["title"]
        assert graph["description"] == sample_graph_data["description"]
        assert "id" in graph
        assert "metadata" in graph
        assert "created_at" in graph["metadata"]
        assert "updated_at" in graph["metadata"]
    
    def test_create_graph_missing_name(self, client: TestClient, authenticated_user):
        """测试创建图谱缺少标题"""
        invalid_data = {
            "description": "测试描述"
        }
        response = client.post(
            "/api/graphs",
            json=invalid_data,
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422
    
    def test_create_graph_empty_name(self, client: TestClient, authenticated_user):
        """测试创建图谱标题为空"""
        invalid_data = {
            "title": "",
            "description": "测试描述"
        }
        response = client.post(
            "/api/graphs",
            json=invalid_data,
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [400, 422]
    
    def test_create_graph_unauthorized(self, client: TestClient, sample_graph_data):
        """测试未授权创建图谱"""
        response = client.post("/api/graphs", json=sample_graph_data)
        assert response.status_code == 401


@pytest.mark.graphs
class TestGraphRetrieval:
    """图谱获取测试"""
    
    def test_get_graph_success(self, client: TestClient, authenticated_user, sample_graph):
        """测试成功获取单个图谱"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        graph_data = data["data"]
        assert graph_data["id"] == graph_id
        assert "nodes" in graph_data
        assert "edges" in graph_data
        assert isinstance(graph_data["nodes"], list)
        assert isinstance(graph_data["edges"], list)
    
    def test_get_graph_not_found(self, client: TestClient, authenticated_user):
        """测试获取不存在的图谱"""
        fake_id = str(uuid.uuid4())
        response = client.get(
            f"/api/graphs/{fake_id}",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 404
    
    def test_get_graph_invalid_id(self, client: TestClient, authenticated_user):
        """测试获取无效ID的图谱"""
        response = client.get(
            "/api/graphs/invalid-uuid",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 404
    
    def test_get_graph_unauthorized(self, client: TestClient, sample_graph):
        """测试未授权获取图谱"""
        graph_id = sample_graph["id"]
        response = client.get(f"/api/graphs/{graph_id}")
        assert response.status_code == 401
    
    def test_get_other_user_private_graph(self, client: TestClient, sample_graph):
        """测试获取其他用户的私有图谱"""
        # 创建另一个用户
        other_user_data = {
            "username": "otheruser",
            "email": "other@example.com",
            "password": "password123"
        }
        register_response = client.post("/api/auth/register", json=other_user_data)
        assert register_response.status_code == 200
        
        other_token = register_response.json()["data"]["token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}
        
        # 尝试访问第一个用户的私有图谱
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}",
            headers=other_headers
        )
        assert response.status_code in [403, 404]  # 可能是403禁止访问或404未找到


@pytest.mark.graphs
class TestGraphUpdate:
    """图谱更新测试"""
    
    def test_update_graph_success(self, client: TestClient, authenticated_user, sample_graph):
        """测试成功更新图谱"""
        graph_id = sample_graph["id"]
        update_data = {
            "title": "更新后的图谱标题",
            "description": "更新后的描述"
        }
        
        response = client.put(
            f"/api/graphs/{graph_id}",
            json=update_data,
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        updated_graph = data["data"]
        assert updated_graph["title"] == update_data["title"]
        assert updated_graph["description"] == update_data["description"]
    
    def test_update_graph_partial(self, client: TestClient, authenticated_user, sample_graph):
        """测试部分更新图谱"""
        graph_id = sample_graph["id"]
        update_data = {
            "title": "只更新标题"
        }
        
        response = client.put(
            f"/api/graphs/{graph_id}",
            json=update_data,
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == update_data["title"]
    
    def test_update_graph_not_found(self, client: TestClient, authenticated_user):
        """测试更新不存在的图谱"""
        fake_id = str(uuid.uuid4())
        update_data = {"title": "新标题"}
        
        response = client.put(
            f"/api/graphs/{fake_id}",
            json=update_data,
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 404
    
    def test_update_graph_unauthorized(self, client: TestClient, sample_graph):
        """测试未授权更新图谱"""
        graph_id = sample_graph["id"]
        update_data = {"title": "新标题"}
        
        response = client.put(f"/api/graphs/{graph_id}", json=update_data)
        assert response.status_code == 401


@pytest.mark.graphs
class TestGraphDeletion:
    """图谱删除测试"""
    
    def test_delete_graph_success(self, client: TestClient, authenticated_user, sample_graph):
        """测试成功删除图谱"""
        graph_id = sample_graph["id"]
        
        response = client.delete(
            f"/api/graphs/{graph_id}",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "删除图谱成功"
        
        # 验证图谱已被删除
        get_response = client.get(
            f"/api/graphs/{graph_id}",
            headers=authenticated_user["headers"]
        )
        assert get_response.status_code == 404
    
    def test_delete_graph_not_found(self, client: TestClient, authenticated_user):
        """测试删除不存在的图谱"""
        fake_id = str(uuid.uuid4())
        
        response = client.delete(
            f"/api/graphs/{fake_id}",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 404
    
    def test_delete_graph_unauthorized(self, client: TestClient, sample_graph):
        """测试未授权删除图谱"""
        graph_id = sample_graph["id"]
        
        response = client.delete(f"/api/graphs/{graph_id}")
        assert response.status_code == 401


@pytest.mark.graphs
class TestGraphEdgeCases:
    """图谱边界情况测试"""
    
    def test_create_graph_with_special_characters(self, client: TestClient, authenticated_user):
        """测试创建包含特殊字符的图谱"""
        special_data = {
            "title": "图谱@#$%^&*()_+-={}[]|\\:;\"'<>,.?/",
            "description": "包含特殊字符的描述\n换行符\t制表符"
        }
        
        response = client.post(
            "/api/graphs",
            json=special_data,
            headers=authenticated_user["headers"]
        )
        # 应该成功处理或返回适当的验证错误
        assert response.status_code in [200, 400, 422]
    
    def test_create_graph_with_long_name(self, client: TestClient, authenticated_user):
        """测试创建超长标题的图谱"""
        long_name_data = {
            "title": "a" * 1000,  # 1000个字符的标题
            "description": "测试超长标题"
        }
        
        response = client.post(
            "/api/graphs",
            json=long_name_data,
            headers=authenticated_user["headers"]
        )
        # 应该返回验证错误
        assert response.status_code in [400, 422]
    
    def test_graph_operations_performance(self, client: TestClient, authenticated_user):
        """测试图谱操作性能"""
        # 创建多个图谱测试性能
        import time
        
        start_time = time.time()
        
        for i in range(10):
            graph_data = {
                "title": f"性能测试图谱 {i}",
                "description": f"第 {i} 个性能测试图谱"
            }
            response = client.post(
                "/api/graphs",
                json=graph_data,
                headers=authenticated_user["headers"]
            )
            assert response.status_code == 200
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # 10个图谱创建应该在合理时间内完成（比如5秒）
        assert execution_time < 5.0
    
    def test_concurrent_graph_operations(self, client: TestClient, authenticated_user):
        """测试并发图谱操作"""
        # 这里可以使用threading或asyncio来测试并发操作
        # 暂时跳过，需要更复杂的测试框架
        pass
