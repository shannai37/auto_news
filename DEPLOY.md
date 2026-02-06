# 部署指南



### 🎯 推荐方案：GitHub Pages + GitHub Actions（完全免费）

这是最适合个人使用的方案，无需服务器，完全自动化。

## 详细部署步骤

### 1. 准备 Git 仓库

```bash
cd D:\A_news
git init
git add .
git commit -m "初始化项目"
```

### 2. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 创建一个新仓库（例如：`dev-news-aggregator`）
3. 不要初始化 README、.gitignore 或 license

### 3. 推送代码到 GitHub

```bash
git remote add origin https://github.com/你的用户名/dev-news-aggregator.git
git branch -M main
git push -u origin main
```

### 4. 启用 GitHub Pages

1. 进入仓库的 Settings
2. 找到 Pages 选项
3. Source 选择 `main` 分支
4. 目录选择 `/ (root)`
5. 点击 Save

几分钟后，你的网站就会发布到：
`https://你的用户名.github.io/dev-news-aggregator/`

### 5. 启用 GitHub Actions

GitHub Actions 会自动运行（已配置在 `.github/workflows/fetch.yml`）

- **自动运行**：每小时自动抓取一次数据
- **手动运行**：在 Actions 标签页可以手动触发

### 6. 首次手动抓取数据

在 GitHub 仓库页面：
1. 点击 Actions 标签
2. 选择 "自动抓取数据" workflow
3. 点击 "Run workflow"
4. 等待运行完成

---

## 方案对比

| 方案 | 成本 | 难度 | 自动化 | 推荐度 |
|------|------|------|--------|--------|
| **GitHub Pages + Actions** | 免费 | ⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| Vercel | 免费 | ⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| Netlify | 免费 | ⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| 云服务器 | 付费 | ⭐⭐⭐⭐ | 需配置 | ⭐⭐ |

---

## 本地开发

### 启动本地服务器

```bash
# 1. 抓取数据
npm run fetch

# 2. 启动服务器
npm run dev

# 3. 访问 http://localhost:3000
```

### 测试数据源

```bash
npm test
```

---

## 常见问题

### Q: 为什么有些数据源获取失败？

A: 可能的原因：
- 网络问题（部分国外网站访问慢）
- API 限流
- 网站结构变化

解决方案：
- GitHub Actions 在国外服务器运行，成功率更高
- 可以调整超时时间
- 失败的数据源不影响其他源

### Q: 如何修改抓取频率？

A: 编辑 `.github/workflows/fetch.yml` 中的 cron 表达式：

```yaml
# 每小时一次
- cron: '0 * * * *'

# 每2小时一次
- cron: '0 */2 * * *'

# 每天早上8点
- cron: '0 0 * * *'
```

### Q: 如何添加新的数据源？

A: 编辑 `fetch-data.js`，参考现有数据源的格式添加新函数。

### Q: 数据存储在哪里？

A: 数据存储在 `data/latest.json` 文件中，每次抓取会覆盖。

---

## 进阶优化

### 1. 添加自定义域名

在 GitHub Pages 设置中可以配置自定义域名。

### 2. 使用数据库

如果需要保存历史数据，可以：
- 使用 Supabase（免费 500MB）
- 使用 Vercel KV（免费 20MB）

### 3. 添加 AI 摘要

可以集成 OpenAI API 对文章进行智能摘要。

### 4. 添加 RSS 订阅

生成 RSS feed，方便用户订阅。

---

## 技术架构

```
┌─────────────────────────────────────────────┐
│           GitHub Actions (定时任务)          │
│                                             │
│  每小时运行 fetch-data.js                    │
│  ↓                                          │
│  抓取 6 个数据源                             │
│  ↓                                          │
│  生成 data/latest.json                      │
│  ↓                                          │
│  自动提交到 GitHub                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           GitHub Pages (静态托管)            │
│                                             │
│  index.html 读取 latest.json                │
│  ↓                                          │
│  渲染新闻列表                                │
│  ↓                                          │
│  用户访问网页                                │
└─────────────────────────────────────────────┘
```

---

## 下一步

1. ✅ 本地测试完成
2. ⬜ 推送到 GitHub
3. ⬜ 启用 GitHub Pages
4. ⬜ 运行第一次数据抓取
5. ⬜ 访问你的网站！

有问题随时查看 [README.md](README.md) 或提 Issue。
