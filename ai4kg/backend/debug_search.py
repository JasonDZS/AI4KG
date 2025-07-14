#!/usr/bin/env python3
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# 先注册
register_response = client.post('/api/auth/register', json={
    'username': 'testuser',
    'email': 'test@example.com',
    'password': 'testpass123'
})
print(f'Register response: {register_response.status_code}')

# 登录获取token
login_response = client.post('/api/auth/login', json={
    'username': 'testuser',
    'password': 'testpass123'
})

print(f'Login response: {login_response.status_code}')
if login_response.status_code == 200:
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # 测试搜索请求
    search_response = client.get('/api/search?q=测试&type=node&graph_id=123', headers=headers)
    print(f'Search response status: {search_response.status_code}')
    print(f'Search response body: {search_response.text}')
else:
    print(f'Login failed: {login_response.text}')
