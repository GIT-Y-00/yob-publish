/**
 * Excalidraw React Injector v1.1
 * * 核心突破：摒弃 DOM 监听，直接在构建时拦截 React.createElement 注入 renderEmbeddable API。
 * * 感谢用户的精妙构思！
 */

console.error("=========================================");
console.error("[v1.1 Log] userSetup.js is active. React Interceptor Mode ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v1.1", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A：清洗数据，生成绝对路径 (沿用 v1.0 逻辑)
      // ==========================================
      const dataRegex = /\blink\s*:\s*(["'])(.*?)\1/g;
      fixedContent = fixedContent.replace(dataRegex, function(match, quote, innerLink) {
        if (!innerLink.includes('[') && !innerLink.includes(']') && !innerLink.includes('.md')) {
          return match;
        }

        let filename = "";
        const mdLinkMatch = innerLink.match(/\/([^/]+)\.md\)?$/);
        if (mdLinkMatch) {
            filename = mdLinkMatch[1];
        } else {
            filename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        }

        const fixedUrl = `/Vault/${filename}/`;
        console.error(`[v1.1 Log] Fixed internal link: ${fixedUrl}`);
        return `link:${quote}${fixedUrl}${quote}`;
      });

      // ==========================================
      // 阶段 B：拦截 React 实例化并注入 renderEmbeddable 
      // ==========================================
      // 匹配 Digital Garden 编译出的 Excalidraw 挂载代码
      const reactInitRegex = /React\.createElement\(\s*ExcalidrawLib\.Excalidraw\s*,\s*\{/;
      
      if (reactInitRegex.test(fixedContent)) {
        console.error(`[v1.1 Log] React Component matched in ${outputPath}! Injecting renderEmbeddable wrapper...`);
        
        fixedContent = fixedContent.replace(
          reactInitRegex,
          `((excalidrawProps) => {
            // 定义防污染的全局 React 组件
            if (!window.DgExcalidrawWrapper) {
              window.DgExcalidrawWrapper = function(props) {
                const [isInteractive, setIsInteractive] = React.useState(false);
                const iframeRef = React.useRef(null);

                // 处理焦点逻辑，防止 iframe 吃掉画布的快捷键
                React.useEffect(() => {
                  if (isInteractive && iframeRef.current) {
                    iframeRef.current.focus();
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

            // 将官方 API 挂载到 Props 上
            excalidrawProps.validateEmbeddable = function() { return true; };
            excalidrawProps.renderEmbeddable = function(node) { 
              if (node && node.link) { 
                // 嵌套保险机制，防止 iframe 无限套娃崩溃
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
      } else {
        // 如果页面包含 excalidraw 数据，但没找到注入点
        if (fixedContent.includes("ExcalidrawLib")) {
          console.error(`[v1.1 Log WARNING] Found Excalidraw in ${outputPath}, but React init regex failed to match!`);
        }
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