#!/usr/bin/env python3
"""
边功能集成测试脚本
"""

import requests
import json

# 假设我们有一个运行中的服务器
BASE_URL = "http://localhost:8000"

def test_edge_operations():
    # 测试用户认证和图谱创建
    print("=== 测试边操作功能 ===")
    
    # 1. 注册测试用户
    user_data = {
        "username": "test_edge_user",
        "email": "test_edge@example.com",
        "password": "testpass123"
    }
    
    print("1. 注册用户...")
    register_response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
    print(f"注册响应: {register_response.status_code}")
    
    # 2. 登录获取token
    login_data = {
        "username": "test_edge_user",
        "password": "testpass123"
    }
    
    print("2. 用户登录...")
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"登录响应: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token = login_response.json()["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. 创建图谱
        graph_data = {
            "title": "边测试图谱",
            "description": "用于测试边操作的图谱",
            "nodes": [
                {
                    "id": "node-1",
                    "label": "节点1",
                    "type": "person",
                    "properties": {"name": "张三"}
                },
                {
                    "id": "node-2", 
                    "label": "节点2",
                    "type": "person",
                    "properties": {"name": "李四"}
                }
            ],
            "edges": []
        }
        
        print("3. 创建带有节点的图谱...")
        graph_response = requests.post(f"{BASE_URL}/api/graphs", json=graph_data, headers=headers)
        print(f"图谱创建响应: {graph_response.status_code}")
        
        if graph_response.status_code == 200:
            graph_id = graph_response.json()["data"]["id"]
            print(f"图谱ID: {graph_id}")
            
            # 4. 创建边
            edge_data = {
                "source_node_id": "node-1",
                "target_node_id": "node-2", 
                "type": "relationship",
                "label": "认识",
                "properties": {"since": "2020"}
            }
            
            print("4. 创建边...")
            edge_response = requests.post(f"{BASE_URL}/api/graphs/{graph_id}/edges", json=edge_data, headers=headers)
            print(f"边创建响应: {edge_response.status_code}")
            print(f"边创建响应内容: {edge_response.json()}")
            
            if edge_response.status_code == 200:
                edge_id = edge_response.json()["data"]["id"]
                
                # 5. 获取所有边
                print("5. 获取所有边...")
                get_edges_response = requests.get(f"{BASE_URL}/api/graphs/{graph_id}/edges", headers=headers)
                print(f"获取边响应: {get_edges_response.status_code}")
                print(f"边列表: {get_edges_response.json()}")
                
                # 6. 更新边
                update_data = {
                    "label": "好朋友",
                    "properties": {"since": "2021", "strength": "strong"}
                }
                
                print("6. 更新边...")
                update_response = requests.put(f"{BASE_URL}/api/graphs/{graph_id}/edges/{edge_id}", json=update_data, headers=headers)
                print(f"更新边响应: {update_response.status_code}")
                print(f"更新边响应内容: {update_response.json()}")
                
                # 7. 删除边
                print("7. 删除边...")
                delete_response = requests.delete(f"{BASE_URL}/api/graphs/{graph_id}/edges/{edge_id}", headers=headers)
                print(f"删除边响应: {delete_response.status_code}")
                print(f"删除边响应内容: {delete_response.json()}")
                
            else:
                print(f"边创建失败: {edge_response.text}")
        else:
            print(f"图谱创建失败: {graph_response.text}")
    else:
        print(f"登录失败: {login_response.text}")

if __name__ == "__main__":
    try:
        test_edge_operations()
    except requests.exceptions.ConnectionError:
        print("无法连接到服务器，请确保服务器正在运行")
    except Exception as e:
        print(f"测试失败: {e}")
