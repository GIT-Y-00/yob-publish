/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V8.5 (The Bulletproof Edition)
 * * 包含 V7.2 深度嵌套支持与 V8.4 纯净字典。
 * * [V8.5 终极重构] 引入基于沙盒机制的防弹级 JSON 解析器。先锁定闭合字符串，再清洗 HTML，
 * * 从物理层面绝对阻断正则越界吞噬，彻底根除画板链接互换、内容错位与破碎图标的 Bug。
 */

console.error("=========================================");
console.error("[V8.5 Log] userSetup.js loaded. Bulletproof JSON Parser ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v8.5", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A：纯净路径雷达
      // ==========================================
      const linkMap = {};
      const anchorRegex = /<a[^>]*href=["'](\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      
      while ((match = anchorRegex.exec(content)) !== null) {
        const href = match[1];
        if (href.includes('404')) continue; // 屏蔽死链
        
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
      // 阶段 B：防弹级语法修复引擎 (V8.5 沙盒隔离版)
      // ==========================================
      // 1. 使用严格遵守 JSON 转义规则的正则，精准锁定每一个独立的 "key": "value"
      const jsonStringRegex = /"(?:[^"\\]|\\.)*"\s*:\s*"(?:[^"\\]|\\.)*"/g;
      
      fixedContent = fixedContent.replace(jsonStringRegex, function(sandboxMatch) {
          // 2. 只有在这个绝对安全的沙盒内，如果发现了 HTML 标签，才进行清洗
          if (sandboxMatch.includes('<a ') && sandboxMatch.includes('</a>')) {
              let splitIndex = sandboxMatch.indexOf(':');
              let keyPart = sandboxMatch.substring(0, splitIndex);
              let valPart = sandboxMatch.substring(splitIndex + 1);
              
              // 剥离 HTML 标签，留下干净纯文本，彻底消除 JS 崩溃隐患
              let cleanVal = valPart.replace(/<[^>]+>/g, '');
              return keyPart + ':' + cleanVal;
          }
          return sandboxMatch;
      });

      // ==========================================
      // 阶段 C：终极路由解析器
      // ==========================================
      const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
      
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
        
        if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#') || innerLink.startsWith('/')) {
            return matchedStr;
        }

        // 剔除前后可能残留的错乱中括号 [ ]
        let baseFilename = innerLink.replace(/^[\[\]]+|[\[\]]+$/g, '').split('|')[0].trim();
        if (!baseFilename) return matchedStr;

        // 构建排他性候选名单
        let candidates = [
            baseFilename,                                          
            baseFilename.replace(/\.svg$/i, ''),                   
            baseFilename.replace(/\.md$/i, ''),                    
            baseFilename.replace(/(\.md|\.svg)+$/i, '')           
        ];
        
        // 数组去重
        candidates = [...new Set(candidates)];

        let realPath = null;

        // 精确轰炸查找
        for (let candidate of candidates) {
            if (linkMap[candidate]) {
                realPath = linkMap[candidate];
                break;
            }
        }

        // 模糊 Slug 查找
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
        
        // 终极回退方案
        let finalPath = realPath;
        if (!finalPath) {
            let cleanFallback = baseFilename.replace(/(\.md|\.svg)+$/i, '');
            finalPath = `/${cleanFallback}/`;
        }

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