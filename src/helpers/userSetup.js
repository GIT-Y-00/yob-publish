/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V8.3 (The Split-Track Ecosystem)
 * * 继承 V8.2 的高精度多维寻址逻辑。
 * * 继承 V8.2.1 的【分轨物理隔离】架构。
 * * [V8.3 核心破局] 引入阶段0的“前置毒素清理” (Pre-Healer)，在分轨前彻底铲平错误注入在 JSON 属性内的 HTML/Script 巨型嵌块，根治主画板的语法白屏崩溃。
 */

console.error("=========================================");
console.error("[V8.3 Log] userSetup.js loaded. Split-Track Ecosystem ENGAGED.");
console.error("=========================================");

// 核心处理逻辑 (V8.2 原汁原味的完美寻址)
function applyV83Logic(htmlBlock, modeName, linkMap) {
    let processed = htmlBlock;

    const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
    processed = processed.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
        if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#') || innerLink.startsWith('/')) {
            return matchedStr;
        }

        let baseFilename = innerLink.replace(/[\[\]]/g, '').split('|')[0].trim();
        if (!baseFilename) return matchedStr;

        let candidates = [
            baseFilename,                                          
            baseFilename.replace(/\.svg$/i, ''),                   
            baseFilename.replace(/\.md$/i, ''),                    
            baseFilename.replace(/(\.md|\.svg)+$/i, ''),           
            baseFilename.replace(/(\.md|\.svg|\.excalidraw)+$/i, '') 
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

        console.log(`[${modeName}] Link 寻址成功: ${baseFilename} ---> ${finalPath}`);
        return `${keyQuote}link${keyQuote}: ${valQuote}${finalPath}${valQuote}`;
    });

    return processed;
}

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v8.3", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      let fixedContent = content;

      // ==========================================
      // 阶段 0：前置毒素清理 (Pre-Healer) - V8.3 核心
      // 匹配被错误注入 JSON 键值对中的 HTML 块（无论是纯 <a> 还是带着 <script> 的怪兽）
      // 将其强行压扁成纯文本，确保 JSON 语法安全，同时防止分轨引擎误捕获 JSON 内部数据！
      // ==========================================
      fixedContent = fixedContent.replace(/"(\w+)"\s*:\s*"(<a\b[\s\S]*?(?:<\/a>|<\/script>))"/gi, function(match, key, htmlChunk) {
          let textMatch = htmlChunk.match(/>([^<]+)<\/a>/i);
          let cleanText = textMatch ? textMatch[1].trim() : "";
          return `"${key}": "${cleanText}"`;
      });


      // ==========================================
      // 阶段 A：路径雷达与免疫清洗
      // ==========================================
      const linkMap = {};
      const anchorRegex = /<a[^>]*href=["'](\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      
      while ((match = anchorRegex.exec(content)) !== null) {
        const href = match[1];
        if (href.includes('404')) continue;
        
        const text = match[2].replace(/<[^>]+>/g, '').trim(); 
        if (text) linkMap[text] = href; 
        
        const parts = href.split('/').filter(p => p);
        if (parts.length > 0) {
           linkMap[decodeURIComponent(parts[parts.length - 1])] = href;
        }
      }

      // ==========================================
      // 阶段 B：分轨物理隔离 (Split Architecture)
      // ==========================================
      let embeds = [];
      // 此时因为阶段 0 的清理，这里的正则只会捕获到真正存在于 MD 正文流中的嵌入块
      const embedRegex = /(<a[^>]*class="filename"[^>]*>\s*[^<]+\s*<\/a>(?:(?!<a[^>]*class="filename")[\s\S])*?<div\s+id="[^"]+"\s*><\/div>\s*<script>(?:(?!<\/script>)[\s\S])*?ReactDOM\.render(?:(?!<\/script>)[\s\S])*?<\/script>)/gi;

      fixedContent = fixedContent.replace(embedRegex, function(embedMatch) {
          embeds.push(embedMatch);
          return `__DG_EMBED_BLOCK_${embeds.length - 1}__`;
      });

      // 处理情况 2 (单文件区/已净化的主干 JSON)
      fixedContent = applyV83Logic(fixedContent, "情况2-单文件", linkMap);

      // 处理情况 1 (MD 嵌入区)
      for (let i = 0; i < embeds.length; i++) {
          let processedEmbed = applyV83Logic(embeds[i], "情况1-嵌入MD", linkMap);
          fixedContent = fixedContent.replace(`__DG_EMBED_BLOCK_${i}__`, processedEmbed);
      }

      // ==========================================
      // 阶段 C：注入高性能交互卡片
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