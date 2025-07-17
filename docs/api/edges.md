# ↔️ 边管理 API

图谱中边（关系）的增删改查操作。

## 端点概览

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/graphs/{graph_id}/edges` | 获取图谱中的所有边 | ✅ |
| POST | `/api/graphs/{graph_id}/edges` | 创建新边 | ✅ |
| GET | `/api/graphs/{graph_id}/edges/{edge_id}` | 获取单个边详情 | ✅ |
| PUT | `/api/graphs/{graph_id}/edges/{edge_id}` | 更新边信息 | ✅ |
| DELETE | `/api/graphs/{graph_id}/edges/{edge_id}` | 删除边 | ✅ |
| POST | `/api/graphs/{graph_id}/edges/batch` | 批量创建边 | ✅ |
| PUT | `/api/graphs/{graph_id}/edges/batch` | 批量更新边 | ✅ |
| DELETE | `/api/graphs/{graph_id}/edges/batch` | 批量删除边 | ✅ |

---

## 📋 获取图谱边列表

获取指定图谱中的所有边。

**端点**: `GET /api/graphs/{graph_id}/edges`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "成功获取 15 条边",
  "data": [
    {
      "id": "string",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "关系标签",
      "type": "关系类型",
      "properties": {
        "weight": 0.8,
        "confidence": 0.95,
        "created_date": "2025-07-17"
      },
      "style": {
        "color": "#666666",
        "width": 2,
        "arrow": true
      }
    }
  ]
}
```

### 示例

```bash
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/edges" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## ➕ 创建新边

在指定图谱中创建一个新的边（关系）。

**端点**: `POST /api/graphs/{graph_id}/edges`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 请求参数

```json
{
  "id": "string",
  "source": "string",
  "target": "string",
  "label": "string",
  "type": "string",
  "properties": {
    "key": "value"
  },
  "style": {
    "color": "#666666",
    "width": 2,
    "arrow": true
  }
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| id | string | ❌ | 边ID（不提供则自动生成） |
| source | string | ✅ | 源节点ID |
| target | string | ✅ | 目标节点ID |
| label | string | ✅ | 边标签 |
| type | string | ✅ | 边类型 |
| properties | object | ❌ | 边属性键值对 |
| style | object | ❌ | 边样式设置 |

### 成功响应 (201)

```json
{
  "success": true,
  "message": "边创建成功",
  "data": {
    "id": "generated-edge-id",
    "source": "source_node_id",
    "target": "target_node_id",
    "label": "工作于",
    "type": "employment",
    "properties": {
      "start_date": "2020-01-01",
      "position": "软件工程师"
    },
    "style": {
      "color": "#666666",
      "width": 2,
      "arrow": true
    }
  }
}
```

### 错误响应

**400 - 节点不存在**
```json
{
  "detail": "源节点或目标节点不存在"
}
```

**400 - 边已存在**
```json
{
  "detail": "相同的边已存在"
}
```

### 示例

```bash
curl -X POST "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/edges" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "person-001",
    "target": "company-001",
    "label": "工作于",
    "type": "employment",
    "properties": {
      "start_date": "2020-01-01",
      "position": "软件工程师",
      "salary": 15000
    }
  }'
```

---

## 📄 获取单个边

获取指定边的详细信息。

**端点**: `GET /api/graphs/{graph_id}/edges/{edge_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |
| edge_id | string | ✅ | 边ID |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "获取边成功",
  "data": {
    "id": "string",
    "source": "source_node_id",
    "target": "target_node_id",
    "label": "string",
    "type": "string",
    "properties": {
      "key": "value"
    },
    "style": {
      "color": "#666666",
      "width": 2,
      "arrow": true
    },
    "source_node": {
      "id": "source_node_id",
      "label": "源节点标签",
      "type": "源节点类型"
    },
    "target_node": {
      "id": "target_node_id",
      "label": "目标节点标签",
      "type": "目标节点类型"
    }
  }
}
```

### 错误响应

**404 - 边不存在**
```json
{
  "detail": "边不存在"
}
```

---

## ✏️ 更新边信息

更新指定边的信息。

**端点**: `PUT /api/graphs/{graph_id}/edges/{edge_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |
| edge_id | string | ✅ | 边ID |

### 请求参数

```json
{
  "label": "string",
  "type": "string",
  "properties": {
    "key": "value"
  },
  "style": {
    "color": "#666666",
    "width": 2,
    "arrow": true
  }
}
```

**注意**: 不能更新边的source和target，如需更改连接关系请删除后重新创建。

### 成功响应 (200)

```json
{
  "success": true,
  "message": "边更新成功",
  "data": {
    "id": "string",
    "source": "source_node_id",
    "target": "target_node_id",
    "label": "更新后的标签",
    "type": "更新后的类型",
    "properties": {
      "updated_key": "updated_value"
    },
    "style": {
      "color": "#ff0000",
      "width": 3,
      "arrow": true
    }
  }
}
```

### 示例

```bash
curl -X PUT "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/edges/edge-123" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "曾工作于",
    "properties": {
      "end_date": "2023-12-31",
      "reason": "离职"
    },
    "style": {
      "color": "#cccccc",
      "width": 1
    }
  }'
```

---

## 🗑️ 删除边

删除指定的边。

**端点**: `DELETE /api/graphs/{graph_id}/edges/{edge_id}`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |
| edge_id | string | ✅ | 边ID |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "边删除成功",
  "data": {
    "deleted_edge_id": "string",
    "source_node_id": "string",
    "target_node_id": "string"
  }
}
```

### 示例

```bash
curl -X DELETE "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/edges/edge-123" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 📦 批量创建边

一次性创建多个边。

**端点**: `POST /api/graphs/{graph_id}/edges/batch`

### 请求参数

```json
{
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "label": "string",
      "type": "string",
      "properties": {},
      "style": {}
    }
  ]
}
```

### 成功响应 (201)

```json
{
  "success": true,
  "message": "批量创建边成功，共创建 8 条边",
  "data": {
    "created_count": 8,
    "failed_count": 2,
    "created_edges": [
      {
        "id": "edge1",
        "source": "node1",
        "target": "node2",
        "label": "关系1"
      }
    ],
    "failed_edges": [
      {
        "source": "invalid_node",
        "target": "node2",
        "error": "源节点不存在"
      }
    ]
  }
}
```

---

## 📝 批量更新边

一次性更新多个边。

**端点**: `PUT /api/graphs/{graph_id}/edges/batch`

### 请求参数

```json
{
  "updates": [
    {
      "id": "string",
      "label": "string",
      "type": "string",
      "properties": {},
      "style": {}
    }
  ]
}
```

### 成功响应 (200)

```json
{
  "success": true,
  "message": "批量更新边成功，共更新 5 条边",
  "data": {
    "updated_count": 5,
    "failed_count": 0,
    "updated_edges": ["edge1", "edge2", "edge3", "edge4", "edge5"],
    "failed_edges": []
  }
}
```

---

## 🗑️ 批量删除边

一次性删除多个边。

**端点**: `DELETE /api/graphs/{graph_id}/edges/batch`

### 请求参数

```json
{
  "edge_ids": ["edge1", "edge2", "edge3"]
}
```

### 成功响应 (200)

```json
{
  "success": true,
  "message": "批量删除边成功，共删除 3 条边",
  "data": {
    "deleted_count": 3,
    "deleted_edge_ids": ["edge1", "edge2", "edge3"]
  }
}
```

---

## 📊 数据模型

### Edge 对象

```typescript
interface Edge {
  id: string;                    // 边ID
  source: string;                // 源节点ID
  target: string;                // 目标节点ID
  label: string;                 // 边标签（显示名称）
  type: string;                  // 边类型
  properties?: {                 // 边属性
    [key: string]: any;
  };
  style?: {                      // 边样式
    color?: string;              // 颜色
    width?: number;              // 宽度
    arrow?: boolean;             // 是否显示箭头
    dashArray?: string;          // 虚线样式
    [key: string]: any;
  };
}
```

### EdgeWithNodes 对象

```typescript
interface EdgeWithNodes extends Edge {
  source_node: {                 // 源节点信息
    id: string;
    label: string;
    type: string;
  };
  target_node: {                 // 目标节点信息
    id: string;
    label: string;
    type: string;
  };
}
```

---

## 💡 使用建议

### 边设计最佳实践

1. **语义明确**: 使用清晰的关系标签，如"工作于"、"位于"、"包含"
2. **类型分类**: 按照领域对关系类型进行分类管理
3. **属性丰富**: 添加时间、权重、置信度等有用属性
4. **方向性**: 明确关系的方向性，合理使用箭头

### 性能优化

1. **批量操作**: 大量边操作时使用批量API
2. **索引优化**: 对常用的source、target字段建立索引
3. **关系过滤**: 提供类型、属性等过滤功能

### 数据完整性

1. **节点验证**: 创建边前验证源节点和目标节点是否存在
2. **重复检查**: 避免创建重复的边关系
3. **级联操作**: 删除节点时自动删除相关边

### 可视化考虑

1. **样式区分**: 不同类型的边使用不同颜色和样式
2. **权重表示**: 用线条粗细表示关系强度
3. **方向指示**: 合理使用箭头表示关系方向
4. **标签定位**: 确保边标签不会遮挡节点

### 关系建模

1. **一对一关系**: 如"结婚"关系
2. **一对多关系**: 如"拥有"关系  
3. **多对多关系**: 通过中间节点表示复杂关系
4. **时序关系**: 添加时间属性表示关系的变化

---

*返回 [API文档首页](./API.md)*
