/**
 * Excalidraw React Injector v2.1
 * * 继承 v1.2 的动态路由字典。
 * * 核心升级：修复 Iframe 交互体验。在开启交互时，利用同源优势强行注入焦点 (contentWindow.focus())，
 * * 解决必须先点击/拖拽滚动条才能使用鼠标滚轮滚动页面的 Bug。
 */

console.error("=========================================");
console.error("[v2.1 Log] userSetup.js is active. Focus Management Patch Applied.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v2.1", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A.0：构建真实路径映射字典
      // ==========================================
      const linkMap = {};
      const anchorRegex = /<a[^>]*href=["'](\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      
      while ((match = anchorRegex.exec(content)) !== null) {
        const href = match[1];
        const text = match[2].replace(/<[^>]+>/g, '').trim(); 
        
        if (text) {
           linkMap[text] = href;
        }
        
        const parts = href.split('/').filter(p => p);
        if (parts.length > 0) {
           const slug = decodeURIComponent(parts[parts.length - 1]);
           linkMap[slug] = href;
        }
      }

      // ==========================================
      // 阶段 A.1：清洗数据，查字典注入真实路径
      // ==========================================
      const dataRegex = /\blink\s*:\s*(["'])(.*?)\1/g;
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, quote, innerLink) {
        if (!innerLink.includes('[') && !innerLink.includes(']') && !innerLink.includes('.md')) {
          return matchedStr;
        }

        let filename = "";
        const mdLinkMatch = innerLink.match(/\/([^/]+)\.md\)?$/);
        if (mdLinkMatch) {
            filename = mdLinkMatch[1];
        } else {
            filename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        }

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

        const fixedUrl = realPath ? realPath : `/${filename}/`;
        return `link:${quote}${fixedUrl}${quote}`;
      });

      // ==========================================
      // 阶段 B：拦截 React 实例化并注入完美交互 Iframe (新增焦点管理)
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

                // 【V2.1 核心修复】增强的焦点管理钩子
                React.useEffect(() => {
                  if (isInteractive && iframeRef.current) {
                    // 1. 聚焦 iframe 标签本身
                    iframeRef.current.focus();
                    
                    // 2. 跨越边界，强制聚焦 iframe 内部的真实网页窗口和 Body
                    try {
                      const cw = iframeRef.current.contentWindow;
                      if (cw) {
                        cw.focus();
                        if (cw.document && cw.document.body) {
                          cw.document.body.focus();
                        }
                      }
                    } catch(e) {
                      console.error('[v2.1 Log] Focus injection blocked', e);
                    }
                  } else if (!isInteractive) {
                    // 关闭交互时，将焦点交还给主页面
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
                    onPointerDown: function(e) { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      setIsInteractive(!isInteractive); 
                    },
                    style: { 
                      position: "absolute", top: "8px", right: "8px", zIndex: 50, 
                      padding: "4px 8px", 
                      background: isInteractive ? "rgba(239, 68, 68, 0.9)" : "rgba(59, 130, 246, 0.9)", 
                      color: "white", 
                      border: "none", borderRadius: "6px", 
                      fontSize: "12px", fontWeight: "bold", cursor: "pointer", 
                      pointerEvents: "auto", transition: "background 0.2s"
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