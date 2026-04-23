/**
 * Excalidraw Link Fixer v0.2
 * * 尝试过但失败的方案 (v0.1): 
 * 使用 /"link"\s*:\s*"\[\[(.*?)\]\]"/g 在 Eleventy 的 transform 阶段直接替换。
 * 失败原因推测：原始 HTML 中的 JSON 数据可能被转义了（例如 \"link\":\"[[...]]\"），
 * 导致严格匹配双引号的正则失效；或者处理执行顺序问题导致钩子未成功拦截。
 */

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v0.2", function(content, outputPath) {
    // 仅处理 HTML 文件
    if (outputPath && outputPath.endsWith(".html")) {
      
      // Log 1: 确认 Hook 已经挂载并在遍历文件
      // 注意：这会在 Cloudflare 的构建日志中产生大量输出，确认正常后可注释掉
      // console.log(`[v0.2 Log] Scanning file: ${outputPath}`);

      // v0.2 增强版正则：
      // 允许键和值周围存在可选的反斜杠转义符 (\\?)
      // 捕获组 1: 前缀 (如 "link":" 或 \"link\":\" )
      // 捕获组 2: 链接核心内容 (如 1234testlink1234)
      // 捕获组 3: 后缀 (如 " 或 \")
      const regex = /(\\?"link\\?"\s*:\s*\\?")\[\[(.*?)\]\](\\?")/g;
      
      let matchCount = 0;

      const newContent = content.replace(regex, function(match, prefix, p2, suffix) {
        matchCount++;
        
        // 兼容 Obsidian 的别名语法：[[链接|别名]] -> 提取“链接”
        let filename = p2.split('|')[0]; 
        
        // 构建正确的绝对路径
        const fixedLink = `/Vault/${filename}/`;
        
        // Log 2: 命中匹配，打印在 Cloudflare 日志中
        console.log(`[v0.2 Log] SUCCESS matched in ${outputPath}! Replacing: [[${p2}]] -> ${fixedLink}`);
        
        // 保留原有的转义符结构，只替换中间的路径
        return `${prefix}${fixedLink}${suffix}`;
      });

      // Log 3: 统计单文件替换总数
      if (matchCount > 0) {
          console.log(`[v0.2 Log] Total replacements in ${outputPath}: ${matchCount}`);
      }

      return newContent;
    }
    
    return content;
  });
}

function userMarkdownSetup(md) {
  // 保持为空。由于目标字符串在 <script> 标签的 JSON 中，
  // 使用 Markdown 引擎的 inline rule 解析存在极高的破坏其他代码块的风险。
}

exports.userEleventySetup = userEleventySetup;
exports.userMarkdownSetup = userMarkdownSetup;