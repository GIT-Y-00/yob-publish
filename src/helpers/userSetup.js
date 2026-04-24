/**
 * Excalidraw React Injector v1.2
 * * 核心升级：动态路由解析 (Dynamic Route Resolution)。
 * * 通过在 HTML 中全盘扫描 Digital Garden 自动生成的隐藏 <a class="internal-link"> 节点，
 * * 构建 "文件名 -> 真实绝对路径" 的映射字典，彻底解决硬编码导致的路径 404 错误。
 */

console.error("=========================================");
console.error("[v1.2 Log] userSetup.js is active. Dynamic Route Radar ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v1.2", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A.0：构建真实路径映射字典 (The Map Builder)
      // ==========================================
      const linkMap = {};
      // 扫描所有 href 以 / 开头的 <a> 标签
      const anchorRegex = /<a[^>]*href=["'](\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      
      while ((match = anchorRegex.exec(content)) !== null) {
        const href = match[1]; // 例如: /Excalidraw/testnew.excalidraw/ 或 /Vault/1234/
        // 清除内部可能附带的 HTML 标签（如 SVG 图标），并去除首尾空格
        const text = match[2].replace(/<[^>]+>/g, '').trim(); 
        
        if (text) {
           linkMap[text] = href; // 字典 1: 以显示文本（通常是文件名或别名）作为键
        }
        
        // 字典 2: 提取 URL 的最后一段作为 slug 备用，防止别名不同导致匹配失败
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
        // 过滤非内部链接
        if (!innerLink.includes('[') && !innerLink.includes(']') && !innerLink.includes('.md')) {
          return matchedStr;
        }

        let filename = "";
        const mdLinkMatch = innerLink.match(/\/([^/]+)\.md\)?$/);
        if (mdLinkMatch) {
            filename = mdLinkMatch[1];
        } else {
            // 提取双括号内的文件名
            filename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        }

        // 核心突破：去雷达字典里查找正确的路径！
        let realPath = linkMap[filename];
        
        // 如果精确匹配没找到，尝试忽略大小写和空格匹配 slug
        if (!realPath) {
           const targetSlug = filename.toLowerCase().replace(/\s+/g, '-');
           for (const key in linkMap) {
               if (key.toLowerCase().replace(/\s+/g, '-') === targetSlug) {
                   realPath = linkMap[key];
                   break;
               }
           }
        }

        // 如果字典里真的没有（说明文件可能未公开），则兜底使用根目录斜杠
        const fixedUrl = realPath ? realPath : `/${filename}/`;
        
        console.error(`[v1.2 Log] Resolved: ${filename} -> ${fixedUrl}`);
        
        return `link:${quote}${fixedUrl}${quote}`;
      });

      // ==========================================
      // 阶段 B：拦截 React 实例化并注入完美交互 Iframe 
      // (完全保留了 v1.1 验证过的优秀代码)
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