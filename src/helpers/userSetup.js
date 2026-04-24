/**
 * Excalidraw React Injector v2.1
 * * 核心体验升级：修复交互开启后的“滚动焦点”问题。
 * * 解决 iframe DOM 节点获取焦点但内部 contentWindow 未获取焦点导致无法直接滚轮滚动的体验痛点。
 */

console.error("=========================================");
console.error("[v2.1 Log] userSetup.js is active. Auto-focus mechanism ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v2.1", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A.0：构建真实路径映射字典 (The Map Builder)
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
      // 阶段 B：拦截 React 实例化并注入完美交互 Iframe 
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

                React.useEffect(() => {
                  if (isInteractive && iframeRef.current) {
                    // [V2.1 核心修复]：开启交互后，强制将焦点穿透进 iframe 的内部 Window
                    // 给浏览器 50ms 的时间去移除 pointer-events 的遮罩层并完成重绘
                    setTimeout(() => {
                      try {
                        if (iframeRef.current.contentWindow) {
                          iframeRef.current.contentWindow.focus();
                        }
                      } catch (e) {
                        // 忽略可能的同源策略安全警告拦截
                      }
                      // 兜底聚焦外层 DOM
                      iframeRef.current.focus();
                    }, 50);

                  } else if (!isInteractive) {
                    // 关闭交互时，回收焦点给主窗口的画布
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
                      // 阻止按钮自身抢夺焦点，确保焦点完美落入 iframe
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