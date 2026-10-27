import sqlite3InitModule from '../vendor/index.mjs';
import { LabEngine } from './engine.mjs';

let engine;
const initialized=sqlite3InitModule({print:()=>{},printErr:()=>{}}).then(sqlite=>{engine=new LabEngine(sqlite);});
self.onmessage=async ({data})=>{
  const {id,type,payload}=data;
  const progress=value=>self.postMessage({id,type:'progress',value});
  try {
    await initialized;
    let value;
    if(type==='seed') value=await engine.seed(payload.size,progress);
    else if(type==='compare') value=await engine.compare(payload,progress);
    else if(type==='inspect') value=await engine.inspect(payload.sql);
    else throw new Error('Unknown database action.');
    self.postMessage({id,type:'result',value});
  }catch(error){self.postMessage({id,type:'error',message:error.message||String(error)});}
};
