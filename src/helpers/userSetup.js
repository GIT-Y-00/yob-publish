/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V9.0 (The Sandbox Paradigm)
 * * [V9.0 范式革命] 听从用户核心思路，彻底放弃对被 MD 编译器污染的嵌入 JSON 进行正则修补。
 * * 采用沙盒替换法：扫描 HTML 中的错乱嵌入块，直接用 iframe 替换并指向完美的单文件渲染页！
 */

console.error("=========================================");
console.error("[V9.0 Log] userSetup.js loaded. Sandbox Paradigm ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v9.0", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A：纯净路径雷达 (构建全站真理字典)
      // ==========================================
      const linkMap = {};
      const anchorRegex = /<a[^>]*href=["'](\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      
      while ((match = anchorRegex.exec(content)) !== null) {
        const href = match[1];
        if (href.includes('404')) continue;
        
        const parts = href.split('/').filter(p => p);
        if (parts.length > 0) {
            let filename = decodeURIComponent(parts[parts.length - 1]);
            linkMap[filename] = href;
            
            let cleanName = filename.replace(/\.(md|svg|excalidraw)+$/i, '');
            if (cleanName && cleanName !== filename) {
                linkMap[cleanName] = href;
            }
        }
      }

      // ==========================================
      // 阶段 B：沙盒替换引擎 (The Sandboxer) - V9.0 核心！
      // 寻找 MD 文档中被原生插件污染的嵌入块，将其彻底物理抹除，替换为完美的 Iframe！
      // ==========================================
      // 正则解析：匹配 <a class="filename"> 标题 -> 中间的包裹 div -> 导致崩溃的 ReactDOM.render 脚本
      const embedRegex = /(<a[^>]*class="filename"[^>]*>\s*([^<]+)\s*<\/a>)((?:(?!<a[^>]*class="filename")[\s\S])*?)<div\s+id="([^"]+)"\s*><\/div>\s*<script>(?:(?!<\/script>)[\s\S])*?ReactDOM\.render(?:(?!<\/script>)[\s\S])*?<\/script>/gi;

      fixedContent = fixedContent.replace(embedRegex, function(match, aTag, filename, middleHtml, divId) {
          filename = filename.trim();

          // 1. 通过候选名单找出这个画板单文件所在的完美独立网址
          let candidates = [
              filename,                                          
              filename.replace(/\.svg$/i, ''),                   
              filename.replace(/\.md$/i, ''),                    
              filename.replace(/(\.md|\.svg)+$/i, '')           
          ];

          let realPath = null;
          for (let candidate of candidates) {
              if (linkMap[candidate]) { realPath = linkMap[candidate]; break; }
          }
          
          if (!realPath) {
              for (let candidate of candidates) {
                  let targetSlug = candidate.toLowerCase().replace(/\s+/g, '-');
                  for (const key in linkMap) {
                      if (key.toLowerCase().replace(/\s+/g, '-') === targetSlug) {
                          realPath = linkMap[key];
                          break;
                      }
                  }
                  if (realPath) break;
              }
          }

          let finalPath = realPath;
          if (!finalPath) {
              let cleanFallback = filename.replace(/(\.md|\.svg)+$/i, '');
              finalPath = `/${cleanFallback}/`;
          }

          console.log(`[V9.0 Sandbox] 将破碎的嵌入转换为沙盒 Iframe: ${filename} -> ${finalPath}`);

          // 2. 物理毁灭与重生：保留原有的文件名标题，把下面一整坨会导致崩溃的死代码全部用干净的 iframe 替换！
          // className 设置为 excalidraw-wrapper 以完美继承你之前写好的 V7.x 样式体系！
          return `${aTag}${middleHtml}<div class="excalidraw-wrapper"><iframe src="${finalPath}" class="dg-embedded-excalidraw" loading="lazy" style="width:100%; height:100%; border:none;"></iframe></div>`;
      });

      // ==========================================
      // 阶段 C：安全路由解析器 (仅服务于未被沙盒化的单文件)
      // ==========================================
      const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
      
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
        
        if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#') || innerLink.startsWith('/')) {
            return matchedStr;
        }

        let baseFilename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        if (!baseFilename) return matchedStr;

        let candidates = [
            baseFilename,                                          
            baseFilename.replace(/\.svg$/i, ''),                   
            baseFilename.replace(/\.md$/i, ''),                    
            baseFilename.replace(/(\.md|\.svg)+$/i, '')           
        ];

        let realPath = null;
        for (let candidate of candidates) {
            if (linkMap[candidate]) { realPath = linkMap[candidate]; break; }
        }

        if (!realPath) {
            for (let candidate of candidates) {
                let targetSlug = candidate.toLowerCase().replace(/\s+/g, '-');
                for (const key in linkMap) {
                    if (key.toLowerCase().replace(/\s+/g, '-') === targetSlug) {
                        realPath = linkMap[key];
                        break;
                    }
                }
                if (realPath) break;
            }
        }
        
        let finalPath = realPath;
        if (!finalPath) {
            let cleanFallback = baseFilename.replace(/(\.md|\.svg)+$/i, '');
            finalPath = `/${cleanFallback}/`;
        }

        return `${keyQuote}link${keyQuote}: ${valQuote}${finalPath}${valQuote}`;
      });

      // ==========================================
      // 阶段 D：注入高性能交互卡片 (服务于单文件的主画板)
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