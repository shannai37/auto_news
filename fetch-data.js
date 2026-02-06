/**
 * 数据抓取脚本
 * 从多个数据源获取最新资讯并保存为JSON
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();

// 创建数据目录
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 工具函数：延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 1. 获取 Hacker News 数据
async function fetchHackerNews() {
  console.log('正在获取 Hacker News...');
  try {
    const topStoriesRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', {
      timeout: 10000
    });
    const topStoryIds = topStoriesRes.data.slice(0, 30); // 获取前30条

    const stories = [];
    for (const id of topStoryIds) {
      try {
        const storyRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          timeout: 5000
        });
        const story = storyRes.data;

        stories.push({
          id: story.id,
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          score: story.score || 0,
          comments: story.descendants || 0,
          author: story.by,
          time: story.time * 1000, // 转换为毫秒
          source: 'Hacker News',
          category: 'tech'
        });

        await delay(100); // 避免请求过快
      } catch (err) {
        console.error(`获取故事 ${id} 失败:`, err.message);
      }
    }

    console.log(`✓ Hacker News: ${stories.length} 条`);
    return stories;
  } catch (error) {
    console.error('✗ Hacker News 失败:', error.message);
    return [];
  }
}

// 2. 获取 GitHub Trending 数据
async function fetchGitHubTrending() {
  console.log('正在获取 GitHub Trending...');
  try {
    const url = 'https://github.com/trending';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const repos = [];

    $('article.Box-row').each((i, elem) => {
      const $elem = $(elem);
      const repoPath = $elem.find('h2 a').attr('href');
      const fullName = repoPath?.replace('/', '');
      const description = $elem.find('p').text().trim();
      const language = $elem.find('[itemprop="programmingLanguage"]').text().trim();
      const starsToday = $elem.find('.float-sm-right').text().trim();

      if (fullName) {
        repos.push({
          id: `github-${fullName.replace('/', '-')}`,
          title: fullName,
          url: `https://github.com${repoPath}`,
          description: description || '无描述',
          language: language || 'Unknown',
          starsToday: starsToday,
          time: Date.now(),
          source: 'GitHub Trending',
          category: 'github'
        });
      }
    });

    console.log(`✓ GitHub Trending: ${repos.length} 条`);
    return repos;
  } catch (error) {
    console.error('✗ GitHub Trending 失败:', error.message);
    return [];
  }
}

// 3. 获取 Dev.to 数据
async function fetchDevTo() {
  console.log('正在获取 Dev.to...');
  try {
    const response = await axios.get('https://dev.to/api/articles?per_page=30&top=7', {
      timeout: 10000
    });
    const articles = response.data;

    const formatted = articles.map(article => ({
      id: `devto-${article.id}`,
      title: article.title,
      url: article.url,
      description: article.description || '',
      author: article.user.name,
      tags: article.tag_list,
      reactions: article.public_reactions_count,
      comments: article.comments_count,
      time: new Date(article.published_at).getTime(),
      source: 'Dev.to',
      category: 'article'
    }));

    console.log(`✓ Dev.to: ${formatted.length} 条`);
    return formatted;
  } catch (error) {
    console.error('✗ Dev.to 失败:', error.message);
    return [];
  }
}

// 4. 获取 Hugging Face 数据
async function fetchHuggingFace() {
  console.log('正在获取 Hugging Face...');
  try {
    const response = await axios.get('https://huggingface.co/api/models?sort=trending&limit=20', {
      timeout: 15000
    });
    const models = response.data;

    const formatted = models.map(model => ({
      id: `hf-${model.id.replace('/', '-')}`,
      title: model.id,
      url: `https://huggingface.co/${model.id}`,
      description: model.pipeline_tag || 'AI Model',
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      time: Date.now(),
      source: 'Hugging Face',
      category: 'ai'
    }));

    console.log(`✓ Hugging Face: ${formatted.length} 条`);
    return formatted;
  } catch (error) {
    console.error('✗ Hugging Face 失败:', error.message);
    return [];
  }
}

// 5. 获取 V2EX 数据
async function fetchV2EX() {
  console.log('正在获取 V2EX...');
  try {
    const response = await axios.get('https://www.v2ex.com/api/topics/hot.json', {
      timeout: 10000
    });
    const topics = response.data;

    const formatted = topics.map(topic => ({
      id: `v2ex-${topic.id}`,
      title: topic.title,
      url: `https://www.v2ex.com/t/${topic.id}`,
      description: topic.content || '',
      author: topic.member.username,
      node: topic.node.title,
      replies: topic.replies,
      time: topic.created * 1000,
      source: 'V2EX',
      category: 'community'
    }));

    console.log(`✓ V2EX: ${formatted.length} 条`);
    return formatted;
  } catch (error) {
    console.error('✗ V2EX 失败:', error.message);
    return [];
  }
}

// 6. 获取掘金数据（备用方案）
async function fetchJuejin() {
  console.log('正在获取掘金...');
  try {
    // 掘金API需要特殊处理，这里暂时跳过
    console.log('⚠ 掘金暂时跳过（需要特殊处理）');
    return [];
  } catch (error) {
    console.error('✗ 掘金失败:', error.message);
    return [];
  }
}

// 主函数
async function fetchAllData() {
  console.log('\n========================================');
  console.log('开始抓取数据...');
  console.log('========================================\n');

  const startTime = Date.now();

  // 并发获取所有数据源（有超时保护）
  const results = await Promise.allSettled([
    fetchHackerNews(),
    fetchGitHubTrending(),
    fetchDevTo(),
    fetchHuggingFace(),
    fetchV2EX(),
    fetchJuejin()
  ]);

  // 合并所有成功的结果
  const allData = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  // 按时间排序
  allData.sort((a, b) => b.time - a.time);

  // 保存数据
  const outputData = {
    updateTime: Date.now(),
    updateTimeStr: new Date().toLocaleString('zh-CN'),
    totalCount: allData.length,
    sources: {
      'Hacker News': allData.filter(d => d.source === 'Hacker News').length,
      'GitHub Trending': allData.filter(d => d.source === 'GitHub Trending').length,
      'Dev.to': allData.filter(d => d.source === 'Dev.to').length,
      'Hugging Face': allData.filter(d => d.source === 'Hugging Face').length,
      'V2EX': allData.filter(d => d.source === 'V2EX').length,
      '掘金': allData.filter(d => d.source === '掘金').length
    },
    data: allData
  };

  const outputPath = path.join(dataDir, 'latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n========================================');
  console.log('抓取完成！');
  console.log('========================================');
  console.log(`总计: ${allData.length} 条数据`);
  console.log(`耗时: ${duration} 秒`);
  console.log(`保存位置: ${outputPath}`);
  console.log('\n各数据源统计:');
  Object.entries(outputData.sources).forEach(([source, count]) => {
    if (count > 0) {
      console.log(`  ✓ ${source}: ${count} 条`);
    }
  });
  console.log('========================================\n');
}

// 运行
fetchAllData().catch(console.error);
