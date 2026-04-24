/**
 * Excalidraw React Injector V2.11
 * * 保持 V2.10 的异步聚焦引擎，配合 V2.11 的极致防吞滚轮策略。
 */

console.error("=========================================");
console.error("[V2.11 Log] userSetup.js loaded. Async Focus Engine ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v2.11", function(content, outputPath) {
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

      const dataRegex = /\blink\s*:\s*(["'])(.*?)\1/g;
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, quote, innerLink) {
        if (!innerLink.includes('[') && !innerLink.includes(']') && !innerLink.includes('.md')) return matchedStr;

        let filename = "";
        const mdLinkMatch = innerLink.match(/\/([^/]+)\.md\)?$/);
        if (mdLinkMatch) filename = mdLinkMatch[1];
        else filename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();

        let realPath = linkMap[filename];
        if (!realPath) {
           const targetSlug = filename.toLowerCase().replace(/\s+/g, '-');
           for (const key in linkMap) {
               if (key.toLowerCase().replace(/\s+/g, '-') === targetSlug) { realPath = linkMap[key]; break; }
           }
        }
        return `link:${quote}${realPath ? realPath : `/${filename}/`}${quote}`;
      });

      // ==========================================
      // 阶段 B：注入高性能交互卡片 (V4.0 更新版)
      // ==========================================
      const reactInitRegex = /React\.createElement\(\s*ExcalidrawLib\.Excalidraw\s*,\s*\{/;
      
      if (reactInitRegex.test(fixedContent)) {
        fixedContent = fixedContent.replace(
          reactInitRegex,
          `((excalidrawProps) => {
            if (!window.DgExcalidrawWrapper) {
              window.DgExcalidrawWrapper = function(props) {
                const [isInteractive, setIsInteractive] = React.useState(false);
                const [isFullscreen, setIsFullscreen] = React.useState(false);
                const wrapperRef = React.useRef(null);
                const iframeRef = React.useRef(null);

                // 交互切换逻辑 (保持原有逻辑)
                const toggleInteraction = React.useCallback((e) => {
                  e.preventDefault(); e.stopPropagation(); 
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
                  }
                }, [isInteractive]);

                // [V4.0 新增] 全屏切换逻辑
                const toggleFullscreen = React.useCallback(() => {
                    if (!document.fullscreenElement) {
                        wrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true));
                    } else {
                        document.exitFullscreen().then(() => setIsFullscreen(false));
                    }
                }, []);

                return React.createElement("div", {
                  ref: wrapperRef,
                  style: { position: "relative", width: "100%", height: "100%", boxSizing: "border-box", pointerEvents: "none" }
                },
                  // 交互开关按钮
                  React.createElement("button", {
                    onPointerDown: toggleInteraction,
                    style: { 
                      position: "absolute", top: "8px", right: "8px", zIndex: 50, 
                      padding: "5px 10px", background: isInteractive ? "rgba(239, 68, 68, 0.95)" : "rgba(59, 130, 246, 0.95)", 
                      color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", 
                      cursor: "pointer", pointerEvents: "auto", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }
                  }, isInteractive ? "锁定滚动" : "开启交互"),

                  // [V4.0 新增] 全屏开关按钮
                  React.createElement("button", {
                    onPointerDown: toggleFullscreen,
                    style: { 
                      position: "absolute", top: "8px", left: "8px", zIndex: 50, 
                      padding: "5px 10px", background: "rgba(107, 114, 128, 0.95)", 
                      color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", 
                      cursor: "pointer", pointerEvents: "auto", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }
                  }, isFullscreen ? "退出全屏" : "全屏"),

                  React.createElement("iframe", {
                    ref: iframeRef, 
                    src: props.link,
                    loading: "lazy",
                    style: { 
                      width: "100%", height: "100%", border: "none", borderRadius: "8px",
                      boxShadow: isInteractive ? "0 0 0 3px #3b82f6 inset" : "0 4px 6px -1px rgba(0,0,0,0.1)",
                      transition: "box-shadow 0.2s", pointerEvents: isInteractive ? "auto" : "none",
                      background: "var(--background-primary, #fff)"
                    }
                  })
                );
              };
            }
            // ... (renderEmbeddable 逻辑保持不变)
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