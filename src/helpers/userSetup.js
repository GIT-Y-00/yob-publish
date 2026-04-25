/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V8.3 (The Ultimate Edition)
 * * 包含 V7.2 深度嵌套支持。
 * * [V8.3 核心修复 1] 升级万能 Syntax Healer，修复 JSON 中 "text" 和 "link" 属性引发的全局语法崩溃。
 * * [V8.3 核心修复 2] 移除候选字典对 .excalidraw 的危险剥离，彻底解决同名文件撞车跳转错误。
 */

console.error("=========================================");
console.error("[V8.3 Log] userSetup.js loaded. Universal Syntax Healer ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v8.3", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 A：路径雷达与免疫清洗
      // ==========================================
      const linkMap = {};
      const anchorRegex = /<a[^>]*href=["'](\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      
      while ((match = anchorRegex.exec(content)) !== null) {
        const href = match[1];
        
        // 拒绝将无效的 /404 死链录入字典库，防止污染查询
        if (href.includes('404')) continue;
        
        const text = match[2].replace(/<[^>]+>/g, '').trim(); 
        if (text) linkMap[text] = href; 
        
        const parts = href.split('/').filter(p => p);
        if (parts.length > 0) {
           linkMap[decodeURIComponent(parts[parts.length - 1])] = href;
        }
      }

      // ==========================================
      // 阶段 B：万能语法修复引擎 (Universal Syntax Healer)
      // ==========================================
      // [V8.3 核心] 捕获 *所有* JSON 属性（"link", "text" 等）中的未转义 <a class="internal-link">
      // 使用 [^<]* 严格界定文本内容，绝不吞噬任何相邻的 JSON 坐标或属性！
      fixedContent = fixedContent.replace(/"(\w+)"\s*:\s*"(<a\b[^>]*>)([^<]*)(<\/a>)"/gi, function(match, key, openTag, innerText, closeTag) {
          let cleanText = innerText.trim();
          // 完美还原安全的纯文本 JSON 属性
          return `"${key}": "${cleanText}"`;
      });

      // ==========================================
      // 阶段 C：终极路由解析器 (安全查表版)
      // ==========================================
      const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
      
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
        
        // 保护外部链接、锚点和绝对路径
        if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#') || innerLink.startsWith('/')) {
            return matchedStr;
        }

        // 1. 剔除左右括号（修复类似 [1234testlink1234]] 的残缺符号）和别名
        let baseFilename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        if (!baseFilename) return matchedStr;

        // 2. [V8.3 核心防御] 建立多维候选名单
        // 严禁在此处剥离 .excalidraw！只清洗 .md 和 .svg 这种干扰后缀
        let candidates = [
            baseFilename,                                          
            baseFilename.replace(/\.svg$/i, ''),                   
            baseFilename.replace(/\.md$/i, ''),                    
            baseFilename.replace(/(\.md|\.svg)+$/i, '')           
        ];

        let realPath = null;

        // 3. 轰炸式精确查找
        for (let candidate of candidates) {
            if (linkMap[candidate]) {
                realPath = linkMap[candidate];
                break;
            }
        }

        // 4. 轰炸式模糊(Slug)查找
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
        
        // 5. 终极回退方案：带着正确的文件夹和后缀生成链接
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