#!/usr/bin/env python3
"""
文件导入导出功能测试脚本
"""

import requests
import json
import os
from pathlib import Path

# 配置
BASE_URL = "http://localhost:8000/api"
USERNAME = "testuser"
PASSWORD = "testpassword"
EMAIL = "test@example.com"

def get_auth_token():
    """获取认证token"""
    # 先尝试注册用户
    register_data = {
        "username": USERNAME,
        "password": PASSWORD,
        "email": EMAIL
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"注册响应: {response.status_code}")
    
    # 登录获取token
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["data"]["token"]
    else:
        print(f"登录失败: {response.text}")
        return None

def test_file_import():
    """测试文件导入"""
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试JSON文件导入
    json_file_path = Path(__file__).parent / "sample_data" / "example_graph.json"
    if json_file_path.exists():
        with open(json_file_path, 'rb') as f:
            files = {"file": ("example_graph.json", f, "application/json")}
            data = {
                "title": "测试导入的图谱",
                "description": "通过JSON文件导入的测试图谱"
            }
            response = requests.post(
                f"{BASE_URL}/graphs/import",
                files=files,
                data=data,
                headers=headers
            )
            print(f"JSON导入响应: {response.status_code}")
            print(f"响应内容: {response.text}")
            
            if response.status_code == 200:
                graph_id = response.json()["data"]["id"]
                return graph_id
    
    # 测试CSV文件导入
    csv_file_path = Path(__file__).parent / "sample_data" / "example_edges.csv"
    if csv_file_path.exists():
        with open(csv_file_path, 'rb') as f:
            files = {"file": ("example_edges.csv", f, "text/csv")}
            data = {
                "title": "CSV导入的图谱",
                "description": "通过CSV文件导入的测试图谱"
            }
            response = requests.post(
                f"{BASE_URL}/graphs/import",
                files=files,
                data=data,
                headers=headers
            )
            print(f"CSV导入响应: {response.status_code}")
            print(f"响应内容: {response.text}")

def test_file_export(graph_id):
    """测试文件导出"""
    if not graph_id:
        print("没有可用的图谱ID进行导出测试")
        return
        
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试不同格式的导出
    formats = ["json", "csv", "gexf", "graphml"]
    
    for format_type in formats:
        response = requests.get(
            f"{BASE_URL}/graphs/{graph_id}/export",
            params={"format": format_type},
            headers=headers
        )
        print(f"{format_type.upper()}导出响应: {response.status_code}")
        
        if response.status_code == 200:
            # 保存导出的文件
            filename = f"exported_graph.{format_type}"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"导出文件已保存: {filename}")
        else:
            print(f"导出失败: {response.text}")

def main():
    """主函数"""
    print("开始测试文件导入导出功能...")
    
    # 测试导入
    print("\n=== 测试文件导入 ===")
    graph_id = test_file_import()
    
    # 测试导出
    print("\n=== 测试文件导出 ===")
    test_file_export(graph_id)
    
    print("\n测试完成!")

if __name__ == "__main__":
    main()
