# 📊 图谱管理 API

图谱的创建、查询、更新和删除操作。

## 端点概览

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/graphs` | 获取图谱列表 | ✅ |
| GET | `/api/graphs/{graph_id}` | 获取单个图谱详情 | ✅ |
| POST | `/api/graphs` | 创建新图谱 | ✅ |
| PUT | `/api/graphs/{graph_id}` | 更新图谱信息 | ✅ |
| DELETE | `/api/graphs/{graph_id}` | 删除图谱 | ✅ |

---

## 📋 获取图谱列表

获取当前用户的所有图谱，支持分页和搜索。

**端点**: `GET /api/graphs`

### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| page | integer | ❌ | 1 | 页码（从1开始） |
| size | integer | ❌ | 10 | 每页数量（1-100） |
| search | string | ❌ | - | 搜索关键词 |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "获取图谱列表成功",
  "data": {
    "graphs": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "created_at": "2025-07-17T10:00:00Z",
        "updated_at": "2025-07-17T10:00:00Z",
        "node_count": 0,
        "edge_count": 0
      }
    ],
    "total": 100
  }
}
```

### 示例

```bash
# 获取第一页，每页10条
curl -X GET "http://localhost:8000/api/graphs?page=1&size=10" \
  -H "Authorization: Bearer <your-jwt-token>"

# 搜索包含"知识"的图谱
curl -X GET "http://localhost:8000/api/graphs?search=知识" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 📄 获取单个图谱

获取指定图谱的详细信息，包含所有节点和边数据。

**端点**: `GET /api/graphs/{graph_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "获取图谱数据成功",
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "created_at": "2025-07-17T10:00:00Z",
    "updated_at": "2025-07-17T10:00:00Z",
    "nodes": [
      {
        "id": "string",
        "label": "string",
        "type": "string",
        "properties": {
          "key": "value"
        },
        "position": {
          "x": 0,
          "y": 0
        }
      }
    ],
    "edges": [
      {
        "id": "string",
        "source": "string",
        "target": "string",
        "label": "string",
        "type": "string",
        "properties": {
          "key": "value"
        }
      }
    ]
  }
}
```

### 错误响应

**404 - 图谱不存在**
```json
{
  "detail": "图谱不存在"
}
```

### 示例

```bash
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## ➕ 创建新图谱

创建一个新的空图谱。

**端点**: `POST /api/graphs`

### 请求参数

```json
{
  "title": "string",
  "description": "string"
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| title | string | ✅ | 图谱标题 |
| description | string | ❌ | 图谱描述 |

### 成功响应 (201)

```json
{
  "success": true,
  "message": "图谱创建成功",
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "created_at": "2025-07-17T10:00:00Z",
    "updated_at": "2025-07-17T10:00:00Z",
    "user_id": "uuid"
  }
}
```

### 示例

```bash
curl -X POST "http://localhost:8000/api/graphs" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的知识图谱",
    "description": "用于存储领域知识的图谱"
  }'
```

---

## ✏️ 更新图谱信息

更新指定图谱的基本信息。

**端点**: `PUT /api/graphs/{graph_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 请求参数

```json
{
  "title": "string",
  "description": "string"
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| title | string | ❌ | 新的图谱标题 |
| description | string | ❌ | 新的图谱描述 |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "图谱更新成功",
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "created_at": "2025-07-17T10:00:00Z",
    "updated_at": "2025-07-17T10:00:00Z",
    "user_id": "uuid"
  }
}
```

### 示例

```bash
curl -X PUT "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的图谱标题",
    "description": "更新后的描述信息"
  }'
```

---

## 🗑️ 删除图谱

删除指定图谱及其所有相关数据（节点、边等）。

**端点**: `DELETE /api/graphs/{graph_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "图谱删除成功",
  "data": null
}
```

### 错误响应

**404 - 图谱不存在**
```json
{
  "detail": "图谱不存在"
}
```

### 示例

```bash
curl -X DELETE "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 📊 数据模型

### Graph 对象

```typescript
interface Graph {
  id: string;                    // UUID格式的图谱ID
  title: string;                 // 图谱标题
  description?: string;          // 图谱描述
  created_at: string;           // 创建时间（ISO 8601格式）
  updated_at: string;           // 更新时间（ISO 8601格式）
  user_id: string;              // 所属用户ID
  node_count?: number;          // 节点数量（仅在列表中返回）
  edge_count?: number;          // 边数量（仅在列表中返回）
}
```

### GraphWithData 对象

```typescript
interface GraphWithData extends Graph {
  nodes: Node[];                // 图谱中的所有节点
  edges: Edge[];                // 图谱中的所有边
}
```

### GraphList 对象

```typescript
interface GraphList {
  graphs: Graph[];              // 图谱列表
  total: number;                // 总数量
}
```

---

## 💡 使用建议

### 分页最佳实践

1. **合理设置页面大小**: 建议每页10-50条记录
2. **使用搜索过滤**: 当数据量大时使用search参数缩小范围
3. **缓存策略**: 前端可以缓存已加载的图谱列表

### 性能优化

1. **按需加载**: 列表页面不加载完整图谱数据，详情页才加载nodes和edges
2. **增量更新**: 优先使用PATCH更新部分字段而非PUT全量更新
3. **批量操作**: 对于大量操作，考虑使用批量API

### 错误处理

1. **权限检查**: 确保用户只能访问自己的图谱
2. **数据验证**: 创建和更新时验证必填字段
3. **级联删除**: 删除图谱时同步删除相关的节点和边

---

*返回 [API文档首页](./API.md)*
