/**
 * 数据源测试脚本
 * 测试6个核心数据源的可用性和数据质量
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// 1. Hacker News
async function testHackerNews() {
  log(colors.cyan, '\n========== 测试 Hacker News ==========');
  try {
    // 获取热门故事ID列表
    const topStoriesRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topStoryIds = topStoriesRes.data.slice(0, 5); // 只取前5条

    log(colors.green, `✓ 成功获取 ${topStoryIds.length} 条热门故事ID`);

    // 获取具体故事详情
    const stories = [];
    for (const id of topStoryIds) {
      const storyRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      stories.push(storyRes.data);
    }

    log(colors.green, '\n前3条数据示例：');
    stories.slice(0, 3).forEach((story, index) => {
      console.log(`\n${index + 1}. ${story.title}`);
      console.log(`   链接: ${story.url || 'https://news.ycombinator.com/item?id=' + story.id}`);
      console.log(`   评分: ${story.score} | 评论: ${story.descendants || 0}`);
    });

    return { success: true, count: stories.length, data: stories };
  } catch (error) {
    log(colors.red, `✗ 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 2. GitHub Trending
async function testGitHubTrending() {
  log(colors.cyan, '\n========== 测试 GitHub Trending ==========');
  try {
    const url = 'https://github.com/trending';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const repos = [];

    $('article.Box-row').each((i, elem) => {
      if (i >= 5) return; // 只取前5个

      const $elem = $(elem);
      const fullName = $elem.find('h2 a').attr('href')?.replace('/', '');
      const description = $elem.find('p').text().trim();
      const stars = $elem.find('span.d-inline-block.float-sm-right').text().trim();

      repos.push({
        name: fullName,
        description: description || '无描述',
        stars: stars,
        url: `https://github.com${$elem.find('h2 a').attr('href')}`
      });
    });

    log(colors.green, `✓ 成功获取 ${repos.length} 个热门项目`);
    log(colors.green, '\n前3条数据示例：');
    repos.slice(0, 3).forEach((repo, index) => {
      console.log(`\n${index + 1}. ${repo.name}`);
      console.log(`   描述: ${repo.description.substring(0, 80)}...`);
      console.log(`   Stars: ${repo.stars}`);
      console.log(`   链接: ${repo.url}`);
    });

    return { success: true, count: repos.length, data: repos };
  } catch (error) {
    log(colors.red, `✗ 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 3. Dev.to
async function testDevTo() {
  log(colors.cyan, '\n========== 测试 Dev.to ==========');
  try {
    const response = await axios.get('https://dev.to/api/articles?per_page=5&top=7');
    const articles = response.data;

    log(colors.green, `✓ 成功获取 ${articles.length} 篇文章`);
    log(colors.green, '\n前3条数据示例：');
    articles.slice(0, 3).forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`);
      console.log(`   作者: ${article.user.name}`);
      console.log(`   标签: ${article.tag_list.join(', ')}`);
      console.log(`   反应: ❤️ ${article.public_reactions_count} | 💬 ${article.comments_count}`);
      console.log(`   链接: ${article.url}`);
    });

    return { success: true, count: articles.length, data: articles };
  } catch (error) {
    log(colors.red, `✗ 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 4. Hugging Face (最新模型)
async function testHuggingFace() {
  log(colors.cyan, '\n========== 测试 Hugging Face ==========');
  try {
    const response = await axios.get('https://huggingface.co/api/models?sort=trending&limit=5');
    const models = response.data;

    log(colors.green, `✓ 成功获取 ${models.length} 个热门模型`);
    log(colors.green, '\n前3条数据示例：');
    models.slice(0, 3).forEach((model, index) => {
      console.log(`\n${index + 1}. ${model.id}`);
      console.log(`   下载量: ${model.downloads || 0}`);
      console.log(`   点赞: ${model.likes || 0}`);
      console.log(`   链接: https://huggingface.co/${model.id}`);
    });

    return { success: true, count: models.length, data: models };
  } catch (error) {
    log(colors.red, `✗ 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 5. V2EX
async function testV2EX() {
  log(colors.cyan, '\n========== 测试 V2EX ==========');
  try {
    const response = await axios.get('https://www.v2ex.com/api/topics/hot.json');
    const topics = response.data.slice(0, 5);

    log(colors.green, `✓ 成功获取 ${topics.length} 个热门话题`);
    log(colors.green, '\n前3条数据示例：');
    topics.slice(0, 3).forEach((topic, index) => {
      console.log(`\n${index + 1}. ${topic.title}`);
      console.log(`   节点: ${topic.node.title}`);
      console.log(`   作者: ${topic.member.username}`);
      console.log(`   回复: ${topic.replies}`);
      console.log(`   链接: https://www.v2ex.com/t/${topic.id}`);
    });

    return { success: true, count: topics.length, data: topics };
  } catch (error) {
    log(colors.red, `✗ 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 6. 掘金 (通过RSS)
async function testJuejin() {
  log(colors.cyan, '\n========== 测试 掘金 ==========');
  try {
    const feed = await parser.parseURL('https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&count=5&from=1');

    // 掘金的RSS可能需要特殊处理，这里用备用方案
    log(colors.yellow, '⚠ 掘金RSS需要特殊处理，使用备用爬取方案...');

    const response = await axios.get('https://juejin.cn/frontend', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    log(colors.green, '✓ 成功访问掘金（需要进一步解析HTML）');
    log(colors.yellow, '提示: 掘金建议使用其他方式或RSS订阅');

    return { success: true, count: 0, note: '需要进一步开发' };
  } catch (error) {
    log(colors.red, `✗ 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function runTests() {
  log(colors.blue, '\n╔════════════════════════════════════════╗');
  log(colors.blue, '║   开发者资讯聚合 - 数据源测试工具      ║');
  log(colors.blue, '╚════════════════════════════════════════╝');

  const results = {
    'Hacker News': await testHackerNews(),
    'GitHub Trending': await testGitHubTrending(),
    'Dev.to': await testDevTo(),
    'Hugging Face': await testHuggingFace(),
    'V2EX': await testV2EX(),
    '掘金': await testJuejin()
  };

  // 汇总报告
  log(colors.blue, '\n\n╔════════════════════════════════════════╗');
  log(colors.blue, '║            测试结果汇总                ║');
  log(colors.blue, '╚════════════════════════════════════════╝\n');

  let successCount = 0;
  Object.entries(results).forEach(([name, result]) => {
    if (result.success) {
      log(colors.green, `✓ ${name.padEnd(20)} - 成功 (${result.count || 0} 条数据)`);
      successCount++;
    } else {
      log(colors.red, `✗ ${name.padEnd(20)} - 失败`);
    }
  });

  log(colors.blue, `\n总计: ${successCount}/${Object.keys(results).length} 个数据源可用`);

  if (successCount >= 4) {
    log(colors.green, '\n✓ 数据源测试通过！可以开始构建项目。');
  } else {
    log(colors.yellow, '\n⚠ 部分数据源不可用，但不影响项目启动。');
  }
}

// 运行测试
runTests().catch(console.error);
