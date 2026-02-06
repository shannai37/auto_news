# 开发者资讯聚合平台

一个聚合程序员圈内最新资讯的平台，包括 AI 动态、GitHub 热点、技术文章等。

## 数据源

- **Hacker News**: 技术讨论和创业资讯
- **GitHub Trending**: 热门开源项目
- **Dev.to**: 开发者技术博客
- **Hugging Face**: AI 模型动态
- **V2EX**: 国内技术社区讨论
- **掘金**: 国内技术文章

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 测试数据源

```bash
npm test
```

这将测试所有6个数据源的可用性并显示示例数据。

### 3. 获取数据

```bash
npm run fetch
```

### 4. 启动本地预览

```bash
npm run dev
```

然后访问 http://localhost:3000

## 部署方案

### 方案1: 全静态部署（推荐，零成本）

- **数据抓取**: GitHub Actions 定时任务
- **数据存储**: JSON 文件存储在仓库
- **前端部署**: GitHub Pages 或 Vercel
- **优点**: 完全免费，无需服务器

### 方案2: Serverless 部署

- **数据抓取**: Vercel Cron
- **数据存储**: Vercel KV 或 Supabase
- **前端部署**: Vercel
- **优点**: 更灵活，支持实时更新

## 项目结构

```
A_news/
├── package.json          # 项目配置
├── test-sources.js       # 数据源测试脚本
├── fetch-data.js         # 数据抓取脚本（待创建）
├── server.js             # 本地开发服务器（待创建）
├── index.html            # 前端页面（待创建）
├── data/                 # 数据存储目录
│   └── latest.json       # 最新数据
└── .github/
    └── workflows/
        └── fetch.yml     # GitHub Actions 配置
```

## 下一步

1. 运行 `npm test` 查看数据源测试结果
2. 根据测试结果调整数据源配置
3. 创建前端展示页面
4. 配置自动化部署
