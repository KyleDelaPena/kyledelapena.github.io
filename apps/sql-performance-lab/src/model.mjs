export const DATASET_VERSION = 'retail-v1';
export const DATASET_SEED = 74219;
export const SIZES = [10000, 50000, 150000];
export const DEFAULT_SIZE = 50000;
export const STORAGE_KEY = 'kyle-portfolio:sql-performance-lab:history:v1';
export const MAX_ROWS = 10000;
export const SCHEMA = `CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL, email TEXT NOT NULL,
  region TEXT NOT NULL
);
CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL, category TEXT NOT NULL,
  price_cents INTEGER NOT NULL
);
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  order_date TEXT NOT NULL, status TEXT NOT NULL,
  total_cents INTEGER NOT NULL
);
CREATE TABLE order_items (
  item_id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL
);`;

export const EXPERIMENTS = [
  {
    id: 'customer', number: '01', title: 'Find customer orders',
    skill: 'Composite indexes', level: 'Start here',
    summary: 'A support agent needs one customer’s shipped orders, newest first.',
    lesson: 'Put equality filters first in a composite index, then the sort columns. Compare a full orders scan with an indexed search, and check whether the temporary sort disappears.',
    baseline: `SELECT order_id, order_date, total_cents
FROM orders
WHERE customer_id = 42 AND status = 'shipped'
ORDER BY order_date DESC, order_id DESC;`,
    candidate: `SELECT order_id, order_date, total_cents
FROM orders
WHERE customer_id = 42 AND status = 'shipped'
ORDER BY order_date DESC, order_id DESC;`,
    indexes: 'CREATE INDEX idx_customer_status_date ON orders (customer_id, status, order_date DESC, order_id DESC);',
    tradeoff: 'This index adds storage and work to inserts and updates. A selective lookup is a good fit; a report reading most orders may still favor a scan.',
  },
  {
    id: 'date', number: '02', title: 'Make a date filter searchable',
    skill: 'Query rewrites', level: 'Intermediate',
    summary: 'Finance wants the count and value of paid orders in July 2026.',
    lesson: 'A function around order_date prevents an ordinary index range on that column. A half-open date range keeps the same month boundaries and lets SQLite search the date portion of the index.',
    baseline: `SELECT COUNT(*) AS order_count,
       SUM(total_cents) AS revenue_cents
FROM orders
WHERE substr(order_date, 1, 7) = '2026-07'
  AND status = 'paid';`,
    candidate: `SELECT COUNT(*) AS order_count,
       SUM(total_cents) AS revenue_cents
FROM orders
WHERE order_date >= '2026-07-01'
  AND order_date < '2026-08-01'
  AND status = 'paid';`,
    indexes: 'CREATE INDEX idx_status_date_total ON orders (status, order_date, total_cents);',
    tradeoff: 'This experiment changes both SQL and indexing. To isolate the rewrite, run the original SQL on both sides with this same candidate index, then compare the two candidate plans. Dates here are normalized ISO text, not timezone-aware timestamps.',
  },
  {
    id: 'join', number: '03', title: 'Trace a reporting join',
    skill: 'Join access paths', level: 'Intermediate',
    summary: 'Operations needs shipped revenue by product category for one month.',
    lesson: 'Filter the orders early, then find their line items by order_id. Inspect every plan node: an index can improve a join while grouping still needs a temporary B-tree.',
    baseline: `SELECT p.category, COUNT(*) AS line_items,
       SUM(i.quantity * i.unit_price_cents) AS revenue_cents
FROM orders AS o
JOIN order_items AS i ON i.order_id = o.order_id
JOIN products AS p ON p.product_id = i.product_id
WHERE o.status = 'shipped'
  AND o.order_date >= '2026-07-01'
  AND o.order_date < '2026-08-01'
GROUP BY p.category
ORDER BY p.category;`,
    candidate: `SELECT p.category, COUNT(*) AS line_items,
       SUM(i.quantity * i.unit_price_cents) AS revenue_cents
FROM orders AS o
JOIN order_items AS i ON i.order_id = o.order_id
JOIN products AS p ON p.product_id = i.product_id
WHERE o.status = 'shipped'
  AND o.order_date >= '2026-07-01'
  AND o.order_date < '2026-08-01'
GROUP BY p.category
ORDER BY p.category;`,
    indexes: `CREATE INDEX idx_orders_status_date ON orders (status, order_date, order_id);
CREATE INDEX idx_items_order ON order_items (order_id, product_id, quantity, unit_price_cents);`,
    tradeoff: 'Two covering indexes duplicate more columns than narrow indexes. Their benefit depends on data distribution and write volume. This lab measures reads and index creation, not a production workload.',
  },
];

export function seededRandom(seed = DATASET_SEED) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}

// A small lexer splits SQL without treating quoted strings or comments as statements.
// SQLite still compiles and checks read-only status before any user SELECT executes.
export function statements(sql) {
  if (typeof sql !== 'string' || sql.length > 12000) throw new Error('Keep SQL under 12,000 characters.');
  const parts = []; let part = '', quote = '', comment = '';
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i], next = sql[i + 1];
    if (comment === 'line') { if (c === '\n') { comment = ''; part += ' '; } continue; }
    if (comment === 'block') { if (c === '*' && next === '/') { comment = ''; i++; part += ' '; } continue; }
    if (quote) {
      part += c;
      if (c === quote) { if (next === quote && quote !== ']') { part += next; i++; } else quote = ''; }
      continue;
    }
    if (c === '-' && next === '-') { comment = 'line'; i++; continue; }
    if (c === '/' && next === '*') { comment = 'block'; i++; continue; }
    if (c === "'" || c === '"' || c === '`' || c === '[') { quote = c === '[' ? ']' : c; part += c; continue; }
    if (c === ';') { if (part.trim()) parts.push(part.trim()); part = ''; } else part += c;
  }
  if (quote || comment === 'block') throw new Error('Close the quoted value or SQL comment.');
  if (part.trim()) parts.push(part.trim());
  return parts;
}

export function validateSelect(sql) {
  const parts = statements(sql);
  if (parts.length !== 1 || !/^(SELECT|WITH)\b/i.test(parts[0])) throw new Error('Enter one read-only SELECT or WITH query per editor.');
  return parts[0];
}

const INDEX_COLUMNS = {
  customers: ['customer_id', 'name', 'email', 'region'],
  products: ['product_id', 'name', 'category', 'price_cents'],
  orders: ['order_id', 'customer_id', 'order_date', 'status', 'total_cents'],
  order_items: ['item_id', 'order_id', 'product_id', 'quantity', 'unit_price_cents'],
};
export function validateIndexes(sql) {
  const parts = statements(sql);
  if (parts.length > 4) throw new Error('Use up to four candidate indexes.');
  const names = new Set();
  for (const part of parts) {
    const match = /^CREATE\s+INDEX\s+(idx_[a-z0-9_]{1,60})\s+ON\s+(customers|products|orders|order_items)\s*\(([^()]+)\)$/i.exec(part);
    if (!match) throw new Error('Use CREATE INDEX idx_name ON table (column, column DESC). Expressions, UNIQUE indexes, and other schema changes are outside this lab.');
    const [, name, table, cols] = match;
    if (names.has(name.toLowerCase())) throw new Error('Give each index a different name.');
    names.add(name.toLowerCase());
    const columns = cols.split(',');
    if (!columns.length || columns.length > 5 || columns.some(col => {
      const m = /^\s*([a-z_]+)\s*(?:ASC|DESC)?\s*$/i.exec(col);
      return !m || !INDEX_COLUMNS[table.toLowerCase()].includes(m[1].toLowerCase());
    })) throw new Error(`Use existing columns from ${table}, with optional ASC or DESC.`);
  }
  return parts;
}

export function summarize(samples) {
  if (!samples.length || samples.some(n => !Number.isFinite(n) || n < 0)) throw new Error('Timing samples must be finite, nonnegative values.');
  const sorted = [...samples].sort((a,b) => a-b), n = sorted.length;
  return { median: n % 2 ? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2, min: sorted[0], max: sorted[n-1], samples: [...samples] };
}
export function canonicalResult(result) {
  return JSON.stringify([result.columns, result.rows.map(row => JSON.stringify(row)).sort()]);
}
export function comparisonVerdict(report) {
  if (!report.equivalent) return { kind: 'mismatch', label: 'Results differ', detail: 'The queries returned different columns or row values. This run does not establish an equivalent optimization.' };
  const a = report.baseline.timing.median, b = report.candidate.timing.median;
  if (a < 0.1 || b < 0.1) return { kind: 'neutral', label: 'Below reliable timing range', detail: 'At least one median is below 0.10 ms. Use a larger dataset or inspect the plan; a speedup ratio would exaggerate timer noise.' };
  const ratio = a / b, percent = (a-b)/a*100;
  return { kind: b < a ? 'faster' : b > a ? 'slower' : 'neutral', label: b < a ? `${ratio.toFixed(1)}× faster in this run` : b > a ? `${(b/a).toFixed(1)}× slower in this run` : 'Same measured median', detail: `${Math.abs(percent).toFixed(1)}% ${percent >= 0 ? 'lower' : 'higher'} median time. Device load, timer precision, cache state, and data distribution affect these measurements.` };
}
export function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
export function csvText(columns, rows) {
  const cell = value => {
    let s = value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (/^[\s]*[=+@-]/.test(s) && typeof value !== 'number') s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replaceAll('"','""') + '"' : s;
  };
  return [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
export function validHistory(value) {
  if (!Array.isArray(value)) return [];
  const number=n=>Number.isFinite(n)&&n>=0, text=s=>typeof s==='string'&&s.length<=12000;
  const variant=v=>v&&text(v.sql)&&Array.isArray(v.plan)&&v.plan.length<=100&&v.plan.every(p=>p&&text(p.detail)&&Number.isInteger(p.id)&&Number.isInteger(p.parent))&&Array.isArray(v.columns)&&v.columns.length<=100&&v.columns.every(text)&&Array.isArray(v.preview)&&v.preview.length<=100&&v.preview.every(row=>Array.isArray(row)&&row.length===v.columns.length&&row.every(c=>c===null||text(c)||typeof c==='number'&&Number.isFinite(c)))&&typeof v.resultHash==='string'&&/^[a-f0-9]{64}$/.test(v.resultHash)&&Number.isInteger(v.rowCount)&&v.rowCount>=v.preview.length&&v.rowCount<=MAX_ROWS&&v.timing&&['median','min','max'].every(k=>number(v.timing[k]))&&Array.isArray(v.timing.samples)&&v.timing.samples.length===7&&v.timing.samples.every(number);
  return value.slice(0,8).filter(r=>r&&r.formatVersion===1&&typeof r.id==='string'&&/^[a-f0-9-]{36}$/.test(r.id)&&text(r.title)&&text(r.experimentId)&&text(r.createdAt)&&Number.isFinite(Date.parse(r.createdAt))&&typeof r.equivalent==='boolean'&&SIZES.includes(r.dataset?.orders)&&r.dataset.seed===DATASET_SEED&&r.dataset.version===DATASET_VERSION&&text(r.dataset.sqliteVersion)&&number(r.dataset.items)&&text(r.indexSQL)&&variant(r.baseline)&&variant(r.candidate)&&r.storage&&['baselineBytes','candidateBytes','indexBuildMedianMs'].every(k=>number(r.storage[k]))&&r.method&&r.method.samples===7&&r.method.warmupsPerSample===1&&['order','resultComparison','timingScope','cache'].every(k=>text(r.method[k])));
}
