function userEleventySetup(eleventyConfig) {
  // 注册一个 Transform 钩子，在 HTML 写入磁盘前拦截并修改内容
  eleventyConfig.addTransform("fix-excalidraw-links", function(content, outputPath) {
    // 确保只处理生成的 .html 文件，跳过图片或静态资源
    if (outputPath && outputPath.endsWith(".html")) {
      
      // 正则解析：精确锁定 Excalidraw JSON 状态里的 "link":"[[任意内容]]"
      // (.*?) 采用非贪婪匹配获取中括号内的文件名
      const regex = /"link"\s*:\s*"\[\[(.*?)\]\]"/g;

      content = content.replace(regex, function(match, p1) {
        // p1 当前为 1234testlink1234
        // 兼容处理 Obsidian 中带有别名的链接，例如 [[1234testlink1234|显示文本]]
        let filename = p1.split('|')[0];

        // 【可选操作】如果你的数字花园开启了 URL slugify（例如将空格转为横线，或全小写）
        // 则需要在这里对 filename 进行相应的格式化，确保它与真实文件夹名一致：
        // filename = filename.replace(/\s+/g, '-').toLowerCase();

        // 构造正确的根目录绝对路径。
        // 首尾必须带有斜杠，以防在访问深层嵌套文件时引发浏览器相对路径的错误跳转。
        const fixedLink = `/Vault/${filename}/`;

        // 返回修复后的 JSON 键值对，注意保留外层的双引号以符合 JSON 语法
        return `"link":"${fixedLink}"`;
      });
    }
    
    // 必须返回内容，无论是否进行了替换
    return content;
  });
}

function userMarkdownSetup(md) {
  // 保持为空。我们不需要（也不建议）为隐藏在 script 中的内容修改 markdown 规则。
}

exports.userEleventySetup = userEleventySetup;
exports.userMarkdownSetup = userMarkdownSetup;