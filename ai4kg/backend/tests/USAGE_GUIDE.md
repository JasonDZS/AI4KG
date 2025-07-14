# AI4KG 后端测试套件使用指南

## 概述

已成功为 AI4KG 后端项目构建了完整的 pytest 测试套件，包含以下测试文件：

### 测试文件结构
```
tests/
├── conftest.py                          # pytest 配置和共享固件
├── test_main.py                         # 主应用测试 (✅ 已验证)
├── test_auth.py                         # 认证功能测试
├── test_graphs.py                       # 图谱管理测试  
├── test_nodes.py                        # 节点管理测试
├── test_edges.py                        # 边管理测试
├── test_analysis_files_search.py        # 分析、文件、搜索功能测试
├── test_integration.py                  # 集成测试
├── test_setup.py                        # 环境检查脚本 (原有)
├── README.md                            # 详细测试文档
├── pytest.ini                          # pytest 配置
└── run_tests.py                         # 测试运行脚本
```

## 快速开始

### 1. 环境验证
```bash
# 检查测试环境
python run_tests.py --setup-only
```

### 2. 运行测试

```bash
# 运行所有测试
python run_tests.py

# 运行特定类型测试
python run_tests.py --type auth        # 认证测试
python run_tests.py --type graphs      # 图谱管理测试
python run_tests.py --type nodes       # 节点管理测试
python run_tests.py --type edges       # 边管理测试
python run_tests.py --type integration # 集成测试

# 详细输出
python run_tests.py --verbose

# 生成覆盖率报告
python run_tests.py --coverage
```

### 3. 使用 pytest 直接运行

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest tests/test_main.py

# 运行特定测试
pytest tests/test_main.py::TestMainApp::test_root_endpoint

# 使用标记过滤
pytest -m auth
pytest -m "not integration"

# 详细输出
pytest -v
```

## 测试覆盖的 API 接口

基于 `main.py` 中的路由配置，测试覆盖了以下接口：

### 主应用路由
- `GET /` - 根路径
- `GET /health` - 健康检查
- `GET /docs` - API 文档
- `GET /redoc` - ReDoc 文档

### 认证路由 (`/api/auth`)
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 图谱管理路由 (`/api/graphs`)
- `GET /api/graphs` - 获取图谱列表
- `POST /api/graphs` - 创建图谱
- `GET /api/graphs/{graph_id}` - 获取单个图谱
- `PUT /api/graphs/{graph_id}` - 更新图谱
- `DELETE /api/graphs/{graph_id}` - 删除图谱

### 节点管理路由 (`/api/graphs/{graph_id}/nodes`)
- `GET /api/graphs/{graph_id}/nodes` - 获取节点
- `POST /api/graphs/{graph_id}/nodes` - 创建节点
- `PUT /api/graphs/{graph_id}/nodes/{node_id}` - 更新节点
- `DELETE /api/graphs/{graph_id}/nodes/{node_id}` - 删除节点

### 边管理路由 (`/api/graphs/{graph_id}/edges`)
- `GET /api/graphs/{graph_id}/edges` - 获取边
- `POST /api/graphs/{graph_id}/edges` - 创建边
- `PUT /api/graphs/{graph_id}/edges/{edge_id}` - 更新边
- `DELETE /api/graphs/{graph_id}/edges/{edge_id}` - 删除边

### 分析路由 (`/api/graphs/{graph_id}/analysis`)
- 图谱统计分析
- 节点中心性分析
- 社区检测
- 最短路径分析

### 文件处理路由 (`/api/graphs/{graph_id}/files`)
- 文件上传和导入
- 图谱数据导出

### 搜索路由 (`/api/search`)
- 全局搜索功能

## 测试特性

### 1. 完整的功能覆盖
- ✅ 成功场景测试
- ✅ 错误场景测试
- ✅ 边界情况测试
- ✅ 权限验证测试
- ✅ 数据验证测试

### 2. 测试分类标记
```python
@pytest.mark.auth           # 认证测试
@pytest.mark.graphs         # 图谱管理测试
@pytest.mark.nodes          # 节点管理测试
@pytest.mark.edges          # 边管理测试
@pytest.mark.analysis       # 分析功能测试
@pytest.mark.files          # 文件处理测试
@pytest.mark.search         # 搜索功能测试
@pytest.mark.integration    # 集成测试
```

### 3. 共享固件
- `client` - FastAPI 测试客户端
- `authenticated_user` - 已认证用户
- `sample_graph` - 示例图谱
- `sample_user_data` - 示例用户数据
- `sample_node_data` - 示例节点数据
- `sample_edge_data` - 示例边数据

### 4. 数据库隔离
- 每个测试使用独立的数据库会话
- 测试后自动清理数据
- 避免测试间相互影响

## 验证状态

✅ **环境设置** - 测试环境检查通过
✅ **依赖安装** - 所有必要依赖已安装
✅ **基础测试** - 主应用测试通过
✅ **测试框架** - pytest 框架配置正确

## 下一步

1. **运行完整测试套件**：
   ```bash
   python run_tests.py --verbose
   ```

2. **根据实际API实现调整测试**：
   - 某些功能可能还未完全实现
   - 根据实际返回结果调整断言
   - 补充缺失的测试场景

3. **集成到CI/CD**：
   - 配置GitHub Actions或其他CI工具
   - 自动运行测试和生成报告

4. **持续维护**：
   - 随着功能开发更新测试
   - 保持测试覆盖率
   - 定期review和优化测试

## 注意事项

- 测试使用SQLite内存数据库，适合开发和CI环境
- 部分高级功能测试可能需要根据实际实现进行调整
- 建议在开发新功能时同步编写对应测试
- 定期运行完整测试套件确保代码质量

测试套件已准备就绪，可以开始使用！ 🚀
