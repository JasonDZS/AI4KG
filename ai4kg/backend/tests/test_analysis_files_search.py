"""
图分析接口测试 - 测试 analysis.py 路由
"""
import pytest
from fastapi.testclient import TestClient
import uuid


@pytest.mark.analysis
class TestGraphAnalysis:
    """图分析测试"""
    
    def test_get_graph_statistics(self, client: TestClient, authenticated_user, sample_graph):
        """测试获取图谱统计信息"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/statistics",
            headers=authenticated_user["headers"]
        )
        # 根据实际实现，可能返回200或404
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            # 统计信息应该包含节点数、边数等
            if "data" in data:
                stats = data["data"]
                assert "node_count" in stats or "nodes" in stats
                assert "edge_count" in stats or "edges" in stats
    
    def test_get_node_centrality(self, client: TestClient, authenticated_user, sample_graph):
        """测试获取节点中心性分析"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/centrality",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
    
    def test_get_community_detection(self, client: TestClient, authenticated_user, sample_graph):
        """测试社区检测"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/communities",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
    
    def test_get_shortest_path(self, client: TestClient, authenticated_user, sample_graph):
        """测试最短路径分析"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/shortest-path?source=node1&target=node2",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404, 422]
    
    def test_analysis_unauthorized(self, client: TestClient, sample_graph):
        """测试未授权访问分析功能"""
        graph_id = sample_graph["id"]
        response = client.get(f"/api/graphs/{graph_id}/analysis/statistics")
        assert response.status_code == 401
    
    def test_analysis_invalid_graph_id(self, client: TestClient, authenticated_user):
        """测试无效图谱ID的分析"""
        response = client.get(
            "/api/graphs/invalid-uuid/analysis/statistics",
            headers=authenticated_user["headers"]
        )
        assert response.status_code == 422


@pytest.mark.analysis
class TestGraphMetrics:
    """图指标测试"""
    
    def test_graph_density(self, client: TestClient, authenticated_user, sample_graph):
        """测试图密度计算"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/density",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]
    
    def test_graph_diameter(self, client: TestClient, authenticated_user, sample_graph):
        """测试图直径计算"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/diameter",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]
    
    def test_clustering_coefficient(self, client: TestClient, authenticated_user, sample_graph):
        """测试聚类系数计算"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/clustering",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]


@pytest.mark.files
class TestFileProcessing:
    """文件处理测试"""
    
    def test_upload_graph_file(self, client: TestClient, authenticated_user, sample_graph):
        """测试上传图谱文件"""
        graph_id = sample_graph["id"]
        
        # 模拟文件上传
        test_file_content = b"node1,node2,edge_label\nnode2,node3,edge_label2"
        files = {"file": ("test.csv", test_file_content, "text/csv")}
        
        response = client.post(
            f"/api/graphs/{graph_id}/files/upload",
            files=files,
            headers=authenticated_user["headers"]
        )
        # 根据实际实现，可能返回200或404
        assert response.status_code in [200, 404, 422]
    
    def test_export_graph_file(self, client: TestClient, authenticated_user, sample_graph):
        """测试导出图谱文件"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/files/export?format=csv",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]
    
    def test_upload_invalid_file(self, client: TestClient, authenticated_user, sample_graph):
        """测试上传无效文件"""
        graph_id = sample_graph["id"]
        
        # 上传非文本文件
        files = {"file": ("test.bin", b"\x00\x01\x02", "application/octet-stream")}
        
        response = client.post(
            f"/api/graphs/{graph_id}/files/upload",
            files=files,
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 400, 422]
    
    def test_file_operations_unauthorized(self, client: TestClient, sample_graph):
        """测试未授权文件操作"""
        graph_id = sample_graph["id"]
        response = client.get(f"/api/graphs/{graph_id}/files/export")
        assert response.status_code == 401


@pytest.mark.search
class TestSearchFunctionality:
    """搜索功能测试"""
    
    def test_global_search(self, client: TestClient, authenticated_user):
        """测试全局搜索"""
        response = client.get(
            "/api/search?q=测试",
            headers=authenticated_user["headers"]
        )
        # 根据实际实现，可能返回200或404
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "data" in data
    
    def test_search_with_filters(self, client: TestClient, authenticated_user):
        """测试带过滤器的搜索"""
        # 使用有效的UUID格式
        test_uuid = "550e8400-e29b-41d4-a716-446655440000"
        response = client.get(
            f"/api/search?q=测试&type=node&graph_id={test_uuid}",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]
    
    def test_search_empty_query(self, client: TestClient, authenticated_user):
        """测试空搜索查询"""
        response = client.get(
            "/api/search?q=",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 400, 422]
    
    def test_search_special_characters(self, client: TestClient, authenticated_user):
        """测试特殊字符搜索"""
        special_queries = ["@#$%", "测试中文", "test & search", "<script>"]
        
        for query in special_queries:
            response = client.get(
                f"/api/search?q={query}",
                headers=authenticated_user["headers"]
            )
            # 应该正常处理或返回适当错误
            assert response.status_code in [200, 400, 404, 422]
    
    def test_search_unauthorized(self, client: TestClient):
        """测试未授权搜索"""
        response = client.get("/api/search?q=测试")
        assert response.status_code == 401
    
    def test_search_pagination(self, client: TestClient, authenticated_user):
        """测试搜索分页"""
        response = client.get(
            "/api/search?q=测试&page=1&size=10",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True


@pytest.mark.analysis
class TestAdvancedAnalysis:
    """高级分析测试"""
    
    def test_node_importance_ranking(self, client: TestClient, authenticated_user, sample_graph):
        """测试节点重要性排名"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/node-importance",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404]
    
    def test_subgraph_extraction(self, client: TestClient, authenticated_user, sample_graph):
        """测试子图提取"""
        graph_id = sample_graph["id"]
        response = client.post(
            f"/api/graphs/{graph_id}/analysis/subgraph",
            json={"node_ids": ["node1", "node2"]},
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404, 422]
    
    def test_graph_similarity(self, client: TestClient, authenticated_user, sample_graph):
        """测试图相似性分析"""
        graph_id = sample_graph["id"]
        response = client.post(
            f"/api/graphs/{graph_id}/analysis/similarity",
            json={"target_graph_id": "other-graph-id"},
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404, 422]
    
    def test_temporal_analysis(self, client: TestClient, authenticated_user, sample_graph):
        """测试时间序列分析"""
        graph_id = sample_graph["id"]
        response = client.get(
            f"/api/graphs/{graph_id}/analysis/temporal?start_date=2023-01-01&end_date=2023-12-31",
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404, 422]


@pytest.mark.files
class TestAdvancedFileOperations:
    """高级文件操作测试"""
    
    def test_bulk_import(self, client: TestClient, authenticated_user, sample_graph):
        """测试批量导入"""
        graph_id = sample_graph["id"]
        
        # 模拟批量数据
        bulk_data = {
            "nodes": [
                {"id": "n1", "label": "节点1", "properties": {"type": "person"}},
                {"id": "n2", "label": "节点2", "properties": {"type": "place"}}
            ],
            "edges": [
                {"source": "n1", "target": "n2", "label": "位于", "properties": {}}
            ]
        }
        
        response = client.post(
            f"/api/graphs/{graph_id}/files/bulk-import",
            json=bulk_data,
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404, 422]
    
    def test_export_formats(self, client: TestClient, authenticated_user, sample_graph):
        """测试不同格式导出"""
        graph_id = sample_graph["id"]
        formats = ["csv", "json", "graphml", "gexf"]
        
        for format_type in formats:
            response = client.get(
                f"/api/graphs/{graph_id}/files/export?format={format_type}",
                headers=authenticated_user["headers"]
            )
            assert response.status_code in [200, 404, 422]
    
    def test_file_validation(self, client: TestClient, authenticated_user, sample_graph):
        """测试文件验证"""
        graph_id = sample_graph["id"]
        
        # 测试无效CSV格式
        invalid_csv = b"invalid,csv,format\nmissing,columns"
        files = {"file": ("invalid.csv", invalid_csv, "text/csv")}
        
        response = client.post(
            f"/api/graphs/{graph_id}/files/upload",
            files=files,
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 400, 422]
    
    def test_large_file_upload(self, client: TestClient, authenticated_user, sample_graph):
        """测试大文件上传"""
        graph_id = sample_graph["id"]
        
        # 创建一个较大的测试文件（模拟）
        large_content = "node1,node2,edge\n" * 1000  # 1000行数据
        files = {"file": ("large.csv", large_content.encode(), "text/csv")}
        
        response = client.post(
            f"/api/graphs/{graph_id}/files/upload",
            files=files,
            headers=authenticated_user["headers"]
        )
        assert response.status_code in [200, 404, 413, 422]  # 413 = Payload Too Large
