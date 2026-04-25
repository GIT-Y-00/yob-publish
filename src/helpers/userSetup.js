/* 自定义：src/helpers/userSetup.js */

/**
 * Excalidraw React Injector V9.2 (The Cryptographic Hydration Engine)
 * * 继承 V8.4 的所有完美寻址与分轨架构。
 * * [V9.2 降维打击] 放弃在被破坏的 Markdown 中寻找文本映射。
 * * 启用 Node.js 原生 Crypto 模块，直接计算 /img/user/ 目录下实体图片的 SHA-1 哈希值，
 * * 利用物理加密指纹与 JSON 中的 fileId 进行绝对匹配，生成 Base64 数据强行注入 React！
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // [V9.2 新增] 原生加密计算模块

console.error("=========================================");
console.error("[V9.2 Log] userSetup.js loaded. Cryptographic Hydration ENGAGED.");
console.error("=========================================");

// ==========================================
// [V9.2 核心] 密码学图像指纹库
// ==========================================
let globalCryptoMap = {};
let isCryptoMapBuilt = false;

function buildCryptoImageMap() {
    if (isCryptoMapBuilt) return;
    
    // 直接扫描 Digital Garden 存放上传图片的目标文件夹
    const imgDir = path.join(process.cwd(), 'src', 'site', 'img', 'user');

    function scanDirForHashes(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                scanDirForHashes(fullPath);
            } else {
                // 仅对图像文件进行哈希计算
                if (/\.(png|jpe?g|gif|svg|webp)$/i.test(fullPath)) {
                    try {
                        // 提取文件的物理二进制数据
                        const fileBuffer = fs.readFileSync(fullPath);
                        // 计算标准 SHA-1 哈希值 (严格对应 Excalidraw 的 40位 fileId)
                        const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
                        
                        // 建立绝对匹配：[哈希值] -> [物理路径]
                        globalCryptoMap[hash] = fullPath;
                    } catch (err) {
                        console.error(`无法计算图片哈希: ${fullPath}`, err);
                    }
                }
            }
        }
    }
    
    try {
        scanDirForHashes(imgDir);
        isCryptoMapBuilt = true;
        console.log(`[V9.2 Crypto Registry] 成功建立哈希指纹库，计算了 ${Object.keys(globalCryptoMap).length} 张实体图片的 SHA-1。`);
    } catch (e) {
        console.error("哈希指纹库建立失败:", e);
    }
}


// V8.4 纯净寻址逻辑 (保持不动)
function applyV83Logic(htmlBlock, modeName, linkMap) {
    let processed = htmlBlock;
    const dataRegex = /(["']?)link\1\s*:\s*(["'])(.*?)\2/g;
    
    processed = processed.replace(dataRegex, function(matchedStr, keyQuote, valQuote, innerLink) {
        if (!innerLink || innerLink.startsWith('http') || innerLink.startsWith('#') || innerLink.startsWith('/')) {
            return matchedStr;
        }

        let mdLinkMatch = innerLink.match(/\[([^\]]+)\]\([^)]+\)/);
        let rawTarget = mdLinkMatch ? mdLinkMatch[1] : innerLink;

        let baseFilename = rawTarget.replace(/[\[\]]/g, '').split('|')[0].trim();
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

        return `${keyQuote}link${keyQuote}: ${valQuote}${finalPath}${valQuote}`;
    });

    return processed;
}

function userEleventySetup(eleventyConfig) {
  eleventyConfig.addTransform("fix-excalidraw-links-v9.2", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      
      // 1. 初始化密码学引擎，扫描服务器实体图片
      buildCryptoImageMap();
        
      let fixedContent = content;

      // ==========================================
      // [V9.2 图像榨汁机] 扫描 HTML 找 fileId，通过 SHA-1 匹配并生成 Base64
      // ==========================================
      const fileIdRegex = /"fileId"\s*:\s*"([a-f0-9]{40})"/gi;
      let injectedFiles = {};
      let fMatch;
      
      while ((fMatch = fileIdRegex.exec(fixedContent)) !== null) {
          const fileId = fMatch[1];
          // 如果指纹库中有这个 SHA-1 对应的图片物理路径
          if (globalCryptoMap[fileId] && !injectedFiles[fileId]) {
              const imgPath = globalCryptoMap[fileId];
              
              try {
                  const ext = path.extname(imgPath).toLowerCase().replace('.', '');
                  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'svg' ? 'image/svg+xml' : 'image/png');
                  
                  // 直接读取指纹库验证通过的实体文件，转为 Base64
                  const base64 = fs.readFileSync(imgPath, 'base64');
                  
                  // 组装 Excalidraw 所需的 files 字典
                  injectedFiles[fileId] = {
                      mimeType: mime,
                      id: fileId,
                      dataURL: `data:${mime};base64,${base64}`,
                      created: Date.now(),
                      lastRetrieved: Date.now()
                  };
              } catch (err) {
                  console.error(`无法转换图片为 Base64: ${imgPath}`, err);
              }
          }
      }
      
      const injectedFilesJson = JSON.stringify(injectedFiles);

      // ==========================================
      // 阶段 0：前置毒素清理
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
      // 阶段 B：分轨物理隔离
      // ==========================================
      let embeds = [];
      const embedRegex = /(<a[^>]*class="filename"[^>]*>\s*[^<]+\s*<\/a>(?:(?!<a[^>]*class="filename")[\s\S])*?<div\s+id="[^"]+"\s*><\/div>\s*<script>(?:(?!<\/script>)[\s\S])*?ReactDOM\.render(?:(?!<\/script>)[\s\S])*?<\/script>)/gi;

      fixedContent = fixedContent.replace(embedRegex, function(embedMatch) {
          embeds.push(embedMatch);
          return `__DG_EMBED_BLOCK_${embeds.length - 1}__`;
      });

      fixedContent = applyV83Logic(fixedContent, "情况2-单文件", linkMap);

      for (let i = 0; i < embeds.length; i++) {
          let processedEmbed = applyV83Logic(embeds[i], "情况1-嵌入MD", linkMap);
          fixedContent = fixedContent.replace(`__DG_EMBED_BLOCK_${i}__`, processedEmbed);
      }

      // ==========================================
      // 阶段 C：注入高性能交互卡片 (含加密注水)
      // ==========================================
      const reactInitRegex = /React\.createElement\(\s*ExcalidrawLib\.Excalidraw\s*,\s*\{/;
      
      if (reactInitRegex.test(fixedContent)) {
        fixedContent = fixedContent.replace(
          reactInitRegex,
          `((excalidrawProps) => {
              
            // [V9.2 暴力注水] 将通过 SHA-1 物理验证的 Base64 图片数据强行塞入 React！
            const injectedImgData = ${injectedFilesJson};
            if (excalidrawProps.initialData && Object.keys(injectedImgData).length > 0) {
                excalidrawProps.initialData.files = excalidrawProps.initialData.files || {};
                Object.assign(excalidrawProps.initialData.files, injectedImgData);
            }

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