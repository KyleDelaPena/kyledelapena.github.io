import test from 'node:test';
import assert from 'node:assert/strict';
import init from '../vendor/node.mjs';
import { LabEngine } from '../src/engine.mjs';
import { EXPERIMENTS, validHistory, DATASET_SEED } from '../src/model.mjs';
import { reportHTML } from '../src/report.mjs';

const sqlite=await init({print:()=>{},printErr:()=>{}});
const engine=new LabEngine(sqlite);
await engine.seed(10000);
test.after(()=>engine.close());

test('the real SQLite dataset has valid relationships, exact totals and expected counts',()=>{
  assert.equal(engine.select('SELECT COUNT(*) AS n FROM orders')[0].n,10000);
  assert.equal(engine.select('SELECT COUNT(*) AS n FROM customers')[0].n,2000);
  assert.equal(engine.select('SELECT COUNT(*) AS n FROM order_items')[0].n,20000);
  assert.deepEqual(engine.select('PRAGMA foreign_key_check'),[]);
  assert.equal(engine.select('SELECT COUNT(*) AS n FROM orders o JOIN (SELECT order_id,SUM(quantity*unit_price_cents) AS n FROM order_items GROUP BY order_id) i ON o.order_id=i.order_id WHERE o.total_cents<>i.n')[0].n,0);
});
test('rebuilding a chosen dataset yields the same sample records',async()=>{const before=engine.run('SELECT * FROM orders ORDER BY order_id LIMIT 100').rows;await engine.seed(10000);assert.deepEqual(engine.run('SELECT * FROM orders ORDER BY order_id LIMIT 100').rows,before);assert.equal(engine.metadata.seed,DATASET_SEED);});
test('query limits, unbound parameters, binary output and mutating WITH statements are rejected',()=>{
  assert.throws(()=>engine.run('SELECT * FROM order_items'),/exceeds/);
  assert.throws(()=>engine.run('SELECT ? AS n'),/literal sample/);
  assert.throws(()=>engine.run("SELECT x'1234' AS n"),/Binary/);
  assert.throws(()=>engine.run("SELECT printf('%13000s','x') AS n"),/12,000/);
  assert.throws(()=>engine.run('WITH x AS (SELECT 1) DELETE FROM orders'),/read-only/);
  assert.equal(engine.select('SELECT COUNT(*) AS n FROM orders')[0].n,10000);
});
for(const experiment of EXPERIMENTS)test(`${experiment.title}: actual plans, exact result checks, 14 timings, clean schema`,async()=>{
  const report=await engine.compare({title:experiment.title,experimentId:experiment.id,baseline:experiment.baseline,candidate:experiment.candidate,indexes:experiment.indexes});
  assert.equal(report.equivalent,true);assert.equal(report.baseline.resultHash,report.candidate.resultHash);
  assert.equal(report.baseline.timing.samples.length,7);assert.equal(report.candidate.timing.samples.length,7);
  assert.ok(report.baseline.timing.samples.every(n=>n>=0));assert.ok(report.candidate.plan.some(p=>p.detail.includes('idx_')));
  assert.ok(report.storage.candidateBytes>=report.storage.baselineBytes);assert.ok(report.storage.indexBuildMedianMs>0);
  assert.equal(validHistory([report]).length,1);
  assert.equal(engine.select("SELECT COUNT(*) AS n FROM sqlite_schema WHERE type='index' AND name LIKE 'idx_%'")[0].n,0);
  const html=reportHTML(report);assert.ok(html.includes('PASS'));assert.ok(html.includes(report.baseline.resultHash));assert.ok(html.includes('Print / save as PDF'));
});
test('a non-equivalent query gets a failed result check',async()=>{const report=await engine.compare({title:'Mismatch',baseline:'SELECT 1 AS n',candidate:'SELECT 2 AS n',indexes:''});assert.equal(report.equivalent,false);assert.notEqual(report.baseline.resultHash,report.candidate.resultHash);assert.ok(reportHTML(report).includes('FAIL'));
});
test('comparison errors remove candidate indexes and preserve all sample records',async()=>{await assert.rejects(engine.compare({baseline:'SELECT 1 AS n',candidate:'SELECT missing FROM orders',indexes:'CREATE INDEX idx_error ON orders(status);'}));assert.equal(engine.select("SELECT COUNT(*) AS n FROM sqlite_schema WHERE type='index' AND name LIKE 'idx_%'")[0].n,0);assert.equal(engine.select('SELECT COUNT(*) AS n FROM orders')[0].n,10000);});
test('nondeterministic query outputs cannot be presented as a stable comparison',async()=>{await assert.rejects(engine.compare({baseline:'SELECT random() AS n',candidate:'SELECT random() AS n',indexes:''}),/changed between repetitions|precise numeric/);});
test('report exports escape edited SQL and result data',async()=>{const report=await engine.compare({title:'<script>alert(1)</script>',baseline:"SELECT '<img src=x onerror=alert(1)>' AS value",candidate:"SELECT '<img src=x onerror=alert(1)>' AS value",indexes:''});const html=reportHTML(report);assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('<script>alert'));assert.ok(html.includes('&lt;img'));});
test('invalid dataset sizes are rejected before replacing a loaded database',async()=>{await assert.rejects(engine.seed(123));assert.equal(engine.select('SELECT COUNT(*) AS n FROM orders')[0].n,10000);});
