// 四种打法的对括决斗：站桩硬吃 / 纯风筝 / 贴身躲避 / 中程+侧移。
//
// 每局开打前做两件事，缺一件结果就不可比：
//   w.heal()          血量只降不升（见 damagePlayer），不回满的话第二局是从上一局
//                     打剩的血开始的——踩过：先跑风筝把血打到下限 15，紧接着跑站桩
//                     就报出「掉血 0」。
//   w.tp(...)         把人放到守卫身边固定距离上再开表。不然计时里混进了几十米的
//                     赶路时间，风筝那局因为一直在后退还会赶得更久，看上去像是
//                     「风筝更慢」，其实慢的是路上。
(() => {
    const w = window.__wik;
    window.dispatchEvent(new PointerEvent("pointerdown"));
    w.auto(false);

    const START_GAP = 1.2;

    function guardRange(tier) {
        const t = w.tune().ORE_TIERS[tier].monster;
        return t.attackRange;
    }

    // 躲避：预警一亮就出圈。
    //   圆形 / 扇形 → 背对预警中心跑
    //   直线       → 垂直于 facing 侧移。往后退是躲不掉的：长条有 9.5 ~ 11 米长，
    //                而且现在会按玩家距离和后退量动态加长（见 chargeRetreatCover）。
    function dodgeMove(hazards, p, gx, gz) {
        const live = hazards.filter(h => h.inside);
        if (live.length === 0) return null;
        const h = live[0];
        if (h.kind === "line" && h.facing !== undefined) {
            const rad = h.facing * Math.PI / 180;
            return [Math.cos(rad), -Math.sin(rad)];
        }
        const dx = p[0] - h.at[0];
        const dz = p[1] - h.at[1];
        const len = Math.hypot(dx, dz);
        if (len < 0.05) {
            const away = Math.hypot(p[0] - gx, p[1] - gz) || 1;
            return [(p[0] - gx) / away, (p[1] - gz) / away];
        }
        return [dx / len, dz / len];
    }

    window.__duel = (guardId, policy, keepGap) => {
        const g0 = w.guards().find(x => x.id === guardId);
        if (!g0 || !g0.pos || g0.dead) return { error: "no live guard", guardId };
        const keep = guardRange(g0.tier) + (keepGap || 0);

        // 先站到位再回血再开表。tp 之后跑一帧让怪物的感知更新到新位置。
        const spawn = policy === "tank" || policy === "dodge" ? 2.2 : keep;
        w.tp(g0.pos[0] + spawn + START_GAP, g0.pos[1]);
        w.heal();
        w.sim(1 / 60);

        const startHp = w.combat().hp;
        let t = 0;
        const step = 1 / 60;
        let charges = 0;
        let lineWasUp = false;
        let dodgeFrames = 0;
        let insideFrames = 0;
        let hits = 0;
        let lastHp = startHp;

        while (t < 120) {
            const g = w.guards().find(x => x.id === guardId);
            if (!g || g.dead || !g.pos) break;
            const p = w.state().pos;
            const dx = g.pos[0] - p[0];
            const dz = g.pos[1] - p[1];
            const d = Math.hypot(dx, dz) || 1;
            const combat = w.combat();
            let mx = 0;
            let mz = 0;

            if (policy === "tank") {
                if (d > 1.7) { mx = dx / d; mz = dz / d; }
            } else if (policy === "kite") {
                if (d < keep - 0.15) { mx = -dx / d; mz = -dz / d; }
                else if (d > keep + 0.35) { mx = dx / d; mz = dz / d; }
            } else if (policy === "dodge") {
                const away = dodgeMove(combat.hazards, p, g.pos[0], g.pos[1]);
                if (away) { mx = away[0]; mz = away[1]; dodgeFrames++; }
                else if (d > 2.6) { mx = dx / d; mz = dz / d; }
            } else {
                // both：守住中程，但预警一亮就侧移，而不是继续往后退。
                const away = dodgeMove(combat.hazards, p, g.pos[0], g.pos[1]);
                if (away) { mx = away[0]; mz = away[1]; dodgeFrames++; }
                else if (d < keep - 0.15) { mx = -dx / d; mz = -dz / d; }
                else if (d > keep + 0.35) { mx = dx / d; mz = dz / d; }
            }

            if (combat.hazards.some(h => h.inside)) insideFrames++;
            const lineUp = combat.hazards.some(h => h.kind === "line");
            if (lineUp && !lineWasUp) charges++;
            lineWasUp = lineUp;
            if (combat.hp < lastHp - 0.01) hits++;
            lastHp = combat.hp;

            w.walk(mx, mz, step);
            t += step;
        }

        const after = w.guards().find(x => x.id === guardId);
        return {
            policy,
            keep: Number(keep.toFixed(1)),
            killed: !after || after.dead,
            seconds: Number(t.toFixed(2)),
            hpLost: Number((startHp - w.combat().hp).toFixed(1)),
            hits,
            charges,
            insideFrames,
            dodgeFrames
        };
    };

    // 把矿全挖开，守卫才会出土；再跑几帧让它们站定。
    w.mineAll("low");
    w.mineAll("mid");
    w.mineAll("high");
    w.sim(0.4);
    return JSON.stringify({
        ready: true,
        engageRange: Number((w.weapon().reach + 1.4).toFixed(2)),
        weapon: w.weapon(),
        guards: w.guards().filter(g => g.revealed && !g.dead).map(g => ({ id: g.id, tier: g.tier, hp: g.hp }))
    });
})();
