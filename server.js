// 本地开发服务器。除了发静态文件，还多一个 POST /__save：把调参面板里拖出来的数值
// 写回 WreckItKing.html 的源码。
//
// 为什么不用 `npx serve`：
//   1. 它只读不写，面板的「保存到文件」没有落点。
//   2. 它会把 /WreckItKing.html?econ=gem 重定向成 /WreckItKing，把查询串一起丢掉——
//      两版切换的链接因此一直得写成不带 .html 的形式。这里两种路径都直接发，不重定向。
//
// 写回的做法是「定位到那一个数字，只换它」，不是重新生成整份配置。表里那些解释「为什么
// 是这个数」的注释比数值本身难重建，整份覆盖会把它们冲掉。

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 9310;
const SOURCE = path.join(ROOT, "WreckItKing.html");
const MAX_BODY = 256 * 1024;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
};

// ── 源码定位 ──────────────────────────────────────────────────────────────
//
// 不能拿 `cellsPerCoin:\s*[\d.]+` 直接全局替换：这个键在四层矿里各出现一次，
// hardness、hp、drop 同理。必须先钻进 ORE_TIERS → low 这一层，再在它的直接子项里找。
//
// 扫描器要认字符串和注释。这个文件的注释是中文散文，里面出现过成对和不成对的括号，
// 按裸文本数深度会数歪，一歪就可能改到别的块里去。

function skipString(src, index) {
    const quote = src[index];
    let i = index + 1;
    while (i < src.length) {
        if (src[i] === "\\") {
            i += 2;
            continue;
        }
        if (src[i] === quote) return i + 1;
        i++;
    }
    return src.length;
}

// 列出一个对象 / 数组字面量的直接子项，每项给出键名和值的字符区间。
function childEntries(src, openIndex) {
    const isArray = src[openIndex] === "[";
    const closer = isArray ? "]" : "}";
    const entries = [];
    let i = openIndex + 1;
    let depth = 0;
    let arrayIndex = 0;
    let pendingKey = null;
    let valueStart = -1;

    const flush = end => {
        if (valueStart < 0) return;
        let stop = end;
        while (stop > valueStart && /\s/.test(src[stop - 1])) stop--;
        if (stop > valueStart) {
            entries.push({ key: isArray ? String(arrayIndex++) : pendingKey, start: valueStart, end: stop });
        }
        valueStart = -1;
        pendingKey = null;
    };

    while (i < src.length) {
        const ch = src[i];

        if (ch === "/" && src[i + 1] === "/") {
            const nl = src.indexOf("\n", i);
            i = nl < 0 ? src.length : nl + 1;
            continue;
        }
        if (ch === "/" && src[i + 1] === "*") {
            const stop = src.indexOf("*/", i + 2);
            i = stop < 0 ? src.length : stop + 2;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") {
            i = skipString(src, i);
            continue;
        }

        if (depth > 0) {
            if (ch === "{" || ch === "[" || ch === "(") depth++;
            else if (ch === "}" || ch === "]" || ch === ")") depth--;
            i++;
            continue;
        }

        if (ch === closer) {
            flush(i);
            return { entries, end: i };
        }
        if (ch === "{" || ch === "[" || ch === "(") {
            if (valueStart < 0) valueStart = i;
            depth++;
            i++;
            continue;
        }
        if (ch === ",") {
            flush(i);
            i++;
            continue;
        }
        if (ch === ":" && !isArray && valueStart < 0) {
            i++;
            while (i < src.length && /\s/.test(src[i])) i++;
            valueStart = i;
            continue;
        }
        if (!isArray && valueStart < 0 && /[A-Za-z_$]/.test(ch)) {
            let j = i;
            while (j < src.length && /[\w$]/.test(src[j])) j++;
            pendingKey = src.slice(i, j);
            i = j;
            continue;
        }
        if (isArray && valueStart < 0 && !/\s/.test(ch)) valueStart = i;
        i++;
    }
    throw new Error("字面量没有闭合");
}

function locateValue(src, dottedPath) {
    const keys = dottedPath.split(".");
    const root = keys.shift();
    if (!/^[A-Z][A-Z0-9_]*$/.test(root)) throw new Error(`根表名不合法：${root}`);
    const decl = new RegExp(`\\bconst\\s+${root}\\s*=\\s*`).exec(src);
    if (!decl) throw new Error(`源码里找不到 const ${root}`);

    let cursor = decl.index + decl[0].length;
    if (src[cursor] !== "{" && src[cursor] !== "[") throw new Error(`${root} 不是对象或数组字面量`);

    let span = null;
    for (const key of keys) {
        const { entries } = childEntries(src, cursor);
        const hit = entries.find(entry => entry.key === key);
        if (!hit) throw new Error(`${dottedPath}：在上一层里找不到 ${key}`);
        span = hit;
        cursor = hit.start;
    }
    if (!span) throw new Error(`${dottedPath} 没有指向具体字段`);
    return span;
}

function applyOverrides(src, overrides) {
    const applied = [];
    Object.keys(overrides).forEach(dottedPath => {
        const value = overrides[dottedPath];
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`${dottedPath} 的值不是有限数字`);
        }
        const span = locateValue(src, dottedPath);
        const before = src.slice(span.start, span.end);
        // 只改纯数字。命中的要是个表达式或对象，说明路径解析歪了，宁可报错也不能写下去。
        if (!/^-?\d+(\.\d+)?$/.test(before)) {
            throw new Error(`${dottedPath} 当前是「${before}」，不是纯数字，拒绝改写`);
        }
        const after = String(value);
        src = src.slice(0, span.start) + after + src.slice(span.end);
        applied.push({ path: dottedPath, before, after });
    });

    // 回读校验：改完再定位一次，确认每一项都是新值。位置是按字符偏移算的，前一项的
    // 长度变化会推后后面所有项——这一步就是用来抓这种错位的。
    applied.forEach(item => {
        const span = locateValue(src, item.path);
        const now = src.slice(span.start, span.end);
        if (now !== item.after) throw new Error(`${item.path} 回读是「${now}」，期望「${item.after}」`);
    });

    return { src, applied };
}

// ── HTTP ──────────────────────────────────────────────────────────────────

function sendJson(res, status, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(body);
}

// 只认本机来的请求。这台服务器绑的是 0.0.0.0（同事要能从内网点进来玩），
// 而 /__save 会直接改写 WreckItKing.html——没有这道闸，任何能访问到这个端口的人
// 打开调参面板拖两下、点「保存到文件」，就把源码改了。
function isLoopback(req) {
    const address = req.socket.remoteAddress || "";
    return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function handleSave(req, res) {
    if (!isLoopback(req)) {
        console.warn(`[save] 拒绝非本机请求：${req.socket.remoteAddress}`);
        return sendJson(res, 403, { ok: false, error: "调参保存只允许本机操作" });
    }
    let body = "";
    let tooBig = false;
    req.on("data", chunk => {
        body += chunk;
        if (body.length > MAX_BODY) {
            tooBig = true;
            req.destroy();
        }
    });
    req.on("end", () => {
        if (tooBig) return sendJson(res, 413, { ok: false, error: "请求体过大" });
        let overrides;
        try {
            overrides = (JSON.parse(body) || {}).overrides;
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: "JSON 解析失败" });
        }
        if (!overrides || typeof overrides !== "object" || !Object.keys(overrides).length) {
            return sendJson(res, 400, { ok: false, error: "没有要写入的改动" });
        }
        if (Object.keys(overrides).length > 200) {
            return sendJson(res, 400, { ok: false, error: "改动项过多" });
        }

        try {
            const original = fs.readFileSync(SOURCE, "utf8");
            const { src, applied } = applyOverrides(original, overrides);
            // 备份只留最近一次。写坏了能立刻退回去，但不需要攒一堆历史——版本管理是 git 的事。
            fs.writeFileSync(SOURCE + ".bak", original, "utf8");
            fs.writeFileSync(SOURCE, src, "utf8");
            console.log(`[save] 写入 ${applied.length} 项`);
            applied.forEach(item => console.log(`        ${item.path}: ${item.before} -> ${item.after}`));
            sendJson(res, 200, { ok: true, applied });
        } catch (err) {
            console.error("[save] 失败:", err.message);
            sendJson(res, 500, { ok: false, error: err.message });
        }
    });
}

function resolveTarget(urlPath) {
    const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
    const full = path.resolve(ROOT, "." + clean);
    if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;

    let target = full;
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    // 不带扩展名的路径补 .html，而且是直接发文件、不发 302——重定向会把 ?econ= 丢掉。
    else if (!fs.existsSync(target) && fs.existsSync(target + ".html")) target += ".html";
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return null;
    return target;
}

function serveStatic(req, res) {
    const target = resolveTarget(req.url);
    if (!target) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404");
        return;
    }
    const type = MIME[path.extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(target).pipe(res);
}

http.createServer((req, res) => {
    if (req.method === "POST" && req.url.split("?")[0] === "/__save") return handleSave(req, res);
    if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405).end();
        return;
    }
    serveStatic(req, res);
}).listen(PORT, () => {
    console.log(`New Wreck It King  ->  http://localhost:${PORT}/WreckItKing`);
    console.log(`调参面板           ->  http://localhost:${PORT}/WreckItKing?tune`);
    console.log(`保存端点           ->  POST /__save（写回 WreckItKing.html，留一份 .bak）`);
});
