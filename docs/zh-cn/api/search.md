# 🔍 搜索查询 API

全文搜索和结构化查询功能。

## 端点概览

| 方法 | 路径 | 描述 | 认证 | 状态 |
|------|------|------|------|------|
| GET | `/api/search` | 全文搜索 | ✅ | 🚧 待实现 |
| POST | `/api/query` | Cypher查询 | ✅ | 🚧 待实现 |

> **注意**: 本模块的功能目前处于开发阶段，API接口已定义但功能待实现。

---

## 🔍 全文搜索

在用户的所有图谱中进行全文搜索。

**端点**: `GET /api/search`

### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| q | string | ✅ | - | 搜索查询词 |
| type | string | ❌ | - | 搜索类型过滤 (node/nodes/edge/edges/graph/graphs) |
| graph_id | uuid | ❌ | - | 限定在特定图谱中搜索 |
| page | integer | ❌ | 1 | 页码 |
| size | integer | ❌ | 10 | 每页结果数量 (1-100) |

### 搜索范围

全文搜索将在以下内容中查找：

**图谱级别**:
- 图谱标题和描述

**节点级别**:
- 节点标签 (label)
- 节点类型 (type)
- 节点属性值 (properties)

**边级别**:
- 边标签 (label)
- 边类型 (type)
- 边属性值 (properties)

### 成功响应 (200)

```json
{
  "success": true,
  "message": "全文搜索功能待实现",
  "data": {
    "query": "张三",
    "total": 25,
    "page": 1,
    "size": 10,
    "items": [
      {
        "type": "node",
        "graph_id": "uuid",
        "graph_title": "员工关系图",
        "item_id": "person-001",
        "item_label": "张三",
        "item_type": "Person",
        "matched_fields": ["label", "properties.name"],
        "matched_content": ["张三", "张三"],
        "relevance_score": 0.95,
        "context": {
          "properties": {
            "name": "张三",
            "position": "软件工程师",
            "department": "技术部"
          }
        }
      },
      {
        "type": "edge",
        "graph_id": "uuid", 
        "graph_title": "员工关系图",
        "item_id": "edge-001",
        "item_label": "张三的同事",
        "item_type": "colleague",
        "matched_fields": ["properties.description"],
        "matched_content": ["张三是李四的同事"],
        "relevance_score": 0.78,
        "context": {
          "source": "person-001",
          "target": "person-002",
          "source_label": "张三",
          "target_label": "李四"
        }
      },
      {
        "type": "graph",
        "graph_id": "uuid",
        "graph_title": "张三的社交网络",
        "matched_fields": ["title"],
        "matched_content": ["张三的社交网络"],
        "relevance_score": 0.85,
        "context": {
          "description": "描述张三的社交关系网络",
          "node_count": 45,
          "edge_count": 89
        }
      }
    ],
    "facets": {
      "types": {
        "node": 15,
        "edge": 8,
        "graph": 2
      },
      "graphs": {
        "员工关系图": 18,
        "项目协作图": 7
      },
      "node_types": {
        "Person": 12,
        "Organization": 3
      },
      "edge_types": {
        "colleague": 5,
        "friend": 3
      }
    },
    "suggestions": [
      "张三丰",
      "张小三",
      "李张三"
    ]
  }
}
```

### 搜索结果字段说明

| 字段 | 描述 |
|------|------|
| type | 结果类型 (node/edge/graph) |
| graph_id | 所属图谱ID |
| graph_title | 所属图谱标题 |
| item_id | 项目ID |
| item_label | 项目标签 |
| item_type | 项目类型 |
| matched_fields | 匹配的字段列表 |
| matched_content | 匹配的内容片段 |
| relevance_score | 相关性评分 (0-1) |
| context | 上下文信息 |

### 错误响应

**400 - 查询为空**
```json
{
  "success": false,
  "message": "搜索查询不能为空",
  "data": []
}
```

**422 - 参数错误**
```json
{
  "detail": [
    {
      "loc": ["query", "type"],
      "msg": "string does not match regex pattern",
      "type": "value_error.str.regex"
    }
  ]
}
```

### 示例

```bash
# 基本搜索
curl -X GET "http://localhost:8000/api/search?q=张三" \
  -H "Authorization: Bearer <your-jwt-token>"

# 在特定图谱中搜索
curl -X GET "http://localhost:8000/api/search?q=工程师&graph_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <your-jwt-token>"

# 只搜索节点
curl -X GET "http://localhost:8000/api/search?q=技术&type=nodes" \
  -H "Authorization: Bearer <your-jwt-token>"

# 分页搜索
curl -X GET "http://localhost:8000/api/search?q=公司&page=2&size=20" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 🔧 Cypher查询

执行类似Cypher的结构化查询。

**端点**: `POST /api/query`

### 请求参数

```json
{
  "query": "string",
  "parameters": {
    "key": "value"
  },
  "graph_id": "uuid",
  "limit": 100
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| query | string | ✅ | Cypher查询语句 |
| parameters | object | ❌ | 查询参数 |
| graph_id | uuid | ❌ | 限定查询的图谱ID |
| limit | integer | ❌ | 结果数量限制 (默认100) |

### 支持的Cypher语法

> **注意**: 当前为计划支持的语法，具体实现可能有差异。

#### 基本查询
```cypher
// 查找所有Person类型的节点
MATCH (n:Person) RETURN n LIMIT 10

// 查找特定标签的节点
MATCH (n) WHERE n.label = "张三" RETURN n

// 查找关系
MATCH (a)-[r:works_for]->(b) RETURN a, r, b
```

#### 条件查询
```cypher
// 属性过滤
MATCH (n:Person) WHERE n.age > 30 RETURN n

// 多条件
MATCH (n:Person) 
WHERE n.age > 25 AND n.department = "技术部" 
RETURN n

// 字符串匹配
MATCH (n) WHERE n.name CONTAINS "张" RETURN n
```

#### 路径查询
```cypher
// 查找路径
MATCH p = (a:Person)-[:works_for*1..3]->(b:Company) 
RETURN p

// 最短路径
MATCH p = shortestPath((a:Person)-[*]-(b:Person))
WHERE a.name = "张三" AND b.name = "李四"
RETURN p
```

### 成功响应 (200)

```json
{
  "success": true,
  "message": "Cypher查询功能待实现",
  "data": {
    "query": "MATCH (n:Person) WHERE n.age > 30 RETURN n LIMIT 5",
    "execution_time": "0.045s",
    "result_count": 5,
    "columns": ["n"],
    "results": [
      {
        "n": {
          "id": "person-001",
          "label": "张三",
          "type": "Person",
          "properties": {
            "age": 35,
            "name": "张三",
            "department": "技术部"
          }
        }
      }
    ],
    "statistics": {
      "nodes_examined": 150,
      "relationships_examined": 0,
      "properties_accessed": 150
    }
  }
}
```

### 错误响应

**400 - 语法错误**
```json
{
  "success": false,
  "message": "Cypher查询语法错误",
  "data": {
    "error": "Syntax error at line 1, column 15",
    "query": "MATCH (n:Person RETURN n",
    "suggestion": "Missing closing parenthesis"
  }
}
```

**400 - 查询过于复杂**
```json
{
  "success": false,
  "message": "查询过于复杂，请简化查询条件",
  "data": {
    "complexity_score": 95,
    "max_allowed": 80
  }
}
```

### 示例

```bash
# 基本节点查询
curl -X POST "http://localhost:8000/api/query" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "MATCH (n:Person) WHERE n.age > 30 RETURN n LIMIT 10"
  }'

# 参数化查询
curl -X POST "http://localhost:8000/api/query" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "MATCH (n:Person) WHERE n.name = $name RETURN n",
    "parameters": {
      "name": "张三"
    }
  }'

# 关系查询
curl -X POST "http://localhost:8000/api/query" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "MATCH (a:Person)-[r:works_for]->(b:Company) RETURN a.name, b.name, r.position",
    "graph_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

---

## 💡 使用建议

### 搜索策略

1. **关键词选择**: 使用具体、相关的关键词
2. **类型过滤**: 明确搜索目标类型提高精度
3. **分页处理**: 大量结果时使用分页
4. **结果排序**: 利用相关性评分排序

### 查询优化

1. **限制结果**: 使用LIMIT控制返回数量
2. **索引利用**: 优先使用有索引的属性查询
3. **避免全表扫描**: 添加适当的过滤条件
4. **参数化查询**: 使用参数避免注入攻击

### 性能考虑

1. **复杂度控制**: 避免过于复杂的查询
2. **超时设置**: 设置合理的查询超时时间
3. **缓存策略**: 缓存常用查询结果
4. **分页查询**: 大结果集使用分页

### 安全考虑

1. **查询验证**: 验证查询语法和安全性
2. **权限检查**: 确保只能查询有权限的数据
3. **资源限制**: 限制查询复杂度和执行时间
4. **参数化**: 使用参数化查询防止注入

---

## 🚧 开发状态

### 全文搜索计划功能

- [x] API接口设计
- [ ] 全文索引建立
- [ ] 搜索算法实现
- [ ] 相关性排序
- [ ] 搜索建议
- [ ] 分面搜索 (Faceted Search)
- [ ] 搜索高亮
- [ ] 搜索历史

### Cypher查询计划功能

- [x] API接口设计
- [ ] Cypher解析器
- [ ] 查询执行引擎
- [ ] 查询优化器
- [ ] 参数化查询
- [ ] 查询计划显示
- [ ] 性能监控
- [ ] 查询缓存

### 搜索引擎选型

考虑的搜索引擎：
1. **Elasticsearch**: 强大的全文搜索能力
2. **Whoosh**: 轻量级Python搜索库
3. **Postgres FTS**: 利用PostgreSQL的全文搜索
4. **专用图查询**: Neo4j Cypher风格的查询

---

## 📝 查询语法参考

### 基本模式匹配

```cypher
// 节点匹配
MATCH (n)                    // 所有节点
MATCH (n:Label)              // 特定标签节点
MATCH (n:Label {prop: value}) // 带属性的节点

// 关系匹配
MATCH (a)-[r]->(b)           // 任意关系
MATCH (a)-[r:TYPE]->(b)      // 特定类型关系
MATCH (a)-[r:TYPE*1..3]->(b) // 变长路径
```

### 条件过滤

```cypher
// WHERE子句
WHERE n.age > 30
WHERE n.name STARTS WITH "张"
WHERE n.name CONTAINS "工程师"
WHERE n.age IN [25, 30, 35]
WHERE exists(n.email)
```

### 返回子句

```cypher
// 返回节点和属性
RETURN n
RETURN n.name, n.age
RETURN count(n)
RETURN distinct n.type
```

### 排序和限制

```cypher
// 排序
ORDER BY n.age DESC
ORDER BY n.name ASC, n.age DESC

// 限制
LIMIT 10
SKIP 20 LIMIT 10
```

---

*返回 [API文档首页](./API.md)*
