/**
 * AI Dev Daily - 数据抓取脚本
 * 面向年轻程序员的 AI×开发者情报台
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

// 配置
const CONFIG = {
  // AI 摘要配置（用户自行填写）
  AI_SUMMARY: {
    enabled: process.env.AI_SUMMARY_ENABLED === 'true',
    provider: process.env.AI_PROVIDER || 'openai', // openai / anthropic
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini'
  },
  // 数据目录
  dataDir: path.join(__dirname, 'data')
};

// 确保数据目录存在
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

// 工具函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const isEnglish = (text) => /^[\x00-\x7F]*$/.test(text.replace(/[\s\d\W]/g, '').slice(0, 50));

// AI 摘要生成（英文内容）
async function generateSummary(title, description, url) {
  if (!CONFIG.AI_SUMMARY.enabled || !CONFIG.AI_SUMMARY.apiKey) {
    return null;
  }

  // 只对英文内容生成摘要
  if (!isEnglish(title)) {
    return null;
  }

  try {
    const prompt = `Summarize this tech news in Chinese for developers:
Title: ${title}
Description: ${description || 'N/A'}

Output format (in Chinese):
- 一句话结论
- 适合谁看（如：AI工程师/前端开发/全栈等）`;

    if (CONFIG.AI_SUMMARY.provider === 'anthropic') {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: CONFIG.AI_SUMMARY.model || 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'x-api-key': CONFIG.AI_SUMMARY.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      return response.data.content[0].text;
    } else {
      // OpenAI
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: CONFIG.AI_SUMMARY.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      }, {
        headers: {
          'Authorization': `Bearer ${CONFIG.AI_SUMMARY.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      return response.data.choices[0].message.content;
    }
  } catch (error) {
    console.error('AI 摘要生成失败:', error.message);
    return null;
  }
}

// ============ 数据源 ============

// 1. GitHub Trending (按语言分类)
async function fetchGitHubTrending(language = '', since = 'daily') {
  const langParam = language ? `/${language}` : '';
  const url = `https://github.com/trending${langParam}?since=${since}`;
  console.log(`正在获取 GitHub Trending${language ? ` (${language})` : ''}...`);

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const repos = [];

    $('article.Box-row').each((i, elem) => {
      if (i >= 15) return false; // 限制数量

      const $elem = $(elem);
      const repoPath = $elem.find('h2 a').attr('href')?.trim();
      if (!repoPath) return;

      const fullName = repoPath.slice(1); // 去掉开头的 /
      const description = $elem.find('p.col-9').text().trim();
      const lang = $elem.find('[itemprop="programmingLanguage"]').text().trim();
      const starsText = $elem.find('.float-sm-right, .Link--muted.d-inline-block.mr-3').last().text().trim();
      const totalStars = $elem.find('a.Link--muted[href$="/stargazers"]').text().trim();

      repos.push({
        id: `gh-${fullName.replace('/', '-')}`,
        title: fullName,
        url: `https://github.com${repoPath}`,
        description: description || '',
        language: lang || language || 'Unknown',
        starsToday: starsText,
        totalStars: totalStars,
        time: Date.now(),
        source: 'GitHub',
        category: 'github'
      });
    });

    console.log(`✓ GitHub Trending${language ? ` (${language})` : ''}: ${repos.length} 条`);
    return repos;
  } catch (error) {
    console.error(`✗ GitHub Trending 失败:`, error.message);
    return [];
  }
}

// 2. Hacker News (AI/ML 相关)
async function fetchHackerNews() {
  console.log('正在获取 Hacker News...');
  try {
    const topRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', { timeout: 10000 });
    const ids = topRes.data.slice(0, 50);

    const stories = [];
    const aiKeywords = ['ai', 'gpt', 'llm', 'openai', 'anthropic', 'claude', 'gemini', 'mistral',
                        'machine learning', 'deep learning', 'neural', 'transformer', 'agent'];

    for (const id of ids) {
      try {
        const res = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { timeout: 5000 });
        const story = res.data;
        if (!story || !story.title) continue;

        const titleLower = story.title.toLowerCase();
        const isAI = aiKeywords.some(kw => titleLower.includes(kw));

        stories.push({
          id: `hn-${story.id}`,
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          score: story.score || 0,
          comments: story.descendants || 0,
          author: story.by,
          time: story.time * 1000,
          source: 'Hacker News',
          category: isAI ? 'ai-news' : 'tech',
          isAI: isAI
        });

        await delay(50);
      } catch (e) { /* skip */ }
    }

    console.log(`✓ Hacker News: ${stories.length} 条 (AI相关: ${stories.filter(s => s.isAI).length})`);
    return stories;
  } catch (error) {
    console.error('✗ Hacker News 失败:', error.message);
    return [];
  }
}

// 3. arXiv 论文 (AI/ML)
async function fetchArxivPapers() {
  console.log('正在获取 arXiv 论文...');
  try {
    // cs.AI + cs.CL + cs.LG
    const categories = ['cs.AI', 'cs.CL', 'cs.LG'];
    const papers = [];

    for (const cat of categories) {
      try {
        const feed = await parser.parseURL(`https://export.arxiv.org/rss/${cat}`);

        feed.items.slice(0, 10).forEach(item => {
          const id = item.link?.split('/abs/')[1] || item.guid;
          if (papers.find(p => p.id === `arxiv-${id}`)) return; // 去重

          papers.push({
            id: `arxiv-${id}`,
            title: item.title?.replace(/\n/g, ' ').trim() || '',
            url: item.link,
            description: item.contentSnippet?.slice(0, 300) || '',
            author: item.creator || item['dc:creator'] || '',
            time: new Date(item.pubDate || Date.now()).getTime(),
            source: 'arXiv',
            category: 'paper',
            arxivCategory: cat
          });
        });

        await delay(500);
      } catch (e) {
        console.error(`  arXiv ${cat} 失败:`, e.message);
      }
    }

    console.log(`✓ arXiv: ${papers.length} 条`);
    return papers;
  } catch (error) {
    console.error('✗ arXiv 失败:', error.message);
    return [];
  }
}

// 4. Dev.to (AI/开发实践)
async function fetchDevTo() {
  console.log('正在获取 Dev.to...');
  try {
    const tags = ['ai', 'machinelearning', 'llm', 'webdev', 'programming'];
    const articles = [];
    const seen = new Set();

    for (const tag of tags) {
      try {
        const res = await axios.get(`https://dev.to/api/articles?tag=${tag}&per_page=15&top=7`, { timeout: 10000 });

        res.data.forEach(article => {
          if (seen.has(article.id)) return;
          seen.add(article.id);

          articles.push({
            id: `devto-${article.id}`,
            title: article.title,
            url: article.url,
            description: article.description || '',
            author: article.user?.name || article.user?.username,
            tags: article.tag_list || [],
            reactions: article.public_reactions_count || 0,
            comments: article.comments_count || 0,
            time: new Date(article.published_at).getTime(),
            source: 'Dev.to',
            category: 'practice'
          });
        });

        await delay(300);
      } catch (e) { /* skip */ }
    }

    console.log(`✓ Dev.to: ${articles.length} 条`);
    return articles;
  } catch (error) {
    console.error('✗ Dev.to 失败:', error.message);
    return [];
  }
}

// 5. 机器之心 (国内 AI 动态)
async function fetchJiqizhixin() {
  console.log('正在获取 机器之心...');
  try {
    const feed = await parser.parseURL('https://www.jiqizhixin.com/rss');

    const articles = feed.items.slice(0, 15).map(item => ({
      id: `jqzx-${item.guid || item.link}`,
      title: item.title,
      url: item.link,
      description: item.contentSnippet?.slice(0, 200) || '',
      time: new Date(item.pubDate || Date.now()).getTime(),
      source: '机器之心',
      category: 'china-ai',
      isChina: true
    }));

    console.log(`✓ 机器之心: ${articles.length} 条`);
    return articles;
  } catch (error) {
    console.error('✗ 机器之心 失败:', error.message);
    return [];
  }
}

// 6. 36氪 AI 频道
async function fetch36Kr() {
  console.log('正在获取 36氪...');
  try {
    const feed = await parser.parseURL('https://36kr.com/feed');

    const aiKeywords = ['ai', '人工智能', '大模型', 'gpt', '智能', '机器人', 'llm', '算法'];
    const articles = feed.items
      .filter(item => {
        const text = (item.title + item.contentSnippet).toLowerCase();
        return aiKeywords.some(kw => text.includes(kw));
      })
      .slice(0, 10)
      .map(item => ({
        id: `36kr-${item.guid || item.link}`,
        title: item.title,
        url: item.link,
        description: item.contentSnippet?.slice(0, 200) || '',
        time: new Date(item.pubDate || Date.now()).getTime(),
        source: '36氪',
        category: 'china-ai',
        isChina: true
      }));

    console.log(`✓ 36氪: ${articles.length} 条`);
    return articles;
  } catch (error) {
    console.error('✗ 36氪 失败:', error.message);
    return [];
  }
}

// 7. InfoQ (技术实践)
async function fetchInfoQ() {
  console.log('正在获取 InfoQ...');
  try {
    const feed = await parser.parseURL('https://www.infoq.cn/feed');

    const articles = feed.items.slice(0, 10).map(item => ({
      id: `infoq-${item.guid || item.link}`,
      title: item.title,
      url: item.link,
      description: item.contentSnippet?.slice(0, 200) || '',
      time: new Date(item.pubDate || Date.now()).getTime(),
      source: 'InfoQ',
      category: 'practice',
      isChina: true
    }));

    console.log(`✓ InfoQ: ${articles.length} 条`);
    return articles;
  } catch (error) {
    console.error('✗ InfoQ 失败:', error.message);
    return [];
  }
}

// 8. Hugging Face 热门模型
async function fetchHuggingFace() {
  console.log('正在获取 Hugging Face...');
  try {
    const res = await axios.get('https://huggingface.co/api/models?sort=trending&limit=15', { timeout: 15000 });

    const models = res.data.map(model => ({
      id: `hf-${model.id.replace('/', '-')}`,
      title: model.id,
      url: `https://huggingface.co/${model.id}`,
      description: model.pipeline_tag || model.tags?.[0] || 'AI Model',
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      time: Date.now(),
      source: 'Hugging Face',
      category: 'ai-tool'
    }));

    console.log(`✓ Hugging Face: ${models.length} 条`);
    return models;
  } catch (error) {
    console.error('✗ Hugging Face 失败:', error.message);
    return [];
  }
}

// 9. Product Hunt (AI 产品)
async function fetchProductHunt() {
  console.log('正在获取 Product Hunt...');
  try {
    const feed = await parser.parseURL('https://www.producthunt.com/feed');

    const aiKeywords = ['ai', 'gpt', 'llm', 'machine learning', 'automation', 'chatbot', 'copilot'];
    const products = feed.items
      .filter(item => {
        const text = (item.title + (item.contentSnippet || '')).toLowerCase();
        return aiKeywords.some(kw => text.includes(kw));
      })
      .slice(0, 10)
      .map(item => ({
        id: `ph-${item.guid || item.link}`,
        title: item.title,
        url: item.link,
        description: item.contentSnippet?.slice(0, 200) || '',
        time: new Date(item.pubDate || Date.now()).getTime(),
        source: 'Product Hunt',
        category: 'ai-product'
      }));

    console.log(`✓ Product Hunt: ${products.length} 条`);
    return products;
  } catch (error) {
    console.error('✗ Product Hunt 失败:', error.message);
    return [];
  }
}

// ============ 主函数 ============

async function fetchAllData() {
  console.log('\n══════════════════════════════════════════');
  console.log('  AI Dev Daily - 数据抓取');
  console.log('══════════════════════════════════════════\n');

  const startTime = Date.now();

  // 并发抓取所有数据源
  const results = await Promise.allSettled([
    fetchGitHubTrending('', 'daily'),
    fetchGitHubTrending('python', 'daily'),
    fetchHackerNews(),
    fetchArxivPapers(),
    fetchDevTo(),
    fetchJiqizhixin(),
    fetch36Kr(),
    fetchInfoQ(),
    fetchHuggingFace(),
    fetchProductHunt()
  ]);

  // 合并结果
  const allData = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // 去重
  const seen = new Set();
  const uniqueData = allData.filter(item => {
    const key = item.url || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 分类整理
  const categorized = {
    // 今日必看 (AI 重要新闻，取分数最高的)
    todayMustRead: uniqueData
      .filter(d => d.category === 'ai-news' || (d.source === 'Hacker News' && d.isAI && d.score > 100))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5),

    // 新工具/开源
    tools: uniqueData
      .filter(d => d.category === 'github' || d.category === 'ai-tool')
      .sort((a, b) => b.time - a.time)
      .slice(0, 12),

    // 产品动态
    products: uniqueData
      .filter(d => d.category === 'ai-product' || d.source === 'Product Hunt')
      .slice(0, 8),

    // 工程实践
    practice: uniqueData
      .filter(d => d.category === 'practice')
      .sort((a, b) => (b.reactions || 0) - (a.reactions || 0))
      .slice(0, 8),

    // 国内动态
    china: uniqueData
      .filter(d => d.isChina || d.category === 'china-ai')
      .sort((a, b) => b.time - a.time)
      .slice(0, 8),

    // 论文速递
    papers: uniqueData
      .filter(d => d.category === 'paper')
      .slice(0, 10),

    // 其他技术新闻
    techNews: uniqueData
      .filter(d => d.source === 'Hacker News' && !d.isAI)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)
  };

  // 生成 AI 摘要（如果启用）
  if (CONFIG.AI_SUMMARY.enabled && CONFIG.AI_SUMMARY.apiKey) {
    console.log('\n正在生成 AI 摘要...');
    for (const item of [...categorized.todayMustRead, ...categorized.tools.slice(0, 5)]) {
      if (isEnglish(item.title)) {
        item.aiSummary = await generateSummary(item.title, item.description, item.url);
        await delay(500);
      }
    }
  }

  // 输出数据
  const outputData = {
    updateTime: Date.now(),
    updateTimeStr: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    totalCount: uniqueData.length,
    daily: {
      mustRead: categorized.todayMustRead,
      tools: categorized.tools,
      products: categorized.products,
      practice: categorized.practice,
      china: categorized.china,
      papers: categorized.papers
    },
    extra: {
      techNews: categorized.techNews
    },
    meta: {
      aiSummaryEnabled: CONFIG.AI_SUMMARY.enabled,
      sources: [...new Set(uniqueData.map(d => d.source))]
    }
  };

  // 保存
  const outputPath = path.join(CONFIG.dataDir, 'latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n══════════════════════════════════════════');
  console.log('  抓取完成');
  console.log('══════════════════════════════════════════');
  console.log(`  总计: ${uniqueData.length} 条`);
  console.log(`  耗时: ${duration} 秒`);
  console.log(`  保存: ${outputPath}`);
  console.log('\n  栏目统计:');
  console.log(`    今日必看: ${categorized.todayMustRead.length}`);
  console.log(`    新工具/开源: ${categorized.tools.length}`);
  console.log(`    产品动态: ${categorized.products.length}`);
  console.log(`    工程实践: ${categorized.practice.length}`);
  console.log(`    国内动态: ${categorized.china.length}`);
  console.log(`    论文速递: ${categorized.papers.length}`);
  console.log('══════════════════════════════════════════\n');
}

// 运行
fetchAllData().catch(console.error);
