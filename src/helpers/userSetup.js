/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V8.0
 * * 包含 V7.2 的深度嵌套层级支持。
 * * [V8.0 逻辑重构] 引入链式后缀清洗器 (Chain Suffix Cleaner)，完美解决 .excalidraw.md.svg 等多重后缀堆叠导致的路由匹配失败问题。
 */

console.error("=========================================");
console.error("[V8.0 Log] userSetup.js loaded. Chain Suffix Cleaner ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v8.0", function(content, outputPath) {
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
      // 阶段 C：终极路由解析器 (V8.0 链式清洗)
      // ==========================================
      const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
      
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
        
        if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#')) {
            return matchedStr;
        }

        // 1. 剔除括号和别名
        let baseFilename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        
        // 2. [V8.0 核心] 链式清理：循环剔除结尾的所有 .md 和 .svg，无视堆叠顺序
        let filename = baseFilename.replace(/(\.md|\.svg)+$/i, '');

        if (!filename) return matchedStr;

        // 3. 第一顺位查找：带 .excalidraw 的原名查找
        let realPath = linkMap[filename];
        
        // 4. 第二顺位查找：如果连 .excalidraw 后缀都去掉了呢？
        if (!realPath) {
            let cleanName = filename.replace(/\.excalidraw$/i, '');
            realPath = linkMap[cleanName] || linkMap[cleanName + '.excalidraw'];
        }

        // 5. 第三顺位查找：极端情况下的 Slug 模糊匹配
        if (!realPath) {
           const targetSlug = filename.toLowerCase().replace(/\s+/g, '-');
           const cleanSlug = targetSlug.replace(/-excalidraw$/, '');
           for (const key in linkMap) {
               const keySlug = key.toLowerCase().replace(/\s+/g, '-');
               if (keySlug === targetSlug || keySlug === cleanSlug) { 
                   realPath = linkMap[key]; 
                   break; 
               }
           }
        }
        
        const finalPath = realPath ? realPath : `/${filename}/`;
        
        console.log(`[V8.0 Radar] Fixed Link: ${innerLink} ---> ${finalPath}`);

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
                
                if (window.top !== window.self && window.top !== window.parent) {
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