// 从唯一的母版 WreckItKing.html 生成三个投放版本 a/ b/ c/，各自一份 index.html。
//
// 为什么要生成而不是维护三份文件：三版之间只差「前期镜头 + 能不能看到怪」，
// 其余部分必须逐位一致，否则 A/B 对照会被无关改动污染（见
// specs/tasks/playtest-r3-followup.spec.md §1.3）。三份手工副本迟早会漂。
//
// 为什么是子目录而不是 a.html：GitHub 一个仓库只有一个 Pages 站点，
// 子目录是拿到三条互不干扰链接的唯一办法，而 /a/ 比 /a.html 干净。
//
// 每一处替换都是硬断言。母版改动导致靶子对不上时必须整个构建失败——
// 静默产出三份内容相同的包，比构建失败危险得多：那种包发出去了也看不出来。

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SOURCE = "WreckItKing.html";

const VERSIONS = [
    { id: "a", desc: "开场巨龙运镜 + 矿里看得见怪（现状延续）" },
    { id: "b", desc: "压低镜头 + 矿体做实，挖穿之前不知道里面有怪" },
    { id: "c", desc: "a 的规则 + 主城往清空的矿脉扩建" }
];

// 母版里的替换靶子。改母版时如果动到这两处，构建会在这里炸掉，而不是产出坏包。
const VERSION_TOKEN = "const BUILD_VERSION = null;";
// 母版在根目录，vendor/ 是同级；副本在子目录里，要退一层。
const VENDOR_TOKEN = 'src="vendor/';
const VENDOR_COUNT = 2;

function countOf(haystack, needle) {
    return haystack.split(needle).length - 1;
}

function expect(actual, wanted, what) {
    if (actual === wanted) return;
    throw new Error(
        `母版 ${SOURCE} 里 ${what} 出现了 ${actual} 次，预期 ${wanted} 次。\n` +
        `母版结构变了，build-versions.mjs 的替换靶子要跟着改，否则三个版本会构建成一样的东西。`
    );
}

const source = await readFile(join(ROOT, SOURCE), "utf8");

expect(countOf(source, VERSION_TOKEN), 1, `版本靶子 \`${VERSION_TOKEN}\``);
expect(countOf(source, VENDOR_TOKEN), VENDOR_COUNT, `vendor 相对路径 \`${VENDOR_TOKEN}\``);

for (const { id, desc } of VERSIONS) {
    const baked = source
        .replace(VERSION_TOKEN, `const BUILD_VERSION = ${JSON.stringify(id)};`)
        .replaceAll(VENDOR_TOKEN, 'src="../vendor/');

    // 反过来再验一遍产物，替换真的落地了才写盘。
    expect(countOf(baked, `const BUILD_VERSION = "${id}";`), 1, `产物 ${id}/ 的版本常量`);
    expect(countOf(baked, VERSION_TOKEN), 0, `产物 ${id}/ 残留的未替换靶子`);
    expect(countOf(baked, 'src="../vendor/'), VENDOR_COUNT, `产物 ${id}/ 的 vendor 路径`);

    const dir = join(ROOT, id);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), baked);
    // 按字节报，不按 baked.length——那是 UTF-16 码元数，中文注释会让它比实际体积小两成，
    // 而体积是投放要卡的指标之一。
    const kb = (Buffer.byteLength(baked, "utf8") / 1024).toFixed(0);
    console.log(`  ${id}/index.html  ${kb} KB  — ${desc}`);
}

console.log(`\n三版已从 ${SOURCE} 生成。提交后 Pages 地址：`);
for (const { id } of VERSIONS) {
    console.log(`  https://rightdan-leo.github.io/WreckItKing/${id}/`);
}
