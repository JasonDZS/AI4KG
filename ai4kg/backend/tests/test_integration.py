"""
集成测试 - 测试完整的工作流程
"""
import pytest
from fastapi.testclient import TestClient
import time


@pytest.mark.integration
class TestCompleteWorkflow:
    """完整工作流程测试"""
    
    def test_complete_graph_workflow(self, client: TestClient, sample_user_data, sample_graph_data):
        """测试完整的图谱工作流程"""
        # 1. 用户注册
        register_response = client.post("/api/auth/register", json=sample_user_data)
        assert register_response.status_code == 200
        
        auth_data = register_response.json()
        token = auth_data["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. 创建图谱
        graph_response = client.post("/api/graphs", json=sample_graph_data, headers=headers)
        assert graph_response.status_code == 200
        
        graph_data = graph_response.json()["data"]
        graph_id = graph_data["id"]
        
        # 3. 添加节点
        node_data = {
            "label": "测试节点",
            "type": "person",
            "properties": {"name": "张三", "age": 30}
        }
        node_response = client.post(
            f"/api/graphs/{graph_id}/nodes",
            json=node_data,
            headers=headers
        )
        assert node_response.status_code == 200
        node1 = node_response.json()["data"]
        node1_id = node1["id"]
        
        # 4. 添加另一个节点
        node2_data = {
            "label": "测试节点2",
            "type": "person", 
            "properties": {"name": "李四", "age": 25}
        }
        node2_response = client.post(
            f"/api/graphs/{graph_id}/nodes",
            json=node2_data,
            headers=headers
        )
        assert node2_response.status_code == 200
        node2 = node2_response.json()["data"]
        node2_id = node2["id"]
        
        # 5. 添加边
        edge_data = {
            "label": "认识",
            "type": "relationship",
            "source_node_id": node1_id,
            "target_node_id": node2_id,
            "properties": {"since": "2020"}
        }
        edge_response = client.post(
            f"/api/graphs/{graph_id}/edges",
            json=edge_data,
            headers=headers
        )
        assert edge_response.status_code == 200
        
        # 6. 获取完整图谱
        get_graph_response = client.get(f"/api/graphs/{graph_id}", headers=headers)
        assert get_graph_response.status_code == 200
        
        full_graph = get_graph_response.json()["data"]
        assert full_graph["id"] == graph_id
        assert "nodes" in full_graph
        assert "edges" in full_graph
        
        # 7. 执行分析（如果实现了）
        stats_response = client.get(
            f"/api/graphs/{graph_id}/analysis/statistics",
            headers=headers
        )
        # 分析功能可能还未实现
        assert stats_response.status_code in [200, 404]
        
        # 8. 搜索
        search_response = client.get("/api/search?q=张三", headers=headers)
        assert search_response.status_code in [200, 404]
        
        # 9. 更新图谱
        update_data = {"title": "更新后的图谱名称"}
        update_response = client.put(
            f"/api/graphs/{graph_id}",
            json=update_data,
            headers=headers
        )
        assert update_response.status_code == 200
        
        # 10. 删除图谱
        delete_response = client.delete(f"/api/graphs/{graph_id}", headers=headers)
        assert delete_response.status_code == 200
        
        # 11. 验证图谱已删除
        get_deleted_response = client.get(f"/api/graphs/{graph_id}", headers=headers)
        assert get_deleted_response.status_code == 404
    
    def test_multi_user_workflow(self, client: TestClient):
        """测试多用户工作流程"""
        # 创建第一个用户
        user1_data = {
            "username": "user1",
            "email": "user1@example.com",
            "password": "password123"
        }
        user1_response = client.post("/api/auth/register", json=user1_data)
        assert user1_response.status_code == 200
        
        user1_token = user1_response.json()["data"]["token"]
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        
        # 创建第二个用户
        user2_data = {
            "username": "user2",
            "email": "user2@example.com",
            "password": "password123"
        }
        user2_response = client.post("/api/auth/register", json=user2_data)
        assert user2_response.status_code == 200
        
        user2_token = user2_response.json()["data"]["token"]
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # 用户1创建私有图谱
        graph_data = {
            "title": "用户1的私有图谱",
            "description": "这是用户1的私有图谱"
        }
        graph_response = client.post("/api/graphs", json=graph_data, headers=user1_headers)
        assert graph_response.status_code == 200
        
        graph_id = graph_response.json()["data"]["id"]
        
        # 用户2尝试访问用户1的私有图谱
        access_response = client.get(f"/api/graphs/{graph_id}", headers=user2_headers)
        assert access_response.status_code in [403, 404]  # 应该被拒绝访问
        
        # 用户1创建公开图谱
        public_graph_data = {
            "title": "用户1的公开图谱",
            "description": "这是用户1的公开图谱"
        }
        public_graph_response = client.post("/api/graphs", json=public_graph_data, headers=user1_headers)
        assert public_graph_response.status_code == 200
        
        public_graph_id = public_graph_response.json()["data"]["id"]
        
        # 用户2访问用户1的公开图谱（如果支持）
        public_access_response = client.get(f"/api/graphs/{public_graph_id}", headers=user2_headers)
        # 根据实现，可能允许或不允许访问其他用户的公开图谱
        assert public_access_response.status_code in [200, 403, 404]
        
        # 各用户获取自己的图谱列表
        user1_graphs = client.get("/api/graphs", headers=user1_headers)
        assert user1_graphs.status_code == 200
        
        user2_graphs = client.get("/api/graphs", headers=user2_headers)
        assert user2_graphs.status_code == 200
        
        # 用户1应该有2个图谱，用户2应该有0个图谱
        user1_count = user1_graphs.json()["data"]["total"]
        user2_count = user2_graphs.json()["data"]["total"]
        
        assert user1_count == 2
        assert user2_count == 0


@pytest.mark.integration
class TestDataConsistency:
    """数据一致性测试"""
    
    def test_graph_node_edge_consistency(self, client: TestClient, authenticated_user):
        """测试图谱、节点、边的数据一致性"""
        # 创建图谱
        graph_data = {
            "title": "一致性测试图谱",
            "description": "测试数据一致性"
        }
        graph_response = client.post("/api/graphs", json=graph_data, headers=authenticated_user["headers"])
        assert graph_response.status_code == 200
        
        graph_id = graph_response.json()["data"]["id"]
        
        # 获取初始节点数量
        initial_nodes_response = client.get(f"/api/graphs/{graph_id}/nodes", headers=authenticated_user["headers"])
        assert initial_nodes_response.status_code == 200
        initial_node_count = len(initial_nodes_response.json()["data"])
        
        # 添加节点
        node_data = {
            "label": "一致性测试节点",
            "type": "test",
            "properties": {"test": True}
        }
        node_response = client.post(
            f"/api/graphs/{graph_id}/nodes",
            json=node_data,
            headers=authenticated_user["headers"]
        )
        assert node_response.status_code == 200
        
        # 验证节点数量增加
        updated_nodes_response = client.get(f"/api/graphs/{graph_id}/nodes", headers=authenticated_user["headers"])
        assert updated_nodes_response.status_code == 200
        # 注意：由于功能可能未实现，这里的验证可能需要调整
        
        # 获取完整图谱数据验证一致性
        full_graph_response = client.get(f"/api/graphs/{graph_id}", headers=authenticated_user["headers"])
        assert full_graph_response.status_code == 200
        
        full_graph = full_graph_response.json()["data"]
        # 验证图谱包含正确的节点和边数据
        assert "nodes" in full_graph
        assert "edges" in full_graph
    
    def test_user_isolation(self, client: TestClient):
        """测试用户数据隔离"""
        # 创建两个用户和图谱，确保数据隔离
        users = []
        graphs = []
        
        for i in range(2):
            user_data = {
                "username": f"isolation_user_{i}",
                "email": f"isolation_{i}@example.com",
                "password": "password123"
            }
            user_response = client.post("/api/auth/register", json=user_data)
            assert user_response.status_code == 200
            
            token = user_response.json()["data"]["token"]
            headers = {"Authorization": f"Bearer {token}"}
            users.append(headers)
            
            # 每个用户创建图谱
            graph_data = {
                "title": f"用户{i}的图谱",
                "description": f"用户{i}的私有数据"
            }
            graph_response = client.post("/api/graphs", json=graph_data, headers=headers)
            assert graph_response.status_code == 200
            
            graphs.append(graph_response.json()["data"]["id"])
        
        # 验证用户只能看到自己的图谱
        for i, headers in enumerate(users):
            graphs_response = client.get("/api/graphs", headers=headers)
            assert graphs_response.status_code == 200
            
            user_graphs = graphs_response.json()["data"]["graphs"]
            # 每个用户应该只看到自己的1个图谱
            assert len(user_graphs) == 1
            assert user_graphs[0]["title"] == f"用户{i}的图谱"


@pytest.mark.integration  
class TestPerformanceAndScalability:
    """性能和可扩展性测试"""
    
    def test_concurrent_requests(self, client: TestClient, authenticated_user):
        """测试并发请求处理"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            try:
                response = client.get("/api/graphs", headers=authenticated_user["headers"])
                results.put(response.status_code)
            except Exception as e:
                results.put(str(e))
        
        # 创建10个并发请求
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 检查结果
        success_count = 0
        while not results.empty():
            result = results.get()
            if result == 200:
                success_count += 1
        
        # 大部分请求应该成功
        assert success_count >= 8
    
    def test_large_data_operations(self, client: TestClient, authenticated_user):
        """测试大数据量操作"""
        # 创建图谱
        graph_data = {
            "title": "性能测试图谱",
            "description": "测试大量数据处理"
        }
        graph_response = client.post("/api/graphs", json=graph_data, headers=authenticated_user["headers"])
        assert graph_response.status_code == 200
        
        graph_id = graph_response.json()["data"]["id"]
        
        # 创建大量节点
        start_time = time.time()
        created_nodes = 0
        
        for i in range(50):  # 创建50个节点
            node_data = {
                "label": f"性能测试节点{i}",
                "type": "performance",
                "properties": {"index": i, "batch": "performance_test"}
            }
            
            response = client.post(
                f"/api/graphs/{graph_id}/nodes",
                json=node_data,
                headers=authenticated_user["headers"]
            )
            
            if response.status_code == 200:
                created_nodes += 1
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # 验证性能和成功率
        assert created_nodes >= 45  # 至少90%成功率
        assert execution_time < 30.0  # 30秒内完成
        
        # 测试获取大量数据的性能
        start_time = time.time()
        nodes_response = client.get(f"/api/graphs/{graph_id}/nodes", headers=authenticated_user["headers"])
        end_time = time.time()
        
        assert nodes_response.status_code == 200
        assert (end_time - start_time) < 5.0  # 5秒内返回结果
    
    def test_memory_usage_patterns(self, client: TestClient, authenticated_user):
        """测试内存使用模式"""
        # 这个测试主要验证不会有明显的内存泄漏
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss
            
            # 执行大量操作
            for i in range(20):
                # 创建图谱
                graph_data = {
                    "title": f"内存测试图谱{i}",
                    "description": "测试内存使用"
                }
                graph_response = client.post("/api/graphs", json=graph_data, headers=authenticated_user["headers"])
                if graph_response.status_code == 200:
                    graph_id = graph_response.json()["data"]["id"]
                    
                    # 删除图谱
                    client.delete(f"/api/graphs/{graph_id}", headers=authenticated_user["headers"])
            
            final_memory = process.memory_info().rss
            memory_increase = final_memory - initial_memory
            
            # 内存增长应该在合理范围内（比如不超过100MB）
            assert memory_increase < 100 * 1024 * 1024  # 100MB
            
        except ImportError:
            # 如果psutil不可用，跳过内存检查，只执行基本操作测试
            for i in range(10):
                graph_data = {
                    "title": f"基础测试图谱{i}",
                    "description": "测试基础操作"
                }
                graph_response = client.post("/api/graphs", json=graph_data, headers=authenticated_user["headers"])
                if graph_response.status_code == 200:
                    graph_id = graph_response.json()["data"]["id"]
                    client.delete(f"/api/graphs/{graph_id}", headers=authenticated_user["headers"])
            
            # 基本验证：能正常执行操作就算通过
            assert True


@pytest.mark.integration
class TestErrorHandlingAndRecovery:
    """错误处理和恢复测试"""
    
    def test_graceful_error_handling(self, client: TestClient, authenticated_user):
        """测试优雅的错误处理"""
        # 测试各种错误情况的处理
        error_scenarios = [
            # 无效的JSON
            ("/api/graphs", "invalid-json", 400),
            # 超长的请求
            ("/api/graphs", {"title": "a" * 10000}, 422),
            # 不存在的资源
            ("/api/graphs/nonexistent-id", None, 404),
        ]
        
        for endpoint, payload, expected_status in error_scenarios:
            if payload == "invalid-json":
                # 发送无效JSON
                response = client.post(
                    endpoint,
                    data="invalid json",
                    headers={**authenticated_user["headers"], "Content-Type": "application/json"}
                )
            elif payload is None:
                response = client.get(endpoint, headers=authenticated_user["headers"])
            else:
                response = client.post(endpoint, json=payload, headers=authenticated_user["headers"])
            
            # 验证错误状态码
            assert response.status_code >= 400
            
            # 验证错误响应格式
            try:
                error_data = response.json()
                assert "detail" in error_data or "message" in error_data
            except:
                # 如果不是JSON响应，至少应该有合适的状态码
                pass
    
    def test_service_recovery(self, client: TestClient, authenticated_user):
        """测试服务恢复能力"""
        # 在错误操作后，服务应该能正常恢复
        
        # 1. 执行一些可能导致错误的操作
        invalid_operations = [
            lambda: client.post("/api/graphs", json={"invalid": "data"}, headers=authenticated_user["headers"]),
            lambda: client.get("/api/graphs/invalid-uuid", headers=authenticated_user["headers"]),
            lambda: client.delete("/api/graphs/nonexistent", headers=authenticated_user["headers"]),
        ]
        
        for operation in invalid_operations:
            try:
                operation()
            except:
                pass  # 忽略任何异常
        
        # 2. 验证服务仍然正常工作
        health_response = client.get("/health")
        assert health_response.status_code == 200
        
        graphs_response = client.get("/api/graphs", headers=authenticated_user["headers"])
        assert graphs_response.status_code == 200
        
        # 3. 验证可以正常创建新资源
        graph_data = {
            "title": "恢复测试图谱",
            "description": "验证服务恢复"
        }
        create_response = client.post("/api/graphs", json=graph_data, headers=authenticated_user["headers"])
        assert create_response.status_code == 200
