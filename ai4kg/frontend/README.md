# AI4KG 前端框架设计

基于 sigma.js 的知识图谱可视化前端框架

## 概述

AI4KG 前端是一个基于 sigma.js 构建的现代化知识图谱可视化应用，提供直观的图形界面来展示、编辑和管理知识图谱数据。该框架旨在为用户提供高性能、可交互的图形可视化体验。

## 技术栈

### 核心依赖
- **sigma.js** - 高性能的图形可视化库
- **React** - 用户界面组件框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 快速的前端构建工具

### 图形处理
- **graphology** - 图数据结构库，与 sigma.js 完美集成
- **d3** - 数据驱动的辅助工具

### UI 组件
- **Ant Design** - 企业级 UI 设计语言
- **React Router** - 路由管理
- **Zustand** - 轻量级状态管理

## 架构设计

### 整体架构

```
Frontend Architecture
├── Components/               # 可复用组件
│   ├── Graph/               # 图形相关组件
│   │   ├── GraphViewer.tsx  # 主图形显示组件
│   │   ├── NodePanel.tsx    # 节点属性面板
│   │   ├── EdgePanel.tsx    # 边属性面板
│   │   └── Controls.tsx     # 图形控制工具
│   ├── Layout/              # 布局组件
│   │   ├── Header.tsx       # 头部导航
│   │   ├── Sidebar.tsx      # 侧边栏
│   │   └── Footer.tsx       # 底部信息
│   └── Common/              # 通用组件
│       ├── Loading.tsx      # 加载动画
│       └── Modal.tsx        # 模态框
├── Services/                # 业务逻辑层
│   ├── graphService.ts      # 图数据处理服务
│   ├── apiService.ts        # API 通信服务
│   └── layoutService.ts     # 布局算法服务
├── Store/                   # 状态管理
│   ├── graphStore.ts        # 图数据状态
│   ├── uiStore.ts          # UI 状态
│   └── userStore.ts        # 用户状态
├── Utils/                   # 工具函数
│   ├── graphUtils.ts        # 图处理工具
│   ├── formatUtils.ts       # 数据格式化
│   └── constants.ts         # 常量定义
└── Types/                   # TypeScript 类型定义
    ├── graph.ts             # 图数据类型
    ├── api.ts              # API 接口类型
    └── ui.ts               # UI 相关类型
```

### 核心模块

#### 1. 图形可视化模块 (Graph Visualization)

**主要组件：GraphViewer**
- 基于 sigma.js 的图形渲染
- 支持节点和边的实时交互
- 提供缩放、平移、选择等基础操作

**特性：**
- 高性能渲染（支持大规模图数据）
- 自定义节点和边样式
- 多种布局算法（力导向、层次、圆形等）
- 搜索和筛选功能

#### 2. 数据管理模块 (Data Management)

**职责：**
- 图数据的获取、缓存和更新
- 与后端 API 的通信
- 数据格式转换和验证

**核心服务：**
- `graphService.ts` - 图数据 CRUD 操作
- `apiService.ts` - HTTP 请求封装
- 数据同步和冲突解决

#### 3. 交互控制模块 (Interaction Control)

**功能：**
- 节点/边的选择和高亮
- 右键菜单和工具栏
- 拖拽编辑功能
- 键盘快捷键支持

#### 4. 布局引擎模块 (Layout Engine)

**支持的布局算法：**
- Force-directed (力导向布局)
- Hierarchical (层次布局)
- Circular (圆形布局)
- Random (随机布局)
- Custom (自定义布局)

## 数据结构

### 图数据模型

```typescript
interface Node {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  position?: { x: number; y: number };
  size?: number;
  color?: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: string;
  properties: Record<string, any>;
  weight?: number;
  color?: string;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

### 状态管理

使用 Zustand 进行状态管理，主要状态包括：

```typescript
interface GraphStore {
  // 图数据
  graph: Graph | null;
  selectedNodes: string[];
  selectedEdges: string[];
  
  // 视图状态
  camera: { x: number; y: number; ratio: number };
  layout: string;
  filters: FilterConfig;
  
  // 操作方法
  loadGraph: (graphId: string) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  setLayout: (layout: string) => void;
}
```

## 用户界面设计

### 主界面布局

1. **顶部导航栏**
   - Logo 和项目标题
   - 主要功能菜单（文件、编辑、视图、工具）
   - 用户账户信息

2. **左侧工具面板**
   - 图形控制工具
   - 布局选择器
   - 筛选和搜索
   - 图层管理

3. **中央画布区域**
   - sigma.js 图形渲染区域
   - 缩放和平移控件
   - 小地图导航

4. **右侧属性面板**
   - 选中节点/边的详细信息
   - 属性编辑器
   - 相关操作按钮

5. **底部状态栏**
   - 当前图信息
   - 操作提示
   - 性能监控

### 交互设计

#### 节点操作
- **点击选择** - 显示节点详情
- **双击编辑** - 直接编辑节点标签
- **拖拽移动** - 调整节点位置
- **右键菜单** - 显示上下文操作

#### 边操作
- **点击选择** - 显示边详情
- **悬停高亮** - 突出显示连接关系
- **右键菜单** - 编辑或删除边

#### 画布操作
- **滚轮缩放** - 放大/缩小视图
- **拖拽平移** - 移动视图位置
- **框选** - 批量选择节点
- **空白区域点击** - 取消选择

## 性能优化

### 渲染优化
- 使用 WebGL 渲染引擎
- 视口裁剪（只渲染可见区域）
- 节点/边的 LOD（细节层次）控制
- 图像纹理缓存

### 数据优化
- 虚拟化大型图数据
- 增量数据更新
- 客户端缓存策略
- 懒加载节点详情

### 内存管理
- 及时清理未使用的图形对象
- 合理的数据结构设计
- 避免内存泄漏

## API 集成

### 后端接口
- `GET /api/graphs` - 获取图列表
- `GET /api/graphs/:id` - 获取特定图数据
- `POST /api/graphs` - 创建新图
- `PUT /api/graphs/:id` - 更新图数据
- `DELETE /api/graphs/:id` - 删除图

### 实时更新
- WebSocket 连接用于实时协作
- 冲突检测和解决机制
- 操作历史记录

## 开发指南

### 环境配置

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 规则
- 组件使用函数式写法
- 适当的注释和文档

### 测试策略
- 单元测试（Jest + React Testing Library）
- 组件测试
- 端到端测试（Playwright）
- 性能测试

## 部署和维护

### 构建流程
- Vite 打包优化
- 代码分割和懒加载
- 资源压缩和缓存
- CDN 部署

### 监控和日志
- 性能监控
- 错误追踪
- 用户行为分析

## 扩展性设计

### 插件系统
- 自定义节点渲染器
- 布局算法插件
- 数据导入/导出插件
- 主题和样式扩展

### 国际化
- 多语言支持
- 本地化配置
- RTL 语言支持

## 未来规划

- 支持 3D 图形可视化
- AI 辅助的图分析功能
- 更多的图算法集成
- 移动端适配
- 协作编辑功能增强

---

*该设计文档将随着项目的发展持续更新和完善。*