# AI Dev Daily · 开发者情报台

面向年轻程序员的 AI×开发者情报聚合站，每天 10 分钟掌握 AI 开发动态。

## 特性

- **精选栏目**：今日必看 / 工具开源 / 工程实践 / 国内动态 / 论文速递 / 产品动态
- **多源聚合**：GitHub Trending、Hacker News、arXiv、Dev.to、Hugging Face、机器之心、36氪、InfoQ
- **AI 摘要**（可选）：英文内容自动生成中文摘要
- **自动更新**：GitHub Actions 每 6 小时自动抓取
- **零成本部署**：GitHub Pages 静态托管

## 快速开始

### 本地运行

```bash
# 安装依赖
npm install

# 抓取数据
npm run fetch

# 本地预览
npm run dev
# 或使用 http-server
npx http-server -p 8080
```

然后访问 http://localhost:3000 或 http://localhost:8080

### 部署到 GitHub Pages

1. Fork 本仓库
2. 进入仓库 Settings → Pages
3. Source 选择 "GitHub Actions"
4. 手动触发一次 Actions 或等待自动运行

## 配置 AI 摘要（可选）

如果你想启用英文内容的 AI 摘要功能：

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加以下 Secrets：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `AI_SUMMARY_ENABLED` | 是否启用 | `true` |
| `AI_PROVIDER` | 提供商 | `openai` 或 `anthropic` |
| `AI_API_KEY` | API 密钥 | `sk-xxx...` |
| `AI_MODEL` | 模型名称 | `gpt-4o-mini` 或 `claude-3-haiku-20240307` |

## 栏目说明

| 栏目 | 内容 | 数据源 |
|------|------|--------|
| 今日必看 | AI 领域重要新闻 | Hacker News (AI 相关高分) |
| 工具/开源 | 热门开源项目 | GitHub Trending, Hugging Face |
| 工程实践 | 开发实战文章 | Dev.to, InfoQ |
| 国内动态 | 国内 AI 资讯 | 机器之心, 36氪 |
| 论文速递 | AI/ML 最新论文 | arXiv (cs.AI, cs.CL, cs.LG) |
| 产品动态 | AI 新产品 | Product Hunt |

## 项目结构

```
A_news/
├── index.html            # 前端页面
├── fetch-data.js         # 数据抓取脚本
├── server.js             # 本地开发服务器
├── package.json          # 项目配置
├── data/
│   └── latest.json       # 抓取的数据
└── .github/
    └── workflows/
        └── fetch.yml     # GitHub Actions 自动化
```

## 自定义

### 修改抓取频率

编辑 `.github/workflows/fetch.yml` 中的 cron 表达式：

```yaml
schedule:
  - cron: '0 0,6,12,18 * * *'  # 每 6 小时
```

### 添加新数据源

在 `fetch-data.js` 中添加新的抓取函数，参考现有的 `fetchXxx()` 函数格式。

## 技术栈

- 前端：纯 HTML/CSS/JS（无框架依赖）
- 数据抓取：Node.js + axios + cheerio + rss-parser
- 部署：GitHub Pages + GitHub Actions

## License

MIT
