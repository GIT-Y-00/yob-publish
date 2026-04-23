/**
 * Excalidraw Link Fixer v0.3
 * * 尝试过但失败的方案 (v0.1 & v0.2): 
 * 期望匹配 "\"link\":\"[[...]]\""，但实际网页 DOM 中 JS 对象的键名没有引号 (link:"...")。
 * 同时，Markdown 引擎发生了越界解析，把双括号变成了 "[...]]" 甚至 "[[...](/img/...md)" 这种畸形结构。
 * 导致严格正则完全落空。
 */

// [v0.3 Log] 1. 文件加载探测：如果这句没在 Cloudflare 日志出现，说明当前文件根本没参与构建。
console.error("=========================================");
console.error("[v0.3 Log] userSetup.js is successfully loaded!");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  // [v0.3 Log] 2. 钩子注册探测
  console.error("[v0.3 Log] userEleventySetup executed, registering Transform hook...");

  eleventyConfig.addTransform("fix-excalidraw-links-v0.3", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let matchCount = 0;

      // v0.3 究极宽泛正则：
      // \b 确保是独立的单词 link
      // \s*:\s* 匹配冒号及周围空格
      // (["']) 捕获单/双引号
      // (.*?) 捕获里面的任意畸形内容
      const regex = /\blink\s*:\s*(["'])(.*?)\1/g;

      const newContent = content.replace(regex, function(match, quote, innerLink) {
        // 过滤条件：如果这个 link 里面没有中括号，也没有 .md（说明是正常的普通链接），则不予干涉
        if (!innerLink.includes('[') && !innerLink.includes(']') && !innerLink.includes('.md')) {
          return match;
        }

        matchCount++;
        let filename = "";

        // 清洗策略 A: 应对被解析成 Markdown 相对路径的极端情况 (如: [[法术瞎...](/img/user/Vault/1234testlink1234.md))
        // 尝试提取最后一层斜杠和 .md 之间的文件名
        const mdLinkMatch = innerLink.match(/\/([^/]+)\.md\)?$/);
        if (mdLinkMatch) {
            filename = mdLinkMatch[1];
        } else {
            // 清洗策略 B: 应对括号缺失的情况 (如: [1234testlink1234]])
            // 粗暴但有效地剔除所有中括号，并按 | 分割去除 Obsidian 别名
            filename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        }

        // 拼接正确的绝对路径（根据你提供的正确路径格式）
        const fixedUrl = `/Vault/${filename}/`;
        
        // [v0.3 Log] 3. 替换动作探测
        console.error(`[v0.3 Log] SUCCESS in ${outputPath}`);
        console.error(`          Original: ${innerLink}`);
        console.error(`          Fixed   : ${fixedUrl}`);
        
        // 重组 JS 对象属性
        return `link:${quote}${fixedUrl}${quote}`;
      });

      if (matchCount > 0) {
         console.error(`[v0.3 Log] Completed ${matchCount} replacements in file.`);
      }

      return newContent;
    }
    return content;
  });
}

// 保留文档中提到的两个命名，防止 Digital Garden 版本差异导致的无法调用
function useMarkdownSetup(md) {}
function userMarkdownSetup(md) {}

exports.userEleventySetup = userEleventySetup;
exports.useMarkdownSetup = useMarkdownSetup;
exports.userMarkdownSetup = userMarkdownSetup;