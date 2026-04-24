/**
 * Excalidraw React Injector v2.2 (Diagnostic Edition)
 * * 引入高精度探测点，排查 Iframe 滚动焦点丢失的真实根源。
 * * 侦测同源策略阻塞、React 渲染时序以及 DOM ActiveElement 转移轨迹。
 */

console.error("=========================================");
console.error("[v2.2 Log] userSetup.js is active. Deep Diagnostic Probes ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v2.2", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A.0 & A.1：路径雷达与清洗 (沿用 V2.1 的成熟逻辑)
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
      // 阶段 B：带有深度探针的 React 组件
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
                  console.error(\`[v2.2 Probe] State changed. isInteractive: \${isInteractive}\`);
                  
                  if (isInteractive && iframeRef.current) {
                    // 探针 1：记录触发前的父级焦点
                    console.error("[v2.2 Probe] Before Focus Attempt - Parent Active Element:", document.activeElement ? document.activeElement.tagName + "." + document.activeElement.className : "None");
                    
                    // 使用 requestAnimationFrame 确保 React 已经将 pointer-events: auto 渲染到 DOM 上
                    requestAnimationFrame(() => {
                      setTimeout(() => {
                        console.error("[v2.2 Probe] DOM repaint confirmed. Executing focus logic...");
                        
                        // 探针 2：检查同源策略 (SOP) 是否拦截了我们访问内部 Window
                        try {
                          const cw = iframeRef.current.contentWindow;
                          if (cw) {
                            const testAccess = cw.location.href; // 如果跨域，这句会抛出 DOMException 错误
                            console.error(\`[v2.2 Probe] SOP Check PASSED. iframe URL is accessible: \${testAccess}\`);
                            
                            // 尝试强行唤醒内部网页的焦点
                            cw.focus();
                            console.error("[v2.2 Probe] Action: contentWindow.focus() executed.");
                            
                            // 探针 3：注入内部焦点检测脚本 (仅在同源下有效)
                            try {
                                const innerDoc = cw.document;
                                const innerBody = innerDoc.body;
                                innerBody.focus(); // 尝试把焦点压给内部 body
                                console.error("[v2.2 Probe] Action: innerDoc.body.focus() executed.");
                                console.error("[v2.2 Probe] Inner Active Element is now:", innerDoc.activeElement ? innerDoc.activeElement.tagName : "Unknown");
                            } catch (innerErr) {
                                console.error("[v2.2 Probe] Could not manipulate inner DOM:", innerErr.message);
                            }

                          } else {
                            console.error("[v2.2 Probe] FAILED: contentWindow is null.");
                          }
                        } catch (err) {
                          console.error("[v2.2 Probe] SOP Check FAILED. Browser blocked cross-origin access! Error:", err.message);
                        }

                        // 兜底操作
                        iframeRef.current.focus();
                        console.error("[v2.2 Probe] Action: iframe DOM Node focused.");
                        
                        // 探针 4：确认最终结果
                        console.error("[v2.2 Probe] After Focus Attempt - Parent Active Element:", document.activeElement ? document.activeElement.tagName + "." + document.activeElement.className : "None");
                        
                      }, 100); // 100ms 保证绝对充裕的渲染时间
                    });

                  } else if (!isInteractive) {
                    if (document.activeElement === iframeRef.current) {
                      iframeRef.current.blur();
                    }
                    window.focus();
                  }
                }, [isInteractive]);

                return React.createElement("div", {
                  style: { position: "relative", width: "100%", height: "100%", boxSizing: "border-box", pointerEvents: "none" }
                },
                  // 注意这里改用了 onClick 进行测试，观察是否由 onPointerDown 引起的原生事件冲突
                  React.createElement("button", {
                    onClick: function(e) { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      console.error("[v2.2 Probe] Interaction Button CLICKED!");
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