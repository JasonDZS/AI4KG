# GitHub Pages 部署指南

本项目使用 GitHub Actions 自动部署文档到 GitHub Pages。

## 自动部署配置

### 触发条件
- 当推送代码到 `main` 分支时
- 当 `docs/` 目录下的文件发生变化时
- 支持手动触发部署

### 部署流程
1. 检出代码
2. 设置 GitHub Pages 环境
3. 上传 docs 目录作为构建产物
4. 部署到 GitHub Pages

## 手动启用 GitHub Pages

首次使用需要在 GitHub 仓库设置中启用 GitHub Pages：

1. 进入仓库的 **Settings** 页面
2. 在左侧菜单中找到 **Pages** 选项
3. 在 **Source** 部分选择 **GitHub Actions**
4. 保存设置

## 访问文档

部署成功后，文档将在以下地址可访问：
```
https://<username>.github.io/<repository-name>/
```

对于本项目：
```
https://JasonDZS.github.io/AI4KG/
```

## 本地预览

如果你想在本地预览文档，可以使用以下方法：

### 使用 Python 简单服务器
```bash
cd docs
python -m http.server 3000
```

### 使用 Node.js 服务器
```bash
cd docs
npx serve .
```

### 使用 Docsify CLI
```bash
npm i docsify-cli -g
cd docs
docsify serve .
```

然后在浏览器中访问 `http://localhost:3000`

## 文档结构

```
docs/
├── index.html          # 主页面
├── README.md          # 首页内容
├── .nojekyll          # 禁用 Jekyll 处理
├── favicon.svg        # 网站图标
├── AI4KG.svg         # 项目图标
└── zh-cn/            # 中文文档
    ├── README.md     # 中文首页
    ├── _sidebar.md   # 侧边栏配置
    └── api/          # API 文档
        ├── API.md
        ├── auth.md
        ├── graphs.md
        ├── nodes.md
        ├── edges.md
        ├── analysis.md
        ├── files.md
        └── search.md
```

## 注意事项

1. 确保 `docs/.nojekyll` 文件存在，以禁用 Jekyll 处理
2. 所有文档文件都应该放在 `docs/` 目录下
3. 修改 `docs/` 目录下的任何文件都会触发自动部署
4. 部署过程通常需要 1-3 分钟完成
