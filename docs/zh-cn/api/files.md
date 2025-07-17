# 📁 文件处理 API

图数据的导入导出功能，支持多种格式。

## 端点概览

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/graphs/import` | 导入图数据文件 | ✅ |
| GET | `/api/graphs/{graph_id}/export` | 导出图数据 | ✅ |

---

## 📤 导入图数据

从文件导入图数据创建新图谱。

**端点**: `POST /api/graphs/import`

### 请求参数

使用 `multipart/form-data` 格式：

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| file | File | ✅ | 图数据文件 |
| title | string | ❌ | 图谱标题（不提供则使用文件名） |
| description | string | ❌ | 图谱描述 |

### 支持的文件格式

| 格式 | 扩展名 | 描述 |
|------|--------|------|
| JSON | `.json` | 标准JSON格式图数据 |
| CSV | `.csv` | 边列表或节点列表格式 |
| GEXF | `.gexf` | Gephi交换格式 |
| GraphML | `.graphml` | 图标记语言格式 |
| NetworkX | `.json` | NetworkX图格式 |

### JSON格式示例

```json
{
  "nodes": [
    {
      "id": "node1",
      "label": "节点1",
      "type": "Person",
      "properties": {
        "name": "张三",
        "age": 30
      }
    }
  ],
  "edges": [
    {
      "id": "edge1", 
      "source": "node1",
      "target": "node2",
      "label": "认识",
      "type": "relationship"
    }
  ]
}
```

### CSV格式要求

**节点文件格式** (`nodes.csv`):
```csv
id,label,type,name,age
node1,张三,Person,张三,30
node2,李四,Person,李四,25
```

**边文件格式** (`edges.csv`):
```csv
source,target,label,type,weight
node1,node2,认识,friendship,0.8
node2,node3,同事,colleague,0.9
```

### 成功响应 (200)

```json
{
  "success": true,
  "message": "文件导入成功",
  "data": {
    "graph_id": "uuid",
    "title": "导入的图谱",
    "description": "从文件导入的图谱数据",
    "import_stats": {
      "nodes_imported": 150,
      "edges_imported": 320,
      "nodes_failed": 2,
      "edges_failed": 1,
      "import_time": "2.34s"
    },
    "warnings": [
      "发现2个重复节点ID，已自动处理",
      "1条边的源节点不存在，已跳过"
    ]
  }
}
```

### 错误响应

**400 - 文件格式错误**
```json
{
  "success": false,
  "message": "文件导入失败: 不支持的文件格式",
  "data": null
}
```

**400 - 文件内容错误**
```json
{
  "success": false,
  "message": "文件导入失败: JSON格式错误",
  "data": {
    "error_line": 15,
    "error_detail": "Invalid JSON syntax"
  }
}
```

**413 - 文件过大**
```json
{
  "detail": "文件大小超过限制 (最大100MB)"
}
```

### 示例

```bash
# 导入JSON文件
curl -X POST "http://localhost:8000/api/graphs/import" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@graph_data.json" \
  -F "title=我的知识图谱" \
  -F "description=从JSON文件导入的图谱"

# 导入CSV文件
curl -X POST "http://localhost:8000/api/graphs/import" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@edges.csv" \
  -F "title=关系网络"
```

---

## 📥 导出图数据

将图谱数据导出为文件。

**端点**: `GET /api/graphs/{graph_id}/export`

### 路径参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| graph_id | uuid | ✅ | 图谱ID |

### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| format | string | ❌ | json | 导出格式 (json/csv/gexf/graphml) |

### 支持的导出格式

| 格式 | 文件类型 | 描述 |
|------|----------|------|
| json | application/json | 标准JSON格式 |
| csv | application/zip | ZIP包含nodes.csv和edges.csv |
| gexf | application/xml | GEXF格式（用于Gephi） |
| graphml | application/xml | GraphML格式 |

### 成功响应

返回文件流，Content-Type根据格式确定。

**响应头示例**:
```
Content-Type: application/json
Content-Disposition: attachment; filename="graph_123_2025-07-17.json"
```

### JSON导出格式

```json
{
  "graph_info": {
    "id": "uuid",
    "title": "图谱标题",
    "description": "图谱描述",
    "export_time": "2025-07-17T10:00:00Z",
    "node_count": 150,
    "edge_count": 320
  },
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
      },
      "style": {
        "color": "#1f77b4",
        "size": 10
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
      },
      "style": {
        "color": "#666666",
        "width": 2
      }
    }
  ]
}
```

### CSV导出格式

导出为ZIP文件，包含：

**nodes.csv**:
```csv
id,label,type,x,y,color,size,property_key1,property_key2
node1,张三,Person,100,200,#1f77b4,10,30,工程师
node2,李四,Person,300,400,#1f77b4,10,25,设计师
```

**edges.csv**:
```csv
id,source,target,label,type,color,width,property_key1,property_key2
edge1,node1,node2,认识,friendship,#666666,2,0.8,朋友
edge2,node2,node3,同事,colleague,#666666,2,0.9,同一部门
```

### 错误响应

**404 - 图谱不存在**
```json
{
  "detail": "图谱不存在"
}
```

**400 - 不支持的格式**
```json
{
  "detail": "不支持的导出格式: xlsx"
}
```

### 示例

```bash
# 导出为JSON
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/export?format=json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -o graph_export.json

# 导出为CSV
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/export?format=csv" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -o graph_export.zip

# 导出为GEXF（用于Gephi）
curl -X GET "http://localhost:8000/api/graphs/123e4567-e89b-12d3-a456-426614174000/export?format=gexf" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -o graph_export.gexf
```

---

## 📄 文件格式详解

### JSON格式规范

AI4KG使用的标准JSON格式：

```json
{
  "graph_info": {
    "title": "图谱标题",
    "description": "图谱描述",
    "created_at": "2025-07-17T10:00:00Z"
  },
  "nodes": [
    {
      "id": "必需：节点唯一标识",
      "label": "必需：显示标签",
      "type": "必需：节点类型",
      "properties": {
        "自定义属性": "属性值"
      },
      "position": {
        "x": 100,
        "y": 200
      },
      "style": {
        "color": "#颜色代码",
        "size": 10,
        "shape": "circle"
      }
    }
  ],
  "edges": [
    {
      "id": "可选：边标识",
      "source": "必需：源节点ID",
      "target": "必需：目标节点ID", 
      "label": "必需：关系标签",
      "type": "必需：关系类型",
      "properties": {
        "weight": 0.8,
        "confidence": 0.95
      },
      "style": {
        "color": "#颜色代码",
        "width": 2,
        "arrow": true
      }
    }
  ]
}
```

### CSV格式规范

#### 节点文件 (nodes.csv)
- **必需列**: `id`, `label`, `type`
- **可选列**: `x`, `y`（位置），`color`, `size`（样式），其他自定义属性
- **编码**: UTF-8
- **分隔符**: 逗号

#### 边文件 (edges.csv)
- **必需列**: `source`, `target`, `label`, `type`
- **可选列**: `id`, `color`, `width`（样式），其他自定义属性
- **编码**: UTF-8
- **分隔符**: 逗号

### GEXF格式

GEXF（Graph Exchange XML Format）是Gephi的标准格式，适合网络分析和可视化。

### GraphML格式

GraphML是基于XML的图交换格式，支持复杂的图结构和属性。

---

## 💡 使用建议

### 导入最佳实践

1. **数据清洗**: 导入前检查数据质量，去除重复和无效数据
2. **格式验证**: 确保文件格式符合规范
3. **分批导入**: 大文件建议分批导入避免超时
4. **备份原始数据**: 保留原始数据文件作为备份

### 导出策略

1. **选择合适格式**: 
   - JSON：通用格式，保留完整信息
   - CSV：简单分析，表格工具友好
   - GEXF：Gephi可视化分析
   - GraphML：网络分析工具

2. **定期备份**: 定期导出重要图谱数据
3. **版本管理**: 导出文件包含时间戳便于版本管理

### 性能优化

1. **文件大小限制**: 注意100MB文件大小限制
2. **压缩格式**: 大数据考虑使用压缩格式
3. **分块处理**: 超大图谱考虑分块导入导出
4. **异步处理**: 大文件操作考虑异步处理

### 数据完整性

1. **验证导入**: 导入后检查节点和边数量
2. **错误处理**: 注意处理导入过程中的错误和警告
3. **数据映射**: 确保属性正确映射
4. **关系完整**: 验证边的源节点和目标节点都存在

---

## 🔧 故障排除

### 常见导入问题

1. **编码问题**: 使用UTF-8编码
2. **格式错误**: 检查JSON语法或CSV格式
3. **节点ID重复**: 确保节点ID唯一
4. **边引用错误**: 确保边引用的节点存在
5. **文件过大**: 分批导入或压缩文件

### 常见导出问题

1. **权限错误**: 确保有图谱访问权限
2. **图谱为空**: 空图谱导出结果为空
3. **格式不支持**: 检查format参数是否正确
4. **网络超时**: 大图谱导出可能需要较长时间

---

*返回 [API文档首页](./API.md)*
