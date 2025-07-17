# 🔵 节点管理 API

图谱中节点的增删改查操作。

## 端点概览

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/graphs/{graph_id}/nodes` | 获取图谱中的所有节点 | ✅ |
| POST | `/api/graphs/{graph_id}/nodes` | 创建新节点 | ✅ |
| GET | `/api/graphs/{graph_id}/nodes/{node_id}` | 获取单个节点详情 | ✅ |
| PUT | `/api/graphs/{graph_id}/nodes/{node_id}` | 更新节点信息 | ✅ |
| DELETE | `/api/graphs/{graph_id}/nodes/{node_id}` | 删除节点 | ✅ |
| POST | `/api/graphs/{graph_id}/nodes/batch` | 批量创建节点 | ✅ |
| PUT | `/api/graphs/{graph_id}/nodes/batch` | 批量更新节点 | ✅ |
| DELETE | `/api/graphs/{graph_id}/nodes/batch` | 批量删除节点 | ✅ |

---

## 📋 获取图谱节点列表

获取指定图谱中的所有节点，支持类型过滤和搜索。

**端点**: `GET /api/graphs/{graph_id}/nodes`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 查询参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| type | string | ❌ | 节点类型过滤 |
| search | string | ❌ | 搜索关键词（在label、type、properties中搜索） |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "成功获取 25 个节点",
  "data": [
    {
      "id": "string",
      "label": "string",
      "type": "string",
      "properties": {
        "name": "节点名称",
        "description": "节点描述",
        "category": "分类"
      },
      "position": {
        "x": 100,
        "y": 200
      },
      "style": {
        "color": "#1f77b4",
        "size": 10
      }
    }
  ]
}
```

### 示例

```bash
# 获取所有节点
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/nodes" \
  -H "Authorization: Bearer <your-jwt-token>"

# 按类型过滤
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/nodes?type=Person" \
  -H "Authorization: Bearer <your-jwt-token>"

# 搜索节点
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/nodes?search=张三" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## ➕ 创建新节点

在指定图谱中创建一个新节点。

**端点**: `POST /api/graphs/{graph_id}/nodes`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 请求参数

```json
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
  },
  "style": {
    "color": "#1f77b4",
    "size": 10
  }
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| id | string | ❌ | 节点ID（不提供则自动生成） |
| label | string | ✅ | 节点标签 |
| type | string | ✅ | 节点类型 |
| properties | object | ❌ | 节点属性键值对 |
| position | object | ❌ | 节点位置坐标 |
| style | object | ❌ | 节点样式设置 |

### 成功响应 (201)

```json
{
  "success": true,
  "message": "节点创建成功",
  "data": {
    "id": "generated-id",
    "label": "string",
    "type": "string",
    "properties": {
      "key": "value"
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "style": {
      "color": "#1f77b4",
      "size": 10
    }
  }
}
```

### 示例

```bash
curl -X POST "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/nodes" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "张三",
    "type": "Person",
    "properties": {
      "age": 30,
      "occupation": "工程师",
      "city": "北京"
    },
    "position": {
      "x": 100,
      "y": 200
    }
  }'
```

---

## 📄 获取单个节点

获取指定节点的详细信息。

**端点**: `GET /api/graphs/{graph_id}/nodes/{node_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |
| node_id | string | ✅ | 节点ID |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "获取节点成功",
  "data": {
    "id": "string",
    "label": "string",
    "type": "string",
    "properties": {
      "key": "value"
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "style": {
      "color": "#1f77b4",
      "size": 10
    },
    "relationships": {
      "incoming": ["edge_id_1", "edge_id_2"],
      "outgoing": ["edge_id_3", "edge_id_4"]
    }
  }
}
```

### 错误响应

**404 - 节点不存在**
```json
{
  "detail": "节点不存在"
}
```

---

## ✏️ 更新节点信息

更新指定节点的信息。

**端点**: `PUT /api/graphs/{graph_id}/nodes/{node_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |
| node_id | string | ✅ | 节点ID |

### 请求参数

```json
{
  "label": "string",
  "type": "string",
  "properties": {
    "key": "value"
  },
  "position": {
    "x": 0,
    "y": 0
  },
  "style": {
    "color": "#1f77b4",
    "size": 10
  }
}
```

### 成功响应 (200)

```json
{
  "success": true,
  "message": "节点更新成功",
  "data": {
    "id": "string",
    "label": "string",
    "type": "string",
    "properties": {
      "key": "value"
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "style": {
      "color": "#1f77b4",
      "size": 10
    }
  }
}
```

### 示例

```bash
curl -X PUT "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/nodes/node-123" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "李四",
    "properties": {
      "age": 35,
      "occupation": "产品经理"
    }
  }'
```

---

## 🗑️ 删除节点

删除指定节点及其所有相关的边。

**端点**: `DELETE /api/graphs/{graph_id}/nodes/{node_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |
| node_id | string | ✅ | 节点ID |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "节点删除成功，同时删除了 3 条相关边",
  "data": {
    "deleted_node_id": "string",
    "deleted_edge_count": 3,
    "deleted_edge_ids": ["edge1", "edge2", "edge3"]
  }
}
```

### 示例

```bash
curl -X DELETE "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/nodes/node-123" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 📦 批量创建节点

一次性创建多个节点。

**端点**: `POST /api/graphs/{graph_id}/nodes/batch`

### 请求参数

```json
{
  "nodes": [
    {
      "id": "string",
      "label": "string",
      "type": "string",
      "properties": {},
      "position": {"x": 0, "y": 0},
      "style": {}
    }
  ]
}
```

### 成功响应 (201)

```json
{
  "success": true,
  "message": "批量创建节点成功，共创建 5 个节点",
  "data": {
    "created_count": 5,
    "failed_count": 0,
    "created_nodes": [
      {
        "id": "string",
        "label": "string",
        "type": "string"
      }
    ],
    "failed_nodes": []
  }
}
```

---

## 📝 批量更新节点

一次性更新多个节点。

**端点**: `PUT /api/graphs/{graph_id}/nodes/batch`

### 请求参数

```json
{
  "updates": [
    {
      "id": "string",
      "label": "string",
      "type": "string",
      "properties": {},
      "position": {"x": 0, "y": 0},
      "style": {}
    }
  ]
}
```

### 成功响应 (200)

```json
{
  "success": true,
  "message": "批量更新节点成功，共更新 3 个节点",
  "data": {
    "updated_count": 3,
    "failed_count": 0,
    "updated_nodes": ["node1", "node2", "node3"],
    "failed_nodes": []
  }
}
```

---

## 🗑️ 批量删除节点

一次性删除多个节点。

**端点**: `DELETE /api/graphs/{graph_id}/nodes/batch`

### 请求参数

```json
{
  "node_ids": ["node1", "node2", "node3"]
}
```

### 成功响应 (200)

```json
{
  "success": true,
  "message": "批量删除节点成功，共删除 3 个节点和 8 条边",
  "data": {
    "deleted_node_count": 3,
    "deleted_edge_count": 8,
    "deleted_node_ids": ["node1", "node2", "node3"],
    "deleted_edge_ids": ["edge1", "edge2", "edge3", "edge4", "edge5", "edge6", "edge7", "edge8"]
  }
}
```

---

## 📊 数据模型

### Node 对象

```typescript
interface Node {
  id: string;                    // 节点ID
  label: string;                 // 节点标签（显示名称）
  type: string;                  // 节点类型
  properties?: {                 // 节点属性
    [key: string]: any;
  };
  position?: {                   // 节点在画布上的位置
    x: number;
    y: number;
  };
  style?: {                      // 节点样式
    color?: string;              // 颜色
    size?: number;               // 大小
    shape?: string;              // 形状
    [key: string]: any;
  };
}
```

### NodeWithRelationships 对象

```typescript
interface NodeWithRelationships extends Node {
  relationships: {
    incoming: string[];           // 入边ID列表
    outgoing: string[];           // 出边ID列表
  };
}
```

---

## 💡 使用建议

### 节点设计最佳实践

1. **一致的类型命名**: 使用统一的命名约定，如"Person"、"Organization"
2. **结构化属性**: 将相关属性组织成有意义的结构
3. **位置信息**: 为可视化效果提供合理的初始位置

### 性能优化

1. **批量操作**: 大量操作时优先使用批量API
2. **属性索引**: 对常用的属性字段建立索引
3. **分页查询**: 节点数量大时使用分页或过滤

### 数据完整性

1. **类型验证**: 确保节点类型的一致性
2. **属性验证**: 验证必要属性的存在和格式
3. **关系清理**: 删除节点时自动清理相关边

### 可视化考虑

1. **合理布局**: 提供初始位置避免节点重叠
2. **样式一致**: 同类型节点使用统一样式
3. **标签优化**: 使用简洁明了的标签

---

*返回 [API文档首页](./API.md)*
