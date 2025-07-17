#!/usr/bin/env python3
"""
简单测试删除影响分析API
"""

import requests
import json

# 基础配置
BASE_URL = "http://localhost:8000/api"
USERNAME = "testuser"
PASSWORD = "testpass"

def test_delete_impact_api():
    """测试删除影响分析API"""
    
    # 1. 注册用户（如果已存在会失败，但不影响测试）
    try:
        register_data = {
            "username": USERNAME,
            "email": "test@example.com",
            "password": PASSWORD
        }
        requests.post(f"{BASE_URL}/auth/register", json=register_data)
    except:
        pass
    
    # 2. 登录获取token
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if login_response.status_code != 200:
        print("❌ 登录失败")
        return False
    
    token = login_response.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ 登录成功")
    
    # 3. 创建测试图谱
    graph_data = {
        "title": "删除测试图谱",
        "description": "用于测试节点删除影响分析"
    }
    
    graph_response = requests.post(f"{BASE_URL}/graphs", json=graph_data, headers=headers)
    if graph_response.status_code != 200:
        print("❌ 创建图谱失败")
        return False
    
    graph_id = graph_response.json()["data"]["id"]
    print(f"✅ 创建图谱成功: {graph_id}")
    
    # 4. 创建节点
    nodes_data = [
        {
            "id": "node1",
            "label": "节点1",
            "type": "person",
            "x": 100,
            "y": 100,
            "size": 10,
            "color": "#3498db",
            "properties": {"name": "张三"}
        },
        {
            "id": "node2", 
            "label": "节点2",
            "type": "person",
            "x": 200,
            "y": 200,
            "size": 10,
            "color": "#e74c3c",
            "properties": {"name": "李四"}
        },
        {
            "id": "node3",
            "label": "节点3",
            "type": "person",
            "x": 300,
            "y": 300,
            "size": 10,
            "color": "#2ecc71",
            "properties": {"name": "王五"}
        }
    ]
    
    created_nodes = []
    for node_data in nodes_data:
        node_response = requests.post(f"{BASE_URL}/graphs/{graph_id}/nodes", json=node_data, headers=headers)
        if node_response.status_code == 200:
            created_nodes.append(node_response.json()["data"])
            print(f"✅ 创建节点成功: {node_data['label']}")
        else:
            print(f"❌ 创建节点失败: {node_data['label']}")
            return False
    
    # 5. 创建边
    edges_data = [
        {
            "source": "node1",
            "target": "node2",
            "label": "认识",
            "type": "relationship",
            "properties": {}
        },
        {
            "source": "node1",
            "target": "node3",
            "label": "朋友",
            "type": "relationship", 
            "properties": {}
        }
    ]
    
    for edge_data in edges_data:
        edge_response = requests.post(f"{BASE_URL}/graphs/{graph_id}/edges", json=edge_data, headers=headers)
        if edge_response.status_code == 200:
            print(f"✅ 创建边成功: {edge_data['source']} -> {edge_data['target']}")
        else:
            print(f"❌ 创建边失败: {edge_data['source']} -> {edge_data['target']}")
            return False
    
    # 6. 测试删除影响分析API
    impact_response = requests.get(f"{BASE_URL}/graphs/{graph_id}/nodes/node1/delete-impact", headers=headers)
    
    if impact_response.status_code != 200:
        print(f"❌ 删除影响分析API失败: {impact_response.status_code}")
        print(impact_response.text)
        return False
    
    impact_data = impact_response.json()
    print("✅ 删除影响分析API成功")
    print(f"📊 影响分析结果:")
    print(f"   - 目标节点: {impact_data['data']['target_node']['label']}")
    print(f"   - 受影响的边数量: {impact_data['data']['affected_edges_count']}")
    print(f"   - 相邻节点数量: {impact_data['data']['connected_nodes_count']}")
    
    if impact_data['data']['connected_nodes']:
        print("   - 相邻节点:")
        for node in impact_data['data']['connected_nodes']:
            print(f"     * {node['label']} ({node['type']})")
    
    # 7. 清理：删除图谱
    delete_response = requests.delete(f"{BASE_URL}/graphs/{graph_id}", headers=headers)
    if delete_response.status_code == 200:
        print("✅ 清理完成")
    
    return True

if __name__ == "__main__":
    print("🧪 开始测试删除影响分析API...")
    if test_delete_impact_api():
        print("🎉 所有测试通过！")
    else:
        print("💥 测试失败！")
