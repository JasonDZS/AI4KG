# 🔐 认证模块 API

用户认证和授权相关的API端点。

## 端点概览

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |
| GET | `/api/auth/verify` | 验证令牌 | ✅ |

---

## 📝 用户注册

注册新用户账户。

**端点**: `POST /api/auth/register`

### 请求参数

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| username | string | ✅ | 用户名，唯一标识 |
| email | string | ✅ | 邮箱地址，唯一标识 |
| password | string | ✅ | 密码，至少6位字符 |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "created_at": "2025-07-17T10:00:00Z",
      "updated_at": "2025-07-17T10:00:00Z"
    },
    "token": "jwt-token-string"
  }
}
```

### 错误响应

**409 - 用户已存在**
```json
{
  "detail": "用户名已存在"
}
```

**422 - 参数验证错误**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 示例

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🔑 用户登录

使用用户名/邮箱和密码登录系统。

**端点**: `POST /api/auth/login`

### 请求参数

```json
{
  "username": "string",
  "password": "string"
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| username | string | ✅ | 用户名或邮箱地址 |
| password | string | ✅ | 密码 |

### 成功响应 (200)

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "created_at": "2025-07-17T10:00:00Z",
      "updated_at": "2025-07-17T10:00:00Z"
    },
    "token": "jwt-token-string"
  }
}
```

### 错误响应

**401 - 认证失败**
```json
{
  "detail": "用户名或密码错误"
}
```

### 示例

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

---

## ✅ 验证令牌

验证JWT令牌的有效性并返回用户信息。

**端点**: `GET /api/auth/verify`

### 请求头

```
Authorization: Bearer <jwt-token>
```

### 成功响应 (200)

```json
{
  "success": true,
  "message": "令牌验证成功",
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "2025-07-17T10:00:00Z",
    "updated_at": "2025-07-17T10:00:00Z"
  }
}
```

### 错误响应

**401 - 令牌无效**
```json
{
  "detail": "Invalid token"
}
```

**401 - 缺少认证信息**
```json
{
  "detail": "Authentication required"
}
```

### 示例

```bash
curl -X GET "http://localhost:8000/api/auth/verify" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 🔒 安全说明

### JWT Token 结构

JWT token包含以下信息：
- `sub`: 用户ID
- `username`: 用户名
- `exp`: 过期时间
- `iat`: 签发时间

### Token 使用注意事项

1. **存储安全**: 将token存储在安全的地方（如httpOnly cookie）
2. **传输安全**: 仅在HTTPS连接中传输token
3. **过期处理**: token过期后需要重新登录获取新token
4. **作用域限制**: token仅对当前用户的资源有效

### 密码要求

- 最少6个字符
- 建议包含大小写字母、数字和特殊字符
- 避免使用常见密码

---

*返回 [API文档首页](./API.md)*
