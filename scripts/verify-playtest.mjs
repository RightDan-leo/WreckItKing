// Run `npm start` first. Uses the real browser and the game's normal update loop.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const session = 'wreckitking-spec-check';
const base = process.env.PLAYTEST_URL || 'http://localhost:9310';
const cli = (...args) => execFileSync('npx', ['--yes', '--package', '@playwright/cli', 'playwright-cli', `-s=${session}`, ...args], {
  encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 180000
});
try {
  cli('open', `${base}/a/index.html?lang=zh`);
  const code = readFileSync(new URL('./playtest-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const output = cli('run-code', code);
  const payload = output.split('### Result\n')[1]?.split('\n###')[0].trim();
  assert.ok(payload, output);
  const runs = JSON.parse(payload);
  mkdirSync('output/playwright', { recursive: true });
  writeFileSync('output/playwright/spec-verification.json', JSON.stringify(runs, null, 2));
  for (const { v, run, initial, errors } of runs) {
    assert.deepEqual(errors, [], `${v}: browser error`);
    assert.equal(run.state.ctaOpen, true, `${v}: never reached CTA`);
    assert.ok(run.maxPen < 1e-5, `${v}: enemy entered solid ore`);
    assert.ok(run.maxSplashHits > 1, `${v}: evolved pet never hit a group`);
    assert.equal(run.audit.wave.left, 30);
    assert.equal(run.audit.wave.right, 30);
    if(v!=='c'){
      assert.equal(run.outpost.built,true);
      assert.equal(run.marks.filter(m=>m.label==='outpost-ready').length,1);
      assert.ok(run.marks.findIndex(m=>m.label==='final-wave')<run.marks.findIndex(m=>m.label==='outpost-ready'));
      assert.ok(run.marks.findIndex(m=>m.label==='outpost-ready')<run.marks.findIndex(m=>m.label==='outpost-funded'));
      assert.equal(run.outpost.subsidy,0);
      assert.equal(run.marks.filter(m=>m.label==='outpost-funded').length,1);
      assert.equal(run.marks.filter(m=>m.label==='outpost-built').length,1);
      assert.ok(run.marks.findIndex(m=>m.label==='outpost-built')<run.marks.findIndex(m=>m.label==='ultimate-unlocked'));
    }
    assert.equal(run.audit.wave.count, 60);
    assert.equal(run.audit.wave.killed, 60);
    assert.equal(run.waits['hatchery:0'].wait, 0);
    assert.ok(run.waits['evolve:10'].wait < 10, `${v}: diamond bottleneck`);
    assert.ok(run.audit.enemyMining.cells > 0 && run.audit.enemyMining.coins > 0);
    assert.equal(initial.variants.opening.active, v === 'a');
    assert.equal(initial.variants.buriedResourcesXray, v === 'b');
    assert.equal(initial.audit.hud.gem, false);
    assert.equal(initial.audit.hud.shard, false);
    if (v === 'b') assert.ok(initial.variants.guards.every(g => !g.visible && g.depthTest));
    if (v !== 'c') assert.deepEqual(run.variants.extensions, []);
    assert.equal(initial.variants.frontier.active, false);
    assert.equal(run.variants.frontier.active, v === 'a');
    if (v === 'a') {
      assert.equal(run.variants.frontier.lowRemaining, 0);
      assert.equal(run.marks.filter(m => m.label === 'frontier-city').length, 1);
    }
    console.log(`${v.toUpperCase()}: CTA ${run.marks.at(-1).at}s, evolve wait ${run.waits['evolve:10'].wait}s, wave 60/60, no wall penetration`);
  }
  const a = runs.find(r => r.v === 'a').run, c = runs.find(r => r.v === 'c').run;
  assert.deepEqual(a.variants.blocks, null);
  assert.equal(c.variants.blocks.fallback, 0, 'C required automatic resource top-up');
  assert.equal(c.variants.blocks.pending, 0);
  assert.ok(c.variants.blocks.districts.every(d => d.built && d.buildings > 0));
  assert.deepEqual(c.marks.filter(m => m.label.startsWith('district-')).map(m => m.label), ['district-1', 'district-2', 'district-3']);
  const source = readFileSync('WreckItKing.html', 'utf8');
  for (const v of ['a', 'b', 'c']) {
    const generated = readFileSync(`${v}/index.html`, 'utf8');
    assert.equal(generated.replace(`const BUILD_VERSION = "${v}";`, 'const BUILD_VERSION = null;').replaceAll('src="../vendor/', 'src="vendor/'), source);
  }
  console.log('C districts built in sequence without resource top-ups; all generated pages match the master.');
  const outpostCode = readFileSync(new URL('./outpost-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const outpostOutput = cli('run-code', outpostCode);
  const outpostPayload = outpostOutput.split('### Result\n')[1]?.split('\n###')[0].trim();
  assert.ok(outpostPayload, outpostOutput);
  writeFileSync('output/playwright/outpost-check.json', outpostPayload);
  console.log('A/B: partial outpost funding, clear-mine construction, service routes and wave-gated free detonation passed.');
  const miningCode = readFileSync(new URL('./enemy-mining-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const miningOutput = cli('run-code', miningCode);
  const miningPayload = miningOutput.split('### Result\n')[1]?.split('\n###')[0].trim();
  assert.ok(miningPayload, miningOutput);
  writeFileSync('output/playwright/enemy-mining-check.json', miningPayload);
  console.log('A/B: circle, fan and line attacks open ore passages; rewards are not duplicated; seal stays intact.');
  const guardCode = readFileSync(new URL('./guard-release-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const guardOutput = cli('run-code', guardCode);
  assert.ok(guardOutput.includes('### Result'), guardOutput);
  console.log('A/B: low and mid guards stay buried at side tunnels and emerge at their own tunnel.');
  const guidanceCode = readFileSync(new URL('./guidance-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const guidanceOutput = cli('run-code', guidanceCode);
  const guidancePayload = guidanceOutput.split('### Result\n')[1]?.split('\n###')[0].trim();
  assert.ok(guidancePayload, guidanceOutput);
  const guidanceRuns = JSON.parse(guidancePayload);
  writeFileSync('output/playwright/guidance-check.json', JSON.stringify(guidanceRuns, null, 2));
  for (const run of guidanceRuns) {
    assert.deepEqual(run.errors, []);
    console.log(`${run.v.toUpperCase()}: missing upgrade material, funded/partial payment, egg prerequisite and reentry guidance passed.`);
  }
  const frontierCode = readFileSync(new URL('./a-frontier-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const frontierOutput = cli('run-code', frontierCode);
  const frontierPayload = frontierOutput.split('### Result\n')[1]?.split('\n###')[0].trim();
  assert.ok(frontierPayload, frontierOutput);
  const frontierRuns = JSON.parse(frontierPayload);
  writeFileSync('output/playwright/a-frontier-check.json', JSON.stringify(frontierRuns, null, 2));
  for (const run of frontierRuns) {
    assert.deepEqual(run.errors, []);
    assert.equal(run.overflow, false);
    assert.equal(run.frontier.active, true);
    console.log(`A ${run.order}: clearance gate, single migration, payment balance and service routes passed.`);
  }
  const ultimateCode = readFileSync(new URL('./a-ultimate-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const ultimateOutput = cli('run-code', ultimateCode);
  const ultimatePayload = ultimateOutput.split('### Result\n')[1]?.split('\n###')[0].trim();
  assert.ok(ultimatePayload, ultimateOutput);
  writeFileSync('output/playwright/a-ultimate-check.json', ultimatePayload);
  console.log('A: evolution donation in city, zero-coin ultimate barrel and single dragon intro passed.');
  const bowCode = readFileSync(new URL('./bow-lifecycle-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const bowOutput = cli('run-code', bowCode);
  const bowPayload = bowOutput.split('### Result\n')[1]?.split('\n###')[0].trim();
  assert.ok(bowPayload, bowOutput);
  writeFileSync('output/playwright/bow-lifecycle-check.json', bowPayload);
  console.log('ABC: first bow display, acquired back pose and real arrow attacks passed.');
  const equipmentCode = readFileSync(new URL('./equipment-upgrade-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const equipmentOutput = cli('run-code', equipmentCode);
  assert.ok(equipmentOutput.includes('### Result'), equipmentOutput);
  console.log('Equipment: four pick silhouettes and mining rates, two bow stages and upgrade showcases passed.');
  const flowCode = readFileSync(new URL('./c-flow-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
  const flowOutput = cli('run-code', flowCode);
  const flowPayload = flowOutput.split('### Result\n')[1]?.split('\n###')[0].trim();
  assert.ok(flowPayload, flowOutput);
  const flows = JSON.parse(flowPayload);
  writeFileSync('output/playwright/c-flow-verification.json', JSON.stringify(flows, null, 2));
  for (const flow of flows) {
    assert.deepEqual(flow.errors, [], `C ${flow.lang}: manual flow browser errors`);
    console.log(`C ${flow.lang}: donation, instant blast, single frontier upgrade, partial balance and free hatch passed.`);
  }
  if (process.env.C_BLOCK_CASES === '1') {
    const scenario = readFileSync(new URL('./c-block-scenario.js', import.meta.url), 'utf8').replaceAll('http://localhost:9310', base);
    const caseOutput = cli('run-code', scenario);
    const cases = JSON.parse(caseOutput.split('### Result\n')[1].split('\n###')[0].trim());
    writeFileSync('output/playwright/c-block-cases.json', JSON.stringify(cases, null, 2));
    for (const c of cases) {
      assert.deepEqual(c.errors, []);
      assert.equal(c.initial.state.coins, 10);
      assert.equal(c.state.ctaOpen, true, `C ${c.seed}/${c.route} blocked`);
      assert.equal(c.blocks.fallback, 0);
      assert.equal(c.blocks.pending, 0);
      // Iterative circle resolution can leave ~1e-6 world units at a tangent.
      // 1e-5 is 0.01 mm at the game's metre scale; retain the actual measured residual.
      assert.ok(c.maxPen < 1e-5 && c.maxPlayerPen < 0.02, 'C collision');
      assert.equal(c.overflow, false);
      assert.deepEqual(c.milestones.map(m => m.stage), [1,2,3,4]);
      for (const m of c.milestones) {
        assert.ok(m.gate.z >= m.blocks.front + 0.8, 'C locked gate bypass');
        if (m.oldGate) {
          assert.ok(Math.abs(m.oldGate.x) < 0.01, 'C old gate blocks street');
          assert.equal(m.oldGate.z, [-18.4,-26.4,-35.5][m.stage-2]);
        }
      }
    }
    console.log('C: four seeded route cases, gated districts and mobile layouts passed.');
  }
} finally {
  cli('close');
}
