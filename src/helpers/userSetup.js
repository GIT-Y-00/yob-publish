/* 自定义：src/helpers/userSetup.js */

const fs = require('fs');
const path = require('path');

console.error("=========================================");
console.error("🚨 [CF DIAGNOSTIC PROBE] Cloudflare 探针已启动！准备生成在线文本快照...");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("debug-dump", function(content, outputPath) {
    
    if (outputPath && outputPath.endsWith(".html")) {
      
      // 我们只抓取包含了这几个关键字的案发现场页面
      if (content.includes("testnew") || content.includes("法术瞎") || content.includes("4321")) {
          
          // 【核心改造】outputPath 是 Eleventy 准备写入的最终路径 (比如 _site/4321/index.html)
          // 我们直接在它后面加上 .txt，变成 _site/4321/index.html.txt
          const dumpFilePath = outputPath + ".txt";
          
          try {
              // 确保文件夹存在 (Eleventy通常已经建好了，加上这句绝对安全)
              fs.mkdirSync(path.dirname(dumpFilePath), { recursive: true });
              
              // 强制将内存中的原始字符串无损写入 .txt 文件，随网站一起发布！
              fs.writeFileSync(dumpFilePath, content, "utf8");
              console.log(`\n📸 [探针快照成功] 已生成在线快照: ${dumpFilePath}`);
          } catch (err) {
              console.error("探针写入失败:", err);
          }
      }
      
      // 探针模式下，直接返回原始代码，不进行我们的任何正则清洗
      return content;
    }
    return content;
  });
}

function useMarkdownSetup(md) {}
function userMarkdownSetup(md) {}

exports.userEleventySetup = userEleventySetup;
exports.useMarkdownSetup = useMarkdownSetup;
exports.userMarkdownSetup = userMarkdownSetup;