/* 自定义：src/helpers/userSetup.js */

const fs = require('fs');
const path = require('path');

console.error("=========================================");
console.error("🚨 [DIAGNOSTIC PROBE] 诊断探针已启动！暂停所有修复，准备抓取内存快照...");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("debug-dump", function(content, outputPath) {
    
    if (outputPath && outputPath.endsWith(".html")) {
      
      // 我们只抓取包含了这几个关键字的案发现场页面
      if (content.includes("testnew.excalidraw") || content.includes("法术瞎") || content.includes("4321")) {
          
          // 在你博客的根目录生成一个 dump 文件
          const dumpFileName = `DEBUG_DUMP_${path.basename(outputPath)}`;
          const dumpFilePath = path.join(process.cwd(), dumpFileName);
          
          try {
              // 强制将内存中的原始字符串无损写入本地文件
              fs.writeFileSync(dumpFilePath, content, "utf8");
              console.log(`\n📸 [探针快照成功] 抓取到可疑文件！已保存至项目根目录: ${dumpFileName}`);
          } catch (err) {
              console.error("探针写入失败:", err);
          }
      }
      
      // 探针模式下，直接返回原始代码，不进行任何修改
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