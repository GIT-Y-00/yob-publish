/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V9.0 (The Great Unification)
 * * 听取建议，放弃对已损坏的内嵌 JSON 进行无意义的正则修补。
 * * [V9.0 核心] 引入大一统引擎：在 Markdown 页面中拦截官方破碎的内嵌渲染块，
 * * 将其强制替换为指向“完美独立页面”的 Iframe，实现渲染机制的终极统一。
 */

console.error("=========================================");
console.error("[V9.0 Log] userSetup.js loaded. Unification Engine ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v9.0", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;
      // 获取当前正在构建的页面路径，用于防循环检测
      let currentPath = outputPath.replace(/\\/g, '/').toLowerCase();

      // ==========================================
      // 阶段 A：纯净字典收集
      // ==========================================
      const linkMap = {};
      const anchorRegex = /<a[^>]*href=["'](\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = anchorRegex.exec(content)) !== null) {
        const href = match[1];
        if (href.includes('404')) continue; // 拒收死链
        const parts = href.split('/').filter(p => p);
        if (parts.length > 0) {
           let filename = decodeURIComponent(parts[parts.length - 1]);
           linkMap[filename] = href;
           let cleanName = filename.replace(/\.(md|svg|excalidraw)+$/i, '');
           if (cleanName) linkMap[cleanName] = href;
        }
      }

      // ==========================================
      // 阶段 B：大一统引擎 (Unification Engine)
      // ==========================================
      // 匹配官方的内嵌渲染 DOM 块 (div + render script)
      const embedRegex = /<div id="([^"]+excalidraw(?:\.md)?\d*)"><\/div>\s*<script>[\s\S]*?ReactDOM\.render\([\s\S]*?<\/script>/gi;
      
      fixedContent = fixedContent.replace(embedRegex, function(matchStr, id) {
          // 从 ID 提取干净的文件名 (例如 testnewexcalidraw.md1 -> testnew)
          let rawName = id.replace(/excalidraw(?:\.md)?\d*$/i, '');
          
          // 【核心防御】：如果我们正在构建的就是这个画板的独立页面本身，千万不要替换！保持原生完美渲染。
          if (currentPath.includes(rawName.toLowerCase())) {
              return matchStr; 
          }

          // 否则，说明这是一篇嵌了画板的 Markdown 笔记，查找它的独立页面真实地址
          let url = "";
          const targetSlug = rawName.toLowerCase().replace(/\s+/g, '-');
          for (const key in linkMap) {
              const keySlug = key.toLowerCase().replace(/\s+/g, '-');
              if (keySlug === targetSlug || keySlug === targetSlug + '-excalidraw' || keySlug === targetSlug + '-excalidraw-md') {
                  url = linkMap[key];
                  break;
              }
          }
          if (!url) url = `/${rawName}/`;

          console.log(`[V9.0 大一统引擎] 拦截到内嵌画板 '${rawName}'，已切换为统一 Iframe 模式 -> ${url}`);

          // 降维打击：直接返回一个我们写好样式的完美 Iframe
          return `<div class="excalidraw-wrapper"><iframe src="${url}" class="excalidraw-embed-iframe" loading="lazy" style="width: 100%; height: 100%; border: none; min-height: 500px;"></iframe></div>`;
      });

      // ==========================================
      // 阶段 C：独立页面原生修复 (仅服务于完美渲染的 Standalone 页面)
      // ==========================================
      // 修复可能存在的遗留转义错误，确保无 Console 报错
      fixedContent = fixedContent.replace(/"(\w+)"\s*:\s*"(<a\b[^>]*>)([^<]*)(<\/a>)"/gi, function(m, key, openTag, innerText) {
          return `"${key}": "${innerText.trim()}"`;
      });

      const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
         if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#') || innerLink.startsWith('/')) return matchedStr;
         let baseFilename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
         if (!baseFilename) return matchedStr;
         let candidates = [baseFilename, baseFilename.replace(/\.svg$/i, ''), baseFilename.replace(/\.md$/i, ''), baseFilename.replace(/(\.md|\.svg)+$/i, '')];
         let realPath = null;
         for (let c of candidates) { if (linkMap[c]) { realPath = linkMap[c]; break; } }
         if (!realPath) {
             for (let c of candidates) {
                 let slug = c.toLowerCase().replace(/\s+/g, '-');
                 for (let k in linkMap) {
                     if (k.toLowerCase().replace(/\s+/g, '-') === slug) { realPath = linkMap[k]; break; }
                 }
                 if (realPath) break;
             }
         }
         let finalPath = realPath ? realPath : `/${baseFilename.replace(/(\.md|\.svg)+$/i, '')}/`;
         return `${keyQuote}link${keyQuote}: ${valQuote}${finalPath}${valQuote}`;
      });

      // ==========================================
      // 阶段 D：注入高性能交互卡片 (全屏按钮等)
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