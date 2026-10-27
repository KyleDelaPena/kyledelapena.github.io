import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const requested=process.argv[2]||'dist';
const allowed=['dist','../../apps/sql-performance-lab'];
if(!allowed.includes(requested))throw new Error('Build into dist or ../../apps/sql-performance-lab.');
const output=path.resolve(root,requested), provenance=JSON.parse(await readFile(path.join(root,'vendor/provenance.json'),'utf8'));
for(const [name,expected] of Object.entries(provenance.files)){const actual=createHash('sha256').update(await readFile(path.join(root,'vendor',name))).digest('hex');if(actual!==expected)throw new Error(`Vendor integrity check failed for ${name}`);}
const hash=createHash('sha256');
for(const name of ['index.html','icon.svg',...(await readdir(path.join(root,'src'))).sort().map(name=>'src/'+name)]){hash.update(name);hash.update(await readFile(path.join(root,name)));}
await rm(output,{recursive:true,force:true});await mkdir(path.join(output,'vendor'),{recursive:true});
for(const name of ['index.html','icon.svg','src'])await cp(path.join(root,name),path.join(output,name),{recursive:true});
for(const name of ['index.mjs','sqlite3.wasm','provenance.json','LICENSE.md'])await cp(path.join(root,'vendor',name),path.join(output,'vendor',name));
await writeFile(path.join(output,'portfolio-build.json'),JSON.stringify({app:'sql-performance-lab',title:'SQL Performance Lab',basePath:'/apps/sql-performance-lab',sourceSha256:hash.digest('hex'),engine:provenance,source:'integrations/sql-performance-lab',storageKeys:['kyle-portfolio:sql-performance-lab:history:v1'],runtime:'Static modules with official SQLite WebAssembly in a dedicated Web Worker'},null,2)+'\n');
await writeFile(path.join(output,'.nojekyll'),'');
console.log(`Built SQL Performance Lab in ${output}`);
