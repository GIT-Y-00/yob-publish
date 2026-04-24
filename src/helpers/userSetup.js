/**
 * Excalidraw Link Fixer v1.1
 * * 尝试过但失败的方案 (v1.0)：输出相对路径 /Vault/...
 * 失败原因：Excalidraw 拒绝为相对路径生成 iframe，而是降级为 Canvas 上的文字画块。
 * * 当前策略：生成伪造的 https 绝对路径，诱骗 Excalidraw 生成 iframe。
 */
console.error("=========================================");
console.error("[v1.1 Log] userSetup.js is injecting Trojan URLs...");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v1.1", function(content, outputPath) {
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

        // 【v1.1 核心修改】伪造一个以 https:// 开头的网址，骗取 iframe 生成
        const fakeAbsoluteUrl = `https://dg-local-embed.com/Vault/${filename}/`;
        
        console.error(`[v1.1 Log] Forged Trojan URL: ${fakeAbsoluteUrl}`);
        
        return `link:${quote}${fakeAbsoluteUrl}${quote}`;
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