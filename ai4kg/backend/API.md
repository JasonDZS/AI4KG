# AI4KG API 文档

## 概述

AI4KG（AI for Knowledge Graph）是一个知识图谱可视化平台的后端API服务，基于 FastAPI 框架构建，提供知识图谱的创建、管理、查询和分析功能。

**版本**: 1.0.0  
**基础URL**: `http://localhost:8000`  
**API文档**: `http://localhost:8000/docs`  
**ReDoc文档**: `http://localhost:8000/redoc`

## 认证

API 使用 JWT（JSON Web Token）进行身份认证。认证成功后，需要在请求头中携带 Bearer Token：

```
Authorization: Bearer <your_token>
```

## 通用响应格式

所有API响应都使用统一的格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  }
}
```

## API 端点

### 1. 系统信息

#### 获取服务信息
```http
GET /
```

**响应示例**:
```json
{
  "message": "AI4KG API Service",
  "version": "1.0.0"
}
```

#### 健康检查
```http
GET /health
```

**响应示例**:
```json
{
  "status": "healthy",
  "service": "ai4kg-backend"
}
```

### 2. 认证 API (`/api/auth`)

#### 2.1 用户注册
```http
POST /api/auth/register
```

**请求体**:
```json
{
  "username": "用户名",
  "email": "邮箱@example.com",
  "password": "密码"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "user": {
      "id": "用户ID",
      "username": "用户名",
      "email": "邮箱@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "JWT_TOKEN"
  }
}
```

#### 2.2 用户登录
```http
POST /api/auth/login
```

**请求体**:
```json
{
  "username": "用户名",
  "password": "密码"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "用户ID",
      "username": "用户名",
      "email": "邮箱@example.com"
    },
    "token": "JWT_TOKEN"
  }
}
```

#### 2.3 验证令牌
```http
GET /api/auth/verify
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "令牌验证成功",
  "data": {
    "id": "用户ID",
    "username": "用户名",
    "email": "邮箱@example.com"
  }
}
```

### 3. 图谱管理 API (`/api/graphs`)

#### 3.1 获取图谱列表
```http
GET /api/graphs?page=1&size=10&search=关键词
```

**查询参数**:
- `page`: 页码（默认: 1）
- `size`: 每页数量（默认: 10，最大: 100）
- `search`: 搜索关键词（可选）

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取图谱列表成功",
  "data": {
    "graphs": [
      {
        "id": "图谱ID",
        "title": "图谱标题",
        "description": "图谱描述",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50
  }
}
```

#### 3.2 获取单个图谱详情
```http
GET /api/graphs/{graph_id}
```

**路径参数**:
- `graph_id`: 图谱ID

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取图谱成功",
  "data": {
    "graph": {
      "id": "图谱ID",
      "title": "图谱标题",
      "description": "图谱描述"
    },
    "nodes": [
      {
        "id": "节点ID",
        "label": "节点标签",
        "type": "节点类型",
        "x": 100.5,
        "y": 200.3,
        "size": 10,
        "color": "#FF5722",
        "properties": {
          "属性名": "属性值"
        }
      }
    ],
    "edges": [
      {
        "id": "边ID",
        "source": "源节点ID",
        "target": "目标节点ID",
        "type": "关系类型",
        "properties": {},
        "weight": "关系权重"
      }
    ]
  }
}
```

#### 3.3 创建图谱
```http
POST /api/graphs
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "图谱标题",
  "description": "图谱描述"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "创建图谱成功",
  "data": {
    "id": "图谱ID",
    "title": "图谱标题",
    "description": "图谱描述",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3.4 更新图谱
```http
PUT /api/graphs/{graph_id}
```

**路径参数**:
- `graph_id`: 图谱ID

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "新的图谱标题",
  "description": "新的图谱描述"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "更新图谱成功",
  "data": {
    "id": "图谱ID",
    "title": "新的图谱标题",
    "description": "新的图谱描述",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3.5 删除图谱
```http
DELETE /api/graphs/{graph_id}
```

**路径参数**:
- `graph_id`: 图谱ID

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "删除图谱成功"
}
```

### 4. 节点管理 API (`/api/graphs/{graph_id}/nodes`)

> **节点可视化属性说明**:
> - `x`: 节点在画布上的X坐标（浮点数）
> - `y`: 节点在画布上的Y坐标（浮点数） 
> - `size`: 节点显示大小（正整数，建议范围：5-50）
> - `color`: 节点颜色（十六进制颜色代码，如：#FF5722）

#### 4.1 获取节点列表
```http
GET /api/graphs/{graph_id}/nodes?type=节点类型&search=关键词
```

**路径参数**:
- `graph_id`: 图谱ID

**查询参数**:
- `type`: 节点类型（可选）
- `search`: 搜索关键词（可选）

**请求头**:
```
Authorization: Bearer <token>
```

**状态**: 🚧 待实现

#### 4.2 创建节点
```http
POST /api/graphs/{graph_id}/nodes
```

**路径参数**:
- `graph_id`: 图谱ID

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "id": "节点ID",
  "label": "节点标签",
  "type": "节点类型",
  "x": 100.5,
  "y": 200.3,
  "size": 10,
  "color": "#FF5722",
  "properties": {
    "属性名": "属性值"
  }
}
```

**状态**: 🚧 待实现

#### 4.3 更新节点
```http
PUT /api/graphs/{graph_id}/nodes/{node_id}
```

**路径参数**:
- `graph_id`: 图谱ID
- `node_id`: 节点ID

**状态**: 🚧 待实现

#### 4.4 删除节点
```http
DELETE /api/graphs/{graph_id}/nodes/{node_id}
```

**路径参数**:
- `graph_id`: 图谱ID
- `node_id`: 节点ID

**状态**: 🚧 待实现

### 5. 边管理 API (`/api/graphs/{graph_id}/edges`)

#### 5.1 获取边列表
```http
GET /api/graphs/{graph_id}/edges
```

**路径参数**:
- `graph_id`: 图谱ID

**状态**: 🚧 待实现

#### 5.2 创建边
```http
POST /api/graphs/{graph_id}/edges
```

**路径参数**:
- `graph_id`: 图谱ID

**请求体**:
```json
{
  "source": "源节点ID",
  "target": "目标节点ID",
  "type": "关系类型",
  "properties": {
    "属性名": "属性值"
  }
}
```

**状态**: 🚧 待实现

#### 5.3 更新边
```http
PUT /api/graphs/{graph_id}/edges/{edge_id}
```

**状态**: 🚧 待实现

#### 5.4 删除边
```http
DELETE /api/graphs/{graph_id}/edges/{edge_id}
```

**状态**: 🚧 待实现

### 6. 图分析 API (`/api/graphs/{graph_id}`)

#### 6.1 获取节点邻居
```http
GET /api/graphs/{graph_id}/nodes/{node_id}/neighbors?depth=1&direction=both
```

**路径参数**:
- `graph_id`: 图谱ID
- `node_id`: 节点ID

**查询参数**:
- `depth`: 搜索深度（1-5，默认: 1）
- `direction`: 方向（in/out/both，默认: both）

**状态**: 🚧 待实现

#### 6.2 获取最短路径
```http
GET /api/graphs/{graph_id}/path?source=源节点ID&target=目标节点ID&algorithm=dijkstra
```

**路径参数**:
- `graph_id`: 图谱ID

**查询参数**:
- `source`: 源节点ID（必需）
- `target`: 目标节点ID（必需）
- `algorithm`: 算法类型（dijkstra/astar，默认: dijkstra）

**状态**: 🚧 待实现

#### 6.3 获取图统计信息
```http
GET /api/graphs/{graph_id}/stats
```

**路径参数**:
- `graph_id`: 图谱ID

**状态**: 🚧 待实现

### 7. 文件处理 API (`/api/graphs`)

#### 7.1 导入图数据
```http
POST /api/graphs/import
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体（表单数据）**:
- `file`: 文件（支持 JSON、CSV、GEXF 格式）
- `title`: 图谱标题（可选）
- `description`: 图谱描述（可选）

**状态**: 🚧 待实现

#### 7.2 导出图数据
```http
GET /api/graphs/{graph_id}/export?format=json
```

**路径参数**:
- `graph_id`: 图谱ID

**查询参数**:
- `format`: 导出格式（json/csv/gexf，默认: json）

**状态**: 🚧 待实现

### 8. 搜索查询 API (`/api`)

#### 8.1 全文搜索
```http
GET /api/search?q=搜索关键词&type=nodes&graph_id=图谱ID
```

**查询参数**:
- `q`: 搜索关键词（必需）
- `type`: 搜索类型（nodes/edges/graphs，可选）
- `graph_id`: 图谱ID（可选）

**状态**: 🚧 待实现

#### 8.2 执行 Cypher 查询
```http
POST /api/query
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "query": "MATCH (n) RETURN n LIMIT 10",
  "graph_id": "图谱ID"
}
```

**状态**: 🚧 待实现

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（需要登录） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 422 | 请求参数验证失败 |
| 500 | 服务器内部错误 |

## 错误响应格式

```json
{
  "detail": "错误详细信息"
}
```

## 配置信息

### 默认配置
- **主机**: 0.0.0.0
- **端口**: 8000
- **数据库**: SQLite (data/ai4kg.db)
- **图数据库**: Neo4j (bolt://localhost:7687)
- **JWT过期时间**: 24小时
- **最大文件大小**: 100MB

### 环境变量
可通过环境变量或 `.env` 文件配置：

```env
# 数据库配置
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
SQLITE_DB_PATH=data/ai4kg.db

# JWT配置
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# 应用配置
DEBUG=true
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Redis配置
REDIS_URL=redis://localhost:6379/0

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100
```

## 开发状态

- ✅ **已完成**: 认证系统、图谱基础管理
- 🚧 **开发中**: 节点/边管理、图分析、文件处理、搜索功能
- 📋 **计划中**: 高级分析算法、批量操作、实时更新

## 使用示例

### Python 客户端示例

```python
import requests

# 基础URL
BASE_URL = "http://localhost:8000"

# 用户登录
login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "username": "your_username",
    "password": "your_password"
})

token = login_response.json()["data"]["token"]
headers = {"Authorization": f"Bearer {token}"}

# 获取图谱列表
graphs_response = requests.get(f"{BASE_URL}/api/graphs", headers=headers)
graphs = graphs_response.json()["data"]["graphs"]

# 创建新图谱
new_graph = requests.post(f"{BASE_URL}/api/graphs", 
    headers=headers,
    json={
        "title": "我的知识图谱",
        "description": "图谱描述"
    }
)
```

### JavaScript 客户端示例

```javascript
// 基础配置
const BASE_URL = 'http://localhost:8000';

// 登录函数
async function login(username, password) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    return data.data.token;
}

// 获取图谱列表
async function getGraphs(token) {
    const response = await fetch(`${BASE_URL}/api/graphs`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    
    const data = await response.json();
    return data.data.graphs;
}
```

---

**注意**: 此API文档基于当前代码结构生成，部分功能标记为"待实现"状态。实际功能可用性请参考具体的实现进度。