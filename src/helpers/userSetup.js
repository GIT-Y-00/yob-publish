/**
 * Excalidraw Link Fixer & Iframe Prepper v1.0
 * * 继承 v0.3 的链接清洗功能。
 * * 尝试过但放弃的方案：试图在此阶段直接注入 <iframe> 字符串。由于 Excalidraw 
 * 是客户端 Canvas/React 渲染，强行修改 JSON 结构会导致渲染引擎崩溃。
 * 因此，本文件专注于提供纯净的 URL，将 DOM 替换工作交由前端 njk 脚本处理。
 */

console.error("=========================================");
console.error("[v1.0 Log] userSetup.js is active. Prepping URLs for iframe insertion...");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v1.0", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      let matchCount = 0;
      const regex = /\blink\s*:\s*(["'])(.*?)\1/g;

      const newContent = content.replace(regex, function(match, quote, innerLink) {
        if (!innerLink.includes('[') && !innerLink.includes(']') && !innerLink.includes('.md')) {
          return match;
        }

        matchCount++;
        let filename = "";

        const mdLinkMatch = innerLink.match(/\/([^/]+)\.md\)?$/);
        if (mdLinkMatch) {
            filename = mdLinkMatch[1];
        } else {
            filename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        }

        const fixedUrl = `/Vault/${filename}/`;
        
        console.error(`[v1.0 Log] Configured URL for embed: ${fixedUrl}`);
        
        return `link:${quote}${fixedUrl}${quote}`;
      });

      return newContent;
    }
    return content;
  });
}

function useMarkdownSetup(md) {}
function userMarkdownSetup(md) {}

exports.userEleventySetup = userEleventySetup;
exports.useMarkdownSetup = useMarkdownSetup;
exports.userMarkdownSetup = userMarkdownSetup;