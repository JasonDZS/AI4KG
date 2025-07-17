# AI4KG API 文档

AI4KG 知识图谱可视化平台的后端API服务，提供完整的图谱管理、节点和边操作、图分析、文件处理和搜索功能。

## 🚀 快速开始

- **基础URL**: `http://localhost:8000`
- **API版本**: v1.0.0
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

## 📚 API 文档导航

### 核心模块

| 模块 | 描述 | 文档链接 |
|------|------|----------|
| 🔐 **认证模块** | 用户注册、登录、token验证 | [auth.md](/api/auth.md) |
| 📊 **图谱管理** | 创建、查询、更新、删除图谱 | [graphs.md](/api/graphs.md) |
| 🔵 **节点管理** | 节点的增删改查操作 | [nodes.md](/api/nodes.md) |
| ↔️ **边管理** | 边的增删改查操作 | [edges.md](/api/edges.md) |
| 📈 **图分析** | 图统计、中心性分析、社区检测等 | [analysis.md](/api/analysis.md) |
| 📁 **文件处理** | 图数据导入导出功能 | [files.md](/api/files.md) |
| 🔍 **搜索查询** | 全文搜索和Cypher查询 | [search.md](/api/search.md) |

## 🌐 通用响应格式

所有API端点都使用统一的响应格式：

```json
{
  "success": true,
  "message": "操作描述信息",
  "data": {
    // 具体数据内容
  }
}
```

### 成功响应
- `success`: `true`
- `message`: 成功操作的描述信息
- `data`: 返回的具体数据

### 错误响应
- `success`: `false`
- `message`: 错误描述信息
- `data`: `null` 或错误详情

## 🔒 认证说明

除了以下公开端点外，所有API都需要认证：
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /` - 根路径
- `GET /health` - 健康检查

### Token使用方式

在请求头中添加Authorization字段：
```
Authorization: Bearer <your-jwt-token>
```

## 📊 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 🔧 错误处理

### 常见错误类型

1. **认证错误** (401)
   ```json
   {
     "detail": "Authentication required"
   }
   ```

2. **权限错误** (403)
   ```json
   {
     "detail": "权限不足"
   }
   ```

3. **资源不存在** (404)
   ```json
   {
     "detail": "图谱不存在"
   }
   ```

4. **参数验证错误** (422)
   ```json
   {
     "detail": [
       {
         "loc": ["body", "field_name"],
         "msg": "field required",
         "type": "value_error.missing"
       }
     ]
   }
   ```

## 🛠️ 开发工具

- **交互式文档**: `http://localhost:8000/docs` (Swagger UI)
- **API文档**: `http://localhost:8000/redoc` (ReDoc)
- **健康检查**: `http://localhost:8000/health`

## 📞 技术支持

如有问题或建议，请联系开发团队或在项目仓库提交Issue。

---

*最后更新时间: 2025年7月17日*