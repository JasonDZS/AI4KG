# AI4KG 前端项目

这是AI4KG知识图谱可视化平台的前端应用，基于React + TypeScript + Vite构建。

## 技术栈

- **React 18** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 现代化构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **React Router** - 客户端路由
- **TanStack Query** - 数据获取和状态管理
- **Sigma.js** - 图可视化库
- **Graphology** - 图数据结构和算法
- **Axios** - HTTP客户端
- **Lucide React** - 图标库

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础UI组件
│   ├── Auth/           # 认证相关组件
│   ├── Layout/         # 布局组件
│   └── Graph/          # 图谱相关组件
├── contexts/           # React上下文
├── hooks/              # 自定义Hooks
├── pages/              # 页面组件
├── services/           # API服务
├── types/              # TypeScript类型定义
├── lib/                # 工具函数
└── App.tsx             # 主应用组件
```

## 核心功能

### 1. 认证系统
- 用户登录/注册
- JWT令牌管理
- 路由保护

### 2. 图谱管理
- 图谱列表展示
- 创建新图谱
- 删除图谱
- 图谱详情查看

### 3. 图谱可视化
- 节点和边的渲染
- 多种布局算法（力导向、圆形、随机）
- 缩放和平移
- 节点/边选择和高亮

### 4. 交互功能
- 点击节点/边查看属性
- 右键菜单操作
- 工具栏操作
- 属性面板

### 5. 数据管理
- 节点属性编辑
- 边属性编辑
- 创建和删除操作（预留接口）

## 开发环境设置

### 1. 安装依赖
```bash
cd ai4kg/frontend
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
```

### 4. 代码检查
```bash
npm run lint
npm run type-check
```

## API集成

前端通过`/api`代理与后端服务通信。主要的API端点包括：

- `/api/auth/*` - 认证相关
- `/api/graphs/*` - 图谱管理
- `/api/graphs/{id}/nodes/*` - 节点管理（待实现）
- `/api/graphs/{id}/edges/*` - 边管理（待实现）

## 组件说明

### GraphCanvas
核心的图谱可视化组件，基于Sigma.js实现：
- 支持节点和边的渲染
- 提供交互事件处理
- 支持多种布局算法
- 提供缩放和视图控制

### Layout系统
- `Layout` - 主布局容器
- `Header` - 顶部导航栏
- `Sidebar` - 侧边栏导航

### 图谱组件
- `GraphCanvas` - 图谱画布
- `NodePropertiesPanel` - 节点属性面板
- `EdgePropertiesPanel` - 边属性面板
- `GraphToolbar` - 图谱工具栏
- `ContextMenu` - 右键菜单

## 样式系统

使用Tailwind CSS进行样式管理，配置了自定义颜色主题和设计令牌。支持亮色和暗色主题切换。

## 状态管理

- **认证状态** - 通过React Context管理
- **服务器状态** - 通过TanStack Query管理
- **组件状态** - 通过useState管理

## 性能优化

- 代码分割和懒加载
- 图像和资源优化
- React组件优化
- API请求缓存

## 开发注意事项

1. **类型安全** - 严格使用TypeScript类型
2. **组件复用** - 提取可复用的UI组件
3. **错误处理** - 完善的错误边界和用户提示
4. **性能监控** - 避免不必要的重渲染
5. **代码规范** - 遵循ESLint和Prettier配置

## 待实现功能

- [ ] 节点和边的创建/编辑对话框
- [ ] 搜索和筛选功能
- [ ] 图谱导入/导出
- [ ] 批量操作
- [ ] 实时协作
- [ ] 高级分析功能
- [ ] 性能虚拟化

## 部署

项目可以部署到任何静态文件服务器。构建后的文件在`dist`目录中。

推荐部署平台：
- Vercel
- Netlify
- GitHub Pages
- 自建Nginx服务器