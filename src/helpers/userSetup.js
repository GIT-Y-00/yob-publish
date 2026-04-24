/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V8.1
 * * 包含 V7.2 的深度嵌套支持。
 * * [V8.1 终极路由引擎] 引入多维候选名单 (Multi-Candidate Resolver) 与 404 免疫，
 * * 完美解决嵌套画板因后缀强力清洗导致与 linkMap 字典脱节的 404 寻址灾难。
 */

console.error("=========================================");
console.error("[V8.1 Log] userSetup.js loaded. Multi-Candidate Resolver ENGAGED.");
console.error("=========================================");

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v8.1", function(content, outputPath) {
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
        
        // [V8.1 核心防御] 拒绝将无效的 /404 死链录入字典库，防止污染查询
        if (href.includes('404')) continue;
        
        const text = match[2].replace(/<[^>]+>/g, '').trim(); 
        if (text) linkMap[text] = href; 
        
        const parts = href.split('/').filter(p => p);
        if (parts.length > 0) {
           linkMap[decodeURIComponent(parts[parts.length - 1])] = href;
        }
      }

      // ==========================================
      // 阶段 B：语法修复引擎 (Syntax Healer)
      // ==========================================
      fixedContent = fixedContent.replace(/"link"\s*:\s*"(<a\b[\s\S]*?<\/a>)"/gi, function(match, htmlStr) {
          const textMatch = htmlStr.match(/>([^<]+)<\/a>/i);
          const filename = textMatch ? textMatch[1].trim() : "";
          return `"link": "${filename}"`;
      });

      // ==========================================
      // 阶段 C：终极路由解析器 (V8.1 多维查表)
      // ==========================================
      const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
      
      fixedContent = fixedContent.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
        
        if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#')) {
            return matchedStr;
        }

        // 1. 剔除括号和别名，得到初始基准名
        let baseFilename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        if (!baseFilename) return matchedStr;

        // 2. [V8.1 降维打击] 建立多维候选名单，应对各类字典残留
        let candidates = [
            baseFilename,                                          // 原始状态 (可能匹配极特殊别名)
            baseFilename.replace(/\.svg$/i, ''),                   // 剥离单层 svg -> B.excalidraw.md
            baseFilename.replace(/\.md$/i, ''),                    // 剥离单层 md -> B.excalidraw.svg
            baseFilename.replace(/(\.md|\.svg)+$/i, ''),           // 剥离干扰项 -> B.excalidraw
            baseFilename.replace(/(\.md|\.svg|\.excalidraw)+$/i, '') // 极简核心 -> B
        ];

        let realPath = null;
        let matchedCandidate = "";

        // 3. 轰炸式精确查找
        for (let candidate of candidates) {
            if (linkMap[candidate]) {
                realPath = linkMap[candidate];
                matchedCandidate = candidate;
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
                        matchedCandidate = key;
                        break;
                    }
                }
                if (realPath) break;
            }
        }
        
        // 5. 终极回退方案：如果连全站字典都找不到，用最干净的名字强行拼接
        let finalPath = realPath;
        if (!finalPath) {
            let cleanFallback = baseFilename.replace(/(\.md|\.svg)+$/i, '');
            finalPath = `/${cleanFallback}/`;
        }
        
        // 构建雷达：让你在终端清晰看到它命中了哪个候选词
        console.log(`[V8.1 Radar] Target: ${baseFilename} | Found via: ${matchedCandidate || 'Fallback'} | Path: ${finalPath}`);

        return `${keyQuote}link${keyQuote}: ${valQuote}${finalPath}${valQuote}`;
      });

      // ==========================================
      // 阶段 D：注入高性能交互卡片 (继承 V7.2 深度嵌套逻辑)
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