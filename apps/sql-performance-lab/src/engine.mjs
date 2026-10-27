import { SCHEMA, DATASET_SEED, DATASET_VERSION, SIZES, MAX_ROWS, seededRandom, validateSelect, validateIndexes, canonicalResult, summarize } from './model.mjs';

export class LabEngine {
  constructor(sqlite3) { this.sqlite3 = sqlite3; this.db = null; this.metadata = null; }
  close() { this.db?.close(); this.db = null; }
  select(sql, bind = []) { return this.db.exec({sql, bind, rowMode:'object', returnValue:'resultRows'}); }
  async seed(size, progress = () => {}) {
    if (!SIZES.includes(size)) throw new Error('Choose a supported dataset size.');
    this.close(); this.db = new this.sqlite3.oo1.DB(':memory:');
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA automatic_index=ON;');
    this.db.exec(SCHEMA);
    const started = performance.now(), rng = seededRandom(), regions = ['South','West','Midwest','Northeast'];
    const customerCount = 2000, products = [], statuses = ['paid','shipped','pending','cancelled'];
    const insertCustomers = this.db.prepare('INSERT INTO customers VALUES (?, ?, ?, ?)');
    const insertProducts = this.db.prepare('INSERT INTO products VALUES (?, ?, ?, ?)');
    const insertOrders = this.db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?)');
    const insertItems = this.db.prepare('INSERT INTO order_items VALUES (?, ?, ?, ?, ?)');
    const insert = (stmt, values) => { stmt.bind(values).step(); stmt.reset(true); };
    this.db.exec('BEGIN');
    try {
      for (let i=1;i<=customerCount;i++) insert(insertCustomers,[i,`Sample Customer ${String(i).padStart(4,'0')}`,`customer${i}@example.invalid`,regions[(i-1)%4]]);
      for (let i=1;i<=120;i++) {
        const price = 499 + Math.floor(rng()*45000); products.push(price);
        insert(insertProducts,[i,`Sample Product ${i}`,['Components','Peripherals','Networking','Storage','Displays','Accessories'][(i-1)%6],price]);
      }
      for (let i=1;i<=size;i++) {
        const customer=1+Math.floor(rng()*customerCount), day=Math.floor(rng()*730), date=new Date(Date.UTC(2025,0,1)+day*86400000).toISOString().slice(0,10);
        const status=statuses[Math.floor(rng()*statuses.length)];
        const p1=1+Math.floor(rng()*120), p2=1+Math.floor(rng()*120), q1=1+Math.floor(rng()*3), q2=1+Math.floor(rng()*3);
        insert(insertOrders,[i,customer,date,status,q1*products[p1-1]+q2*products[p2-1]]);
        insert(insertItems,[i*2-1,i,p1,q1,products[p1-1]]); insert(insertItems,[i*2,i,p2,q2,products[p2-1]]);
        if(i%5000===0) { progress({stage:'Generating fictional records',completed:i,total:size}); await new Promise(resolve => setTimeout(resolve,0)); }
      }
      this.db.exec('COMMIT; ANALYZE;');
    } catch(error) { this.db.exec('ROLLBACK'); throw error; }
    finally { [insertCustomers,insertProducts,insertOrders,insertItems].forEach(stmt=>stmt.finalize()); }
    this.metadata={version:DATASET_VERSION,seed:DATASET_SEED,orders:size,customers:customerCount,products:120,items:size*2,sqliteVersion:this.sqlite3.version.libVersion,generatedMs:performance.now()-started};
    return this.metadata;
  }
  run(sql) {
    const query=validateSelect(sql), started=performance.now(), stmt=this.db.prepare(query);
    try {
      if(!this.sqlite3.capi.sqlite3_stmt_readonly(stmt.pointer)) throw new Error('Only read-only queries can run in this editor.');
      const columns=stmt.getColumnNames(), rows=[];
      if(columns.length>100) throw new Error('Keep query results to 100 columns or fewer.');
      if(stmt.parameterCount) throw new Error('Use literal sample values rather than unbound parameters.');
      while(stmt.step()) {
        if(rows.length===MAX_ROWS) throw new Error(`Query exceeds ${MAX_ROWS.toLocaleString()} result rows. Add a LIMIT or aggregate the results.`);
        const row=stmt.get([]);
        if(row.some(v=>typeof v==='string'&&v.length>12000)) throw new Error('A text result exceeds 12,000 characters. Use substr() to return a smaller value.');
        if(row.some(v=>v instanceof Uint8Array)) throw new Error('Binary result values are outside this lab. Select text or numeric values.');
        if(row.some(v=>typeof v==='bigint' || typeof v==='number' && (!Number.isFinite(v) || Number.isInteger(v) && !Number.isSafeInteger(v)))) throw new Error('A result exceeds JavaScript’s precise numeric range. Cast large integers to TEXT.');
        rows.push(row);
      }
      return {columns,rows,elapsedMs:performance.now()-started};
    } finally { stmt.finalize(); }
  }
  clearIndexes() {
    for(const row of this.select("SELECT name FROM sqlite_schema WHERE type='index' AND name LIKE 'idx_%'")) this.db.exec(`DROP INDEX "${row.name.replaceAll('"','""')}"`);
    this.db.exec('ANALYZE');
  }
  applyIndexes(parts) { this.clearIndexes(); const start=performance.now(); for(const sql of parts) this.db.exec(sql); this.db.exec('ANALYZE'); return performance.now()-start; }
  plan(sql) { return this.select('EXPLAIN QUERY PLAN '+validateSelect(sql)); }
  storageBytes() { return (this.select('PRAGMA page_count')[0].page_count-this.select('PRAGMA freelist_count')[0].freelist_count)*this.select('PRAGMA page_size')[0].page_size; }
  async digest(text) { const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)); return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join(''); }
  async compare(request, progress = () => {}) {
    if(!this.metadata) throw new Error('Generate the sample database first.');
    const baselineSQL=validateSelect(request.baseline), candidateSQL=validateSelect(request.candidate), parts=validateIndexes(request.indexes);
    const samples={baseline:[],candidate:[]}, captured={}, plans={}, builds=[];
    let baseBytes=0,candidateBytes=0;
    try {
      for(let round=0;round<7;round++) {
        const order=round%2===0?['baseline','candidate']:['candidate','baseline'];
        for(const variant of order) {
          progress({stage:`Measuring ${variant}`,completed:round*2+order.indexOf(variant),total:14});
          if(variant==='baseline') this.clearIndexes(); else builds.push(this.applyIndexes(parts));
          const sql=variant==='baseline'?baselineSQL:candidateSQL;
          // One unrecorded warm-up per sample after rebuilding the schema. Index
          // creation and ANALYZE are intentionally outside query execution timing.
          this.run(sql);
          const result=this.run(sql); samples[variant].push(result.elapsedMs);
          if(!captured[variant]) { captured[variant]=result; plans[variant]=this.plan(sql); if(variant==='baseline')baseBytes=this.storageBytes();else candidateBytes=this.storageBytes(); }
          else if(canonicalResult(result)!==canonicalResult(captured[variant])) throw new Error('Results changed between repetitions. Avoid random(), current time, and other nondeterministic expressions.');
          await new Promise(resolve=>setTimeout(resolve,0));
        }
      }
      const full={baseline:canonicalResult(captured.baseline),candidate:canonicalResult(captured.candidate)};
      const variant=async name=>({sql:name==='baseline'?baselineSQL:candidateSQL,plan:plans[name],columns:captured[name].columns,preview:captured[name].rows.slice(0,100),rowCount:captured[name].rows.length,resultHash:await this.digest(full[name]),timing:summarize(samples[name])});
      return {formatVersion:1,id:crypto.randomUUID(),title:String(request.title||'Custom experiment').slice(0,120),experimentId:request.experimentId||'custom',createdAt:new Date().toISOString(),dataset:{...this.metadata},baseline:await variant('baseline'),candidate:await variant('candidate'),indexSQL:parts.join(';\n')+(parts.length?';':''),equivalent:full.baseline===full.candidate,storage:{baselineBytes:baseBytes,candidateBytes,indexBuildMedianMs:summarize(builds).median},method:{samples:7,warmupsPerSample:1,order:'Alternating baseline/candidate pairs',resultComparison:'Exact columns and typed row multiset, ignoring row order; duplicates retained',timingScope:'Prepare, execute, and materialize every result row; excludes index creation, ANALYZE, hashing, rendering, and worker messages',cache:'Warmed in-memory connection; no cold-disk or production measurements'}};
    } finally { this.clearIndexes(); }
  }
  async inspect(sql) {
    if(!this.metadata) throw new Error('Generate the sample database first.');
    this.clearIndexes();
    const result=this.run(sql);
    return {columns:result.columns,preview:result.rows.slice(0,100),rowCount:result.rows.length,elapsedMs:result.elapsedMs,plan:this.plan(sql)};
  }
}
