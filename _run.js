// 整局回归。挖矿从「按格」改成「按柱」之后，每一击凿掉的格数变了（预算不变但会
// 挖完跨过预算的那一根），所以整局的节奏必须重新对一遍：进度点的时刻、最长空窗、
// 通关时间。顺带每步验两个不变量——没有半截矿柱、没有怪站在实心矿墙里。
window.__run = (limit = 260) => {
    const w = window.__wik;
    window.dispatchEvent(new PointerEvent("pointerdown"));
    w.auto(true);

    const marks = [];
    let t = 0;
    let last = 0;
    let maxGap = 0;
    let hpMin = 100;
    let stubsWorst = 0;
    let solidWorst = 0;

    const key = () => {
        const s = w.state();
        return [
            s.cityLevel, s.pickaxeLevel, s.petEvolved ? 1 : 0,
            s.breached.low, s.breached.mid, s.breached.high,
            w.weapon().level, s.finaleStarted ? 1 : 0, s.ctaOpen ? 1 : 0
        ].join("/");
    };

    let prev = key();
    marks.push({ t: 0, at: prev });

    while (t < limit) {
        w.sim(0.05);
        t += 0.05;

        hpMin = Math.min(hpMin, w.combat().hp);
        for (const ring of w.stubs()) stubsWorst = Math.max(stubsWorst, ring.stubs);
        for (const r of w.rovers()) {
            const a = r.deg * Math.PI / 180;
            solidWorst = Math.max(solidWorst, w.solidDepth(Math.cos(a) * r.radius, Math.sin(a) * r.radius));
        }

        const now = key();
        if (now !== prev) {
            const gap = t - last;
            maxGap = Math.max(maxGap, gap);
            marks.push({ t: +t.toFixed(2), gap: +gap.toFixed(2), at: now });
            prev = now;
            last = t;
        }
        if (w.state().ctaOpen) break;
    }

    return {
        seconds: +t.toFixed(2),
        finished: w.state().ctaOpen,
        maxGap: +maxGap.toFixed(2),
        hpMin,
        stubsWorst,
        solidWorst: +solidWorst.toFixed(3),
        marks
    };
};
"__run ready";
