# AI4KG 后端 API 文档

AI4KG 知识图谱可视化平台的后端API服务。

## 项目概述

本项目提供知识图谱的创建、存储、查询和可视化支持的后端API服务。采用灵活的数据库架构，支持从开发环境的零配置部署到生产环境的高性能集群。

### 主要特性

- 🚀 **零配置启动**: 基于SQLite的开箱即用体验
- 🔄 **灵活架构**: 支持SQLite单机模式和Neo4j集群模式
- 📊 **NetworkX集成**: 无缝导入科研常用的NetworkX图数据
- 🔐 **安全认证**: JWT token认证和权限管理
- 📈 **高性能**: 支持百万级节点的图数据处理
- 🛠️ **开发友好**: 完整的API文档和开发工具

## 技术栈

- **框架**: FastAPI
- **数据库架构**: 
  - **SQLite**: 用户信息、图谱元数据存储
  - **Neo4j**: 图数据存储（可选，用于复杂图查询）
- **认证**: JWT Token
- **文件处理**: 支持 JSON, CSV, GEXF, GraphML 格式
- **数据导入**: 支持 NetworkX 格式转换

## API 基础信息

- **Base URL**: `http://localhost:8000/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

### 通用响应格式

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "error": null
}
```

### 错误响应格式

```json
{
  "success": false,
  "data": null,
  "message": "操作失败",
  "error": "具体错误信息"
}
```

## 数据模型

### Node (节点)

```typescript
{
  "id": "string",          // 唯一标识
  "label": "string",       // 显示标签
  "type": "string",        // 节点类型 (entity, concept, relation)
  "properties": {},        // 自定义属性
  "x": "number",          // X坐标 (可选)
  "y": "number",          // Y坐标 (可选)
  "size": "number",       // 节点大小 (可选)
  "color": "string"       // 颜色 (可选)
}
```

### Edge (边)

```typescript
{
  "id": "string",          // 唯一标识
  "source": "string",      // 源节点ID
  "target": "string",      // 目标节点ID
  "label": "string",       // 边标签 (可选)
  "type": "string",        // 边类型 (relationship, inheritance, association)
  "properties": {},        // 自定义属性
  "weight": "number",     // 权重 (可选)
  "color": "string"       // 颜色 (可选)
}
```

### Graph (图)

```typescript
{
  "id": "string",
  "title": "string",
  "description": "string",
  "nodes": "Node[]",
  "edges": "Edge[]",
  "metadata": {
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "nodeCount": "number",
    "edgeCount": "number"
  }
}
```

## API 端点

### 1. 认证相关

#### 用户登录
```http
POST /auth/login
```

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    }
  }
}
```

#### 用户注册
```http
POST /auth/register
```

**请求体:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### 令牌验证
```http
GET /auth/verify
Headers: Authorization: Bearer {token}
```

### 2. 图谱管理

#### 获取图谱列表
```http
GET /graphs
```

**查询参数:**
- `page`: 页码 (默认: 1)
- `size`: 每页数量 (默认: 10)
- `search`: 搜索关键词 (可选)

**响应:**
```json
{
  "success": true,
  "data": {
    "graphs": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "nodeCount": "number",
        "edgeCount": "number",
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ],
    "total": "number"
  }
}
```

#### 获取单个图谱
```http
GET /graphs/{graph_id}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "nodes": [],
    "edges": [],
    "metadata": {}
  }
}
```

#### 创建图谱
```http
POST /graphs
```

**请求体:**
```json
{
  "title": "string",
  "description": "string",
  "nodes": [],
  "edges": []
}
```

#### 更新图谱
```http
PUT /graphs/{graph_id}
```

**请求体:**
```json
{
  "title": "string",
  "description": "string",
  "nodes": [],
  "edges": []
}
```

#### 删除图谱
```http
DELETE /graphs/{graph_id}
```

### 3. 节点管理

#### 获取图谱中的所有节点
```http
GET /graphs/{graph_id}/nodes
```

**查询参数:**
- `type`: 节点类型过滤 (可选)
- `search`: 搜索关键词 (可选)

#### 创建节点
```http
POST /graphs/{graph_id}/nodes
```

**请求体:**
```json
{
  "label": "string",
  "type": "string",
  "properties": {},
  "x": "number",
  "y": "number",
  "size": "number",
  "color": "string"
}
```

#### 更新节点
```http
PUT /graphs/{graph_id}/nodes/{node_id}
```

#### 删除节点
```http
DELETE /graphs/{graph_id}/nodes/{node_id}
```

### 4. 边管理

#### 获取图谱中的所有边
```http
GET /graphs/{graph_id}/edges
```

#### 创建边
```http
POST /graphs/{graph_id}/edges
```

**请求体:**
```json
{
  "source": "string",
  "target": "string",
  "label": "string",
  "type": "string",
  "properties": {},
  "weight": "number",
  "color": "string"
}
```

#### 更新边
```http
PUT /graphs/{graph_id}/edges/{edge_id}
```

#### 删除边
```http
DELETE /graphs/{graph_id}/edges/{edge_id}
```

### 5. 图分析

#### 获取节点邻居
```http
GET /graphs/{graph_id}/nodes/{node_id}/neighbors
```

**查询参数:**
- `depth`: 搜索深度 (默认: 1)
- `direction`: 方向 (in/out/both, 默认: both)

#### 获取最短路径
```http
GET /graphs/{graph_id}/path
```

**查询参数:**
- `source`: 源节点ID
- `target`: 目标节点ID
- `algorithm`: 算法类型 (dijkstra/astar, 默认: dijkstra)

#### 图统计信息
```http
GET /graphs/{graph_id}/stats
```

**响应:**
```json
{
  "success": true,
  "data": {
    "nodeCount": "number",
    "edgeCount": "number",
    "density": "number",
    "avgDegree": "number",
    "connectedComponents": "number",
    "nodeTypes": {},
    "edgeTypes": {}
  }
}
```

### 6. 文件导入导出

#### 导入图数据
```http
POST /graphs/import
Content-Type: multipart/form-data
```

**请求体:**
- `file`: 文件 (支持 JSON, CSV, GEXF, GraphML 格式)
- `title`: 图谱标题 (可选)
- `description`: 图谱描述 (可选)

**支持格式:**
- **GraphML**: NetworkX标准格式，支持丰富属性
- **GEXF**: Gephi可视化软件格式
- **JSON**: 通用图数据交换格式
- **CSV**: 节点表和边表分离格式

#### NetworkX 数据导入（推荐）

使用专门的导入脚本处理NetworkX格式数据：

```bash
# 导入单个文件
python scripts/import_networkx.py \
  --file graph.graphml \
  --title "我的知识图谱" \
  --username your_username \
  --password your_password

# 批量导入
python scripts/import_networkx.py \
  --directory ./graphs \
  --title-prefix "研究_" \
  --username your_username
```

**支持的NetworkX格式:**
- `.gml` - Graph Modeling Language
- `.graphml` - GraphML XML格式
- `.gexf` - Gephi Exchange XML Format
- `.json` - NetworkX JSON格式

**属性自动映射:**
- 节点属性: `pos` → `x,y`, `size` → `size`, `color` → `color`
- 边属性: `weight` → `weight`, `relation` → `type`
- 自定义属性保存在 `properties` 字段中

#### 导出图数据
```http
GET /graphs/{graph_id}/export
```

**查询参数:**
- `format`: 导出格式 (json/csv/gexf, 默认: json)

**响应:** 文件下载

### 7. 搜索和查询

#### 全文搜索
```http
GET /search
```

**查询参数:**
- `q`: 搜索关键词
- `type`: 搜索类型 (nodes/edges/graphs)
- `graph_id`: 限定图谱范围 (可选)

#### 高级查询 (Cypher)
```http
POST /query
```

**请求体:**
```json
{
  "graph_id": "string",
  "query": "MATCH (n) RETURN n LIMIT 10",
  "parameters": {}
}
```

## 错误代码

| 状态码 | 错误代码 | 描述 |
|--------|----------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权访问 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 开发环境设置

### 环境变量

```bash
# 数据库配置
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# SQLite 数据库配置
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
```

### 安装依赖

```bash
# Python 依赖 (requirements.txt)
fastapi==0.104.1
uvicorn==0.24.0
neo4j==5.13.0
sqlalchemy==2.0.23
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
python-multipart==0.0.6
pandas==2.1.3
networkx==3.2.1
```

### 启动服务

```bash
# 开发模式
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
gunicorn main:app -w 4 -k uvicorn.workers.UnicornWorker
```

## 数据库架构

AI4KG 采用混合数据库架构，支持不同的部署模式：

### 模式1: 纯SQLite模式（推荐用于开发和小规模部署）

- **存储**: 所有数据存储在SQLite中
- **优势**: 
  - 零配置，开箱即用
  - 单文件数据库，易于备份和迁移
  - 适合小到中等规模的图数据（<10万节点）
- **限制**: 不支持复杂的图查询算法

### 模式2: SQLite + Neo4j混合模式（推荐用于生产环境）

- **SQLite**: 存储用户信息、图谱元数据
- **Neo4j**: 存储节点和边的详细数据，支持复杂图查询
- **优势**:
  - 充分利用Neo4j的图查询能力
  - 支持大规模图数据处理
  - 支持高级图算法（最短路径、社区检测等）
- **要求**: 需要单独部署Neo4j服务

### 数据库表结构

#### SQLite 表

```sql
-- 用户表
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 图谱元数据表
CREATE TABLE graphs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    user_id TEXT REFERENCES users(id),
    neo4j_graph_id TEXT,
    node_count INTEGER DEFAULT 0,
    edge_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Neo4j 节点和关系

```cypher
// 节点结构
CREATE (n:Node {
    id: "node_id",
    graph_id: "graph_uuid",
    label: "显示标签",
    type: "节点类型",
    properties: {...},
    x: 100,
    y: 200,
    size: 50,
    color: "#ff0000"
})

// 边结构
CREATE (source)-[r:EDGE {
    id: "edge_id",
    graph_id: "graph_uuid",
    type: "边类型",
    label: "边标签",
    properties: {...},
    weight: 0.8,
    color: "#0000ff"
}]->(target)
```

### 配置数据库模式

通过环境变量配置数据库模式：

```bash
# 基础配置（所有模式必需）
SQLITE_DB_PATH=data/ai4kg.db

# Neo4j配置（可选，用于混合模式）
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Redis配置（可选，用于缓存）
REDIS_URL=redis://localhost:6379/0
```

### 部署建议

| 场景 | 推荐模式 | 节点数量 | 特点 |
|------|----------|----------|------|
| 开发测试 | 纯SQLite | <1万 | 快速启动，零配置 |
| 小型项目 | 纯SQLite | 1万-10万 | 简单部署，低维护成本 |
| 中大型项目 | SQLite+Neo4j | >10万 | 高性能图查询，扩展性好 |
| 企业级 | SQLite+Neo4j+Redis | >100万 | 完整功能，高可用性 |

## 快速开始

### 1. 基础部署（纯SQLite模式）

```bash
# 克隆项目
git clone <repository-url>
cd ai4kg/backend

# 复制环境配置
cp .env.example .env

# 安装依赖（使用uv，推荐）
uv sync

# 或使用pip
pip install -r requirements.txt

# 启动服务
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 访问API文档
open http://localhost:8000/docs
```

### 2. 创建用户并导入数据

```bash
# 注册用户
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password"
  }'

# 导入NetworkX图数据
python scripts/import_networkx.py \
  --file your_graph.graphml \
  --title "我的知识图谱" \
  --username admin \
  --password password

# 运行演示数据
python scripts/demo_import.py
```

### 3. 进阶部署（加入Neo4j支持）

```bash
# 启动Neo4j（使用Docker）
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  neo4j:latest

# 更新环境变量
echo "NEO4J_URI=bolt://localhost:7687" >> .env
echo "NEO4J_USER=neo4j" >> .env
echo "NEO4J_PASSWORD=your_password" >> .env

# 重启服务以启用Neo4j支持
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 性能优化

1. **缓存策略**: Redis 缓存常用查询结果
2. **分页**: 大数据集使用游标分页
3. **索引**: Neo4j 节点和边属性索引
4. **连接池**: 数据库连接池管理
5. **异步处理**: 大文件导入使用后台任务

## 安全考虑

1. **认证**: JWT Token 认证
2. **授权**: 基于角色的访问控制 (RBAC)
3. **数据验证**: Pydantic 模型验证
4. **SQL注入**: 参数化查询
5. **CORS**: 跨域请求限制
6. **速率限制**: API 调用频率限制

## 测试

```bash
# 运行测试
pytest tests/

# 生成覆盖率报告
pytest --cov=app tests/
```

## 部署

使用 Docker 容器化部署：

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

