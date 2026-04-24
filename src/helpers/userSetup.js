/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V7.1
 * * [V7.1 终极修复] 重写 dataRegex，修复其无法匹配 JSON 双引号键名 ("link":) 导致的路由解析失效问题。
 * * 引入更强大的括号与后缀清洗器。
 */

console.error("=========================================");
console.error("[V7.1 Log] userSetup.js loaded. Robust URL Resolver ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v7.1", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A：路径雷达与清洗
      // ==========================================
      const linkMap = {};
      const anchorRegex = /<a[^>]*href=["'](\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      
      while ((match = anchorRegex.exec(content)) !== null) {
        const href = match[1];
        const text = match[2].replace(/<[^>]+>/g, '').trim(); 
        if (text) linkMap[text] = href; 
        
        const parts = href.split('/').filter(p => p);
        if (parts.length > 0) {
           linkMap[decodeURIComponent(parts[parts.length - 1])] = href;
        }
      }

      // ==========================================
      // 阶段 B：语法修复引擎 (Syntax Healer)
      // ==========================================
      fixedContent = fixedContent.replace(/"link"\s*:\s*"(<a\b[\s\S]*?<\/a>)"/gi, function(match, htmlStr) {
          const textMatch = htmlStr.match(/>([^<]+)<\/a>/i);
          const filename = textMatch ? textMatch[1].trim() : "";
          return `"link": "${filename}"`;
      });

      // ==========================================
      // 阶段 C：终极路由解析器 (Robust URL Resolver)
      // ==========================================
      // [V7.1 修复] 匹配 "link": "...", 'link': "...", link: "..." (兼容所有引号形式)
      const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
      
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
        
        // 排除空白、外部网络链接、页面锚点
        if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#')) {
            return matchedStr;
        }

        // 终极清洗：抹除所有可能的 Obsidian 左右括号（应对 [1234] 这种残缺情况）和别名符号
        let filename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        
        // 终极清洗：剔除所有可能影响路由匹配的后缀名
        filename = filename.replace(/\.(md|svg|excalidraw)$/i, '');

        if (!filename) return matchedStr;

        // 搜寻真实路径
        let realPath = linkMap[filename];
        if (!realPath) {
           const targetSlug = filename.toLowerCase().replace(/\s+/g, '-');
           for (const key in linkMap) {
               if (key.toLowerCase().replace(/\s+/g, '-') === targetSlug) { 
                   realPath = linkMap[key]; 
                   break; 
               }
           }
        }
        
        const finalPath = realPath ? realPath : `/${filename}/`;
        
        // [构建期雷达]：可以在 Node 终端看到修复结果
        console.log(`[V7.1 Radar] Fixed JSON Link: ${innerLink}  --->  ${finalPath}`);

        // 原样包装回 JSON 属性，确保语法绝对安全
        return `${keyQuote}link${keyQuote}: ${valQuote}${finalPath}${valQuote}`;
      });

      // ==========================================
      // 阶段 D：注入高性能交互卡片
      // ==========================================
      const reactInitRegex = /React\.createElement\(\s*ExcalidrawLib\.Excalidraw\s*,\s*\{/;
      
      if (reactInitRegex.test(fixedContent)) {
        fixedContent = fixedContent.replace(
          reactInitRegex,
          `((excalidrawProps) => {
            if (!window.DgExcalidrawWrapper) {
              window.DgExcalidrawWrapper = function(props) {
                const [isInteractive, setIsInteractive] = React.useState(false);
                const iframeRef = React.useRef(null);

                const toggleInteraction = React.useCallback((e) => {
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  
                  const willBeInteractive = !isInteractive;
                  setIsInteractive(willBeInteractive); 

                  if (willBeInteractive && iframeRef.current) {
                      setTimeout(() => {
                          try {
                              const cw = iframeRef.current.contentWindow;
                              if (cw && cw.document) {
                                  const targetNode = cw.document.body || cw.document.documentElement;
                                  targetNode.setAttribute('tabindex', '-1');
                                  targetNode.focus({ preventScroll: true });
                              }
                          } catch (err) {}
                          
                          iframeRef.current.focus();
                      }, 50);

                  } else if (!willBeInteractive) {
                      if (document.activeElement === iframeRef.current) {
                          iframeRef.current.blur();
                      }
                      window.focus();
                  }
                }, [isInteractive]);

                return React.createElement("div", {
                  style: { position: "relative", width: "100%", height: "100%", boxSizing: "border-box", pointerEvents: "none" }
                },
                  React.createElement("button", {
                    onPointerDown: toggleInteraction,
                    style: { 
                      position: "absolute", top: "8px", right: "8px", zIndex: 50, 
                      padding: "5px 10px", 
                      background: isInteractive ? "rgba(239, 68, 68, 0.95)" : "rgba(59, 130, 246, 0.95)", 
                      color: "white", 
                      border: "none", borderRadius: "6px", 
                      fontSize: "12px", fontWeight: "bold", cursor: "pointer", 
                      pointerEvents: "auto", transition: "all 0.2s",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }
                  }, isInteractive ? "锁定滚动" : "开启交互"),

                  React.createElement("iframe", {
                    ref: iframeRef, 
                    src: props.link,
                    loading: "lazy",
                    style: { 
                      width: "100%", height: "100%", border: "none", borderRadius: "8px",
                      boxShadow: isInteractive ? "0 0 0 3px #3b82f6 inset" : "0 4px 6px -1px rgba(0,0,0,0.1)",
                      transition: "box-shadow 0.2s",
                      pointerEvents: isInteractive ? "auto" : "none",
                      background: "var(--background-primary, #fff)"
                    }
                  })
                );
              };
            }

            excalidrawProps.validateEmbeddable = function() { return true; };
            excalidrawProps.renderEmbeddable = function(node) { 
              if (node && node.link) { 
                if (window.self !== window.top) {
                  return React.createElement("div", { 
                    style: { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "var(--background-secondary, #f8f9fa)", border: "2px dashed #d1d5db", borderRadius: "8px" } 
                  }, React.createElement("a", { href: node.link, target: "_top", style: { color: "#3b82f6", textDecoration: "none", fontWeight: "bold", pointerEvents: "auto" } }, "🔗 深度嵌套，点击跳转"));
                }
                return React.createElement(window.DgExcalidrawWrapper, { link: node.link, key: node.id });
              } 
              return null; 
            };

            return React.createElement(ExcalidrawLib.Excalidraw, excalidrawProps);
          })({`
        );
      }

      return fixedContent;
    }
    return content;
  });
}

function useMarkdownSetup(md) {}
function userMarkdownSetup(md) {}

exports.userEleventySetup = userEleventySetup;
exports.useMarkdownSetup = useMarkdownSetup;
exports.userMarkdownSetup = userMarkdownSetup;