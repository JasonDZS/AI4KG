# AI4KG 后端测试文档

## 概述

本目录包含了 AI4KG 后端 API 的完整测试套件，使用 pytest 框架构建。测试覆盖了所有主要功能模块，包括认证、图谱管理、节点操作、边操作、分析功能等。

## 测试结构

```
tests/
├── conftest.py                          # pytest 配置和共享固件
├── test_main.py                         # 主应用测试
├── test_auth.py                         # 认证功能测试
├── test_graphs.py                       # 图谱管理测试
├── test_nodes.py                        # 节点管理测试
├── test_edges.py                        # 边管理测试
├── test_analysis_files_search.py        # 分析、文件、搜索功能测试
├── test_integration.py                  # 集成测试
└── test_setup.py                        # 环境检查脚本
```

## 测试分类

测试使用 pytest 标记进行分类：

- `@pytest.mark.auth` - 认证相关测试
- `@pytest.mark.graphs` - 图谱管理测试
- `@pytest.mark.nodes` - 节点管理测试
- `@pytest.mark.edges` - 边管理测试
- `@pytest.mark.analysis` - 图分析测试
- `@pytest.mark.files` - 文件处理测试
- `@pytest.mark.search` - 搜索查询测试
- `@pytest.mark.integration` - 集成测试

## 快速开始

### 1. 环境准备

确保已安装所有依赖：

```bash
# 使用 uv 安装依赖（推荐）
uv sync

# 或使用 pip
pip install -r requirements.txt
```

### 2. 检查测试环境

```bash
# 检查依赖和环境
python tests/test_setup.py

# 或使用测试脚本检查
python run_tests.py --setup-only
```

### 3. 运行测试

#### 运行所有测试
```bash
python run_tests.py
# 或
pytest tests/
```

#### 运行特定类型的测试
```bash
# 认证测试
python run_tests.py --type auth

# 图谱管理测试
python run_tests.py --type graphs

# 集成测试
python run_tests.py --type integration

# 单元测试（排除集成测试）
python run_tests.py --type unit
```

#### 详细输出
```bash
python run_tests.py --verbose
```

#### 生成覆盖率报告
```bash
python run_tests.py --coverage
```

## 测试命令参考

### 使用 pytest 直接运行

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest tests/test_auth.py

# 运行特定测试类
pytest tests/test_auth.py::TestUserRegistration

# 运行特定测试方法
pytest tests/test_auth.py::TestUserRegistration::test_register_success

# 使用标记过滤
pytest -m auth                    # 只运行认证测试
pytest -m "not integration"      # 排除集成测试
pytest -m "auth or graphs"       # 运行认证或图谱测试

# 详细输出
pytest -v

# 显示测试覆盖率
pytest --cov=app --cov-report=html

# 并行运行测试（需要安装 pytest-xdist）
pytest -n auto
```

### 使用测试脚本

```bash
# 基本用法
python run_tests.py [选项]

# 选项说明
--type, -t        测试类型 (all|unit|integration|auth|graphs|nodes|edges|analysis|files|search)
--verbose, -v     详细输出
--coverage, -c    生成覆盖率报告
--setup-only      仅检查环境设置
```

## 测试配置

### 环境变量

测试会自动设置以下环境变量：

- `TESTING=true` - 标识测试环境
- `DATABASE_URL=sqlite:///./test.db` - 测试数据库
- `SECRET_KEY=test-secret-key-for-jwt-signing` - JWT 密钥

### 数据库

测试使用独立的 SQLite 数据库，每个测试都有独立的数据库会话，测试之间相互隔离。

### 固件（Fixtures）

主要的共享固件：

- `client` - FastAPI 测试客户端
- `db_session` - 数据库会话
- `authenticated_user` - 已认证的用户
- `sample_graph` - 示例图谱
- `sample_user_data` - 示例用户数据
- `sample_node_data` - 示例节点数据
- `sample_edge_data` - 示例边数据

## 测试覆盖的功能

### 1. 主应用测试 (`test_main.py`)
- 根路径和健康检查
- API 文档端点
- CORS 配置
- 路由包含验证

### 2. 认证测试 (`test_auth.py`)
- 用户注册（成功、失败、验证）
- 用户登录（成功、失败、边界情况）
- Token 认证和验证
- 安全性测试（SQL注入、XSS防护）

### 3. 图谱管理测试 (`test_graphs.py`)
- 图谱列表获取（分页、搜索、过滤）
- 图谱创建（成功、验证、权限）
- 图谱获取（单个、批量、权限）
- 图谱更新（完整、部分、权限）
- 图谱删除（成功、权限、级联）

### 4. 节点管理测试 (`test_nodes.py`)
- 节点获取（列表、过滤、搜索）
- 节点创建（成功、验证、批量）
- 节点更新（完整、部分、权限）
- 节点删除（成功、级联、权限）
- 节点属性验证

### 5. 边管理测试 (`test_edges.py`)
- 边获取（列表、过滤、搜索）
- 边创建（成功、验证、关系）
- 边更新（完整、部分、权限）
- 边删除（成功、级联、权限）
- 边属性和关系验证

### 6. 分析功能测试 (`test_analysis_files_search.py`)
- 图谱统计分析
- 节点中心性分析
- 社区检测
- 路径分析
- 文件上传/导出
- 全局搜索

### 7. 集成测试 (`test_integration.py`)
- 完整工作流程测试
- 多用户协作测试
- 数据一致性测试
- 性能和并发测试
- 错误处理和恢复测试

## 测试最佳实践

### 1. 编写新测试

```python
import pytest
from fastapi.testclient import TestClient

@pytest.mark.your_category
class TestYourFeature:
    """您的功能测试"""
    
    def test_success_case(self, client: TestClient, authenticated_user):
        """测试成功情况"""
        response = client.get("/your-endpoint", headers=authenticated_user["headers"])
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
    
    def test_error_case(self, client: TestClient):
        """测试错误情况"""
        response = client.get("/your-endpoint")
        assert response.status_code == 401
```

### 2. 测试命名规范

- 测试文件：`test_*.py`
- 测试类：`Test*`
- 测试方法：`test_*`
- 描述性命名，说明测试的具体场景

### 3. 断言最佳实践

```python
# 好的断言
assert response.status_code == 200
assert data["success"] is True
assert "token" in data["data"]
assert len(results) > 0

# 避免的断言
assert response  # 不够具体
assert data      # 不说明期望什么
```

### 4. 测试数据管理

- 使用固件提供测试数据
- 每个测试使用独立的数据
- 清理测试数据，避免测试间干扰

## 持续集成

### GitHub Actions 配置示例

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install uv
          uv sync
      
      - name: Run tests
        run: python run_tests.py --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 故障排除

### 常见问题

1. **测试数据库连接失败**
   ```bash
   # 检查数据库配置
   python tests/test_setup.py
   ```

2. **依赖包缺失**
   ```bash
   # 重新安装依赖
   uv sync
   ```

3. **测试文件找不到**
   ```bash
   # 检查 PYTHONPATH
   export PYTHONPATH=$(pwd)
   pytest
   ```

4. **权限问题**
   ```bash
   # 检查文件权限
   chmod +x run_tests.py
   ```

### 调试技巧

```python
# 在测试中添加调试输出
def test_debug_example(self, client):
    response = client.get("/api/endpoint")
    print(f"Response: {response.json()}")  # 调试输出
    assert response.status_code == 200
```

```bash
# 运行单个测试进行调试
pytest tests/test_auth.py::TestUserRegistration::test_register_success -v -s
```

## 贡献指南

1. 为新功能编写对应的测试
2. 确保测试覆盖率保持在合理水平
3. 遵循现有的测试结构和命名规范
4. 运行完整测试套件确保没有回归
5. 更新测试文档

## 更多资源

- [pytest 官方文档](https://docs.pytest.org/)
- [FastAPI 测试文档](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy 测试最佳实践](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)
