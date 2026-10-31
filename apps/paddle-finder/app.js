(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeUrl = value => {try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'https://www.johnkewpickleball.com/paddle-database';}catch{return 'https://www.johnkewpickleball.com/paddle-database';}};
  const numeric = value => typeof value==='number'&&Number.isFinite(value);
  const missing = value => value===null||value===undefined||(typeof value==='string'&&!value.trim());
  const validKey = key => typeof key==='string'&&/^[A-Za-z][A-Za-z0-9_]*$/.test(key);
  const unknown='__missing__';
  const comparisonLimit=4;
  const state={data:null,metrics:[],categories:[],paddles:[],filtered:[],search:'',categoriesFilter:{},thickness:'',ranges:{},dates:{},addedFields:new Set(),sort:'handSpeed',direction:'desc',sorts:[{key:'handSpeed',direction:'desc'}],page:1,pageSize:15,selected:new Set(),preset:'hands',imageCatalog:{},imageCatalogStatus:'loading',failedPhotos:new Set()};
  let toastTimer;
  let photoReturnFocus=null,photoReturnContainer=null;
  const metric=key=>state.metrics.find(item=>item.key===key);
  const category=key=>state.categories.find(item=>item.key===key);
  const fields=()=>[...state.categories,...state.metrics];
  const field=key=>metric(key)||category(key);
  const fieldLabel=key=>field(key)?.label||key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
  const primaryCategories=()=>['durabilityTier','brand','shape'].filter(key=>category(key));
  const primaryMetrics=()=>['price',metric('handSpeed')?'handSpeed':'swingWeight','spin'].filter(key=>metric(key));
  function format(value,key){
    if(!numeric(value))return '—';
    if(key==='price')return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
    const digits=['swingWeight','handSpeed','firepower'].includes(key)?1:key==='spin'?0:/^kewcor(?:Delta|[3-6])?$/.test(key)?Math.max(3,Math.min(4,metric(key)?.precision||3)):2;
    return new Intl.NumberFormat('en-US',{minimumFractionDigits:/^kewcor(?:Delta|[3-6])?$/.test(key)?3:0,maximumFractionDigits:digits}).format(value);
  }
  function formatField(value,key){
    if(missing(value))return '—';
    if(metric(key))return format(value,key);
    if(category(key)?.type==='date'){const date=new Date(`${String(value).slice(0,10)}T00:00:00Z`);return Number.isNaN(date.getTime())?String(value):date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});}
    return String(value);
  }
  function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;},3400);}
  function openDialog(id){const dialog=$(`#${id}`);if(!dialog.open)dialog.showModal();}
  function safeImagePath(value){
    if(typeof value!=='string')return null;
    const path=value.replace(/^\.\//,'');
    if(!/^assets\/paddles\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp|avif)$/i.test(path)||path.split('/').some(segment=>!segment||segment==='.'||segment==='..'))return null;
    return './'+path;
  }
  function photoSource(entry){
    for(const value of [entry?.sourcePage,entry?.sourceUrl]){try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return url;}catch{}}
    return null;
  }
  function verifiedPhoto(id){
    const entry=state.imageCatalog[id],path=safeImagePath(entry?.path);
    return entry&&path&&!state.failedPhotos.has(id)?{...entry,path}:null;
  }
  function unavailablePhoto(p,context='table'){
    return `<span class="paddle-photo-unavailable ${context==='comparison'?'comparison-photo':''}" data-photo-unavailable="${escape(p.id)}" aria-label="Photo unavailable for ${escape(p.brand)} ${escape(p.model)}"><span>Photo<br>unavailable</span></span>`;
  }
  function thumbnailFraming(entry){
    const b=entry.thumbnailBounds,w=entry.width,h=entry.height;
    if(!b||![w,h,b.x,b.y,b.width,b.height].every(numeric)||w<=0||h<=0||b.x<0||b.y<0||b.width<=0||b.height<=0||b.x+b.width>w||b.y+b.height>h)return {mode:'original',style:''};
    // Fit the paddle's content bounds so blank source margins do not shrink it.
    return {mode:'content',style:`--photo-source-width:${w};--photo-source-height:${h};--photo-crop-left:${b.x};--photo-crop-top:${b.y};--photo-crop-width:${b.width};--photo-crop-height:${b.height}`};
  }
  function photoMarkup(p,context='table'){
    const entry=verifiedPhoto(p.id);if(!entry)return unavailablePhoto(p,context);
    const label=`${p.brand||''} ${p.model||''}${numeric(p.thickness)?' · '+p.thickness+' mm':''}`.trim();
    const framing=thumbnailFraming(entry);
    return `<button type="button" class="paddle-photo-button ${context==='comparison'?'comparison-photo':''}" data-photo-open="${escape(p.id)}" data-photo-context="${context}" aria-label="View product photo of ${escape(label)}"><span class="paddle-photo-frame" data-photo-framing="${framing.mode}" style="${framing.style}"><img class="paddle-photo" data-photo-id="${escape(p.id)}" data-photo-state="loading" src="${escape(entry.path)}" alt="${escape(entry.alt||label+' pickleball paddle')}" loading="lazy" decoding="async" width="44" height="66"></span></button>`;
  }
  async function loadImageCatalog(){
    try{
      const response=await fetch('./data/paddle-images.json',{cache:'no-cache'});if(!response.ok)throw new Error('Photo catalog unavailable');
      const catalog=await response.json();if(!catalog||!catalog.images||typeof catalog.images!=='object'||Array.isArray(catalog.images))throw new Error('Invalid photo catalog');
      state.imageCatalog=catalog.images;state.imageCatalogStatus='ready';
    }catch{state.imageCatalog={};state.imageCatalogStatus='unavailable';}
    document.body.dataset.photoCatalogState=state.imageCatalogStatus;
  }
  function openPhoto(id){
    const paddle=state.paddles.find(p=>p.id===id),entry=verifiedPhoto(id);if(!paddle||!entry)return;
    photoReturnFocus=document.activeElement;photoReturnContainer=photoReturnFocus?.closest('td,th');
    $('#photo-title').textContent=paddle.model||'Paddle photo';
    $('#photo-subtitle').textContent=[paddle.brand,numeric(paddle.thickness)?paddle.thickness+' mm core':null,paddle.shape].filter(Boolean).join(' · ');
    const img=$('#photo-dialog-image');img.alt=entry.alt||`${paddle.brand} ${paddle.model} pickleball paddle`;img.dataset.photoId=id;img.dataset.photoState='loading';img.hidden=false;img.src=entry.path;
    $('#photo-status').textContent='Loading product photo…';$('#photo-status').hidden=false;
    const source=photoSource(entry);$('#photo-credit').innerHTML=source?`Product photo · <a href="${escape(source.href)}" target="_blank" rel="noopener noreferrer">${escape(entry.credit||entry.sourceName||source.hostname)} ↗</a>`:'Product photo from the matched local image catalog.';
    openDialog('photo-dialog');$('#photo-dialog .close-dialog').focus();
  }
  function handlePhotoError(img){
    const id=img.dataset.photoId;if(!id)return;state.failedPhotos.add(id);
    const paddle=state.paddles.find(p=>p.id===id);
    if(paddle)$$('[data-photo-open]').filter(button=>button.dataset.photoOpen===id).forEach(button=>{button.outerHTML=unavailablePhoto(paddle,button.dataset.photoContext);});
    if($('#photo-dialog-image').dataset.photoId===id){$('#photo-dialog-image').hidden=true;$('#photo-status').textContent='Photo unavailable. This product image could not be loaded.';$('#photo-status').hidden=false;}
    img.dataset.photoState='error';
  }
  function photoSourceNote(){
    const count=state.paddles.filter(p=>verifiedPhoto(p.id)).length;
    return `<h3>Product photos</h3><p>${state.imageCatalogStatus==='ready'?`${count.toLocaleString()} of ${state.paddles.length.toLocaleString()} entries have matched product photos in the local catalog. Photos retain their original colors and proportions. Open a photo for its source credit.`:'The optional product-photo catalog is unavailable. Paddle measurements still work.'} Unmatched or failed photos are labeled “Photo unavailable”; no substitute model or variant is shown.</p>`;
  }
  function metadataNotes(){const raw=state.data?.metadata?.notes;return Array.isArray(raw)?raw.filter(Boolean).map(String):raw?[String(raw)]:[];}
  function prepareSchema(data){
    const defaults=[['handSpeed','Hand speed','/ 100','desc'],['swingWeight','Swing weight','','asc'],['spin','Spin','RPM','desc'],['power','Power','mph','desc'],['pop','Pop','mph','desc'],['twistWeight','Twist weight','','desc'],['balance','Balance point','cm','asc'],['weight','Static weight','oz','asc'],['thickness','Core thickness','mm','desc'],['price','Retail price','$','asc'],['firepower','Firepower','/ 100','desc']];
    state.metrics=(Array.isArray(data.metrics)?data.metrics:[]).filter(item=>item&&validKey(item.key)).map(item=>({...item,type:'numeric',direction:item.direction==='asc'?'asc':'desc'}));
    state.categories=(Array.isArray(data.categories)?data.categories:[]).filter(item=>item&&validKey(item.key)&&!metric(item.key)).map(item=>({...item,type:item.type==='date'?'date':'category',direction:'asc'}));
    for(const [key,label,unit,direction]of defaults)if(!field(key)&&state.paddles.some(p=>numeric(p[key])))state.metrics.push({key,label,unit,direction,type:'numeric'});
    for(const key of [...new Set(state.paddles.flatMap(p=>Object.keys(p)))]){
      if(!validKey(key)||field(key)||['id','sourceUrl','sourceRow'].includes(key))continue;
      const values=state.paddles.map(p=>p[key]).filter(value=>!missing(value));if(!values.length)continue;
      const label=fieldLabel(key);
      if(values.every(numeric))state.metrics.push({key,label,unit:'',type:'numeric',direction:'desc'});
      else if(values.every(value=>typeof value==='string'))state.categories.push({key,label,type:values.every(value=>/^\d{4}-\d{2}-\d{2}$/.test(value))?'date':'category',direction:'asc'});
    }
  }
  async function loadData(){
    $('#error-state').hidden=true;$('#empty-state').hidden=true;$('#table-body').innerHTML='<tr><td class="loading-state" colspan="8">Loading the numbers…</td></tr>';
    try{
      document.body.dataset.photoCatalogState='loading';
      const [response]=await Promise.all([fetch('./data/paddles.json',{cache:'no-cache'}),loadImageCatalog()]);if(!response.ok)throw new Error(`Data request returned ${response.status}.`);
      const data=await response.json();if(!data||!Array.isArray(data.paddles)||!data.paddles.length)throw new Error('No paddle records were found in the data snapshot.');
      state.data=data;state.paddles=data.paddles.map((paddle,index)=>({...paddle,id:String(paddle.id??index)}));prepareSchema(data);
      const hasHands=!!metric('handSpeed');state.sort=hasHands?'handSpeed':metric('swingWeight')?'swingWeight':fields()[0]?.key||'model';state.direction=hasHands?'desc':field(state.sort)?.direction||'asc';state.sorts=[{key:state.sort,direction:state.direction}];
      $('#total-paddles').textContent=state.paddles.length.toLocaleString();
      if(!hasHands){$('#hands-tip').textContent='Quick hands uses lower swing weight as a handling proxy. This is not a measured hand-speed score.';$('#hands-preset-copy').textContent='Lower swing weight, quicker feel';}
      else $('#hands-tip').textContent=metric('handSpeed')?.description||'Hand speed is John Kew’s handling index. Higher scores indicate quicker handling.';
      buildFilters();buildSort();buildSource();
      const date=new Date(data.metadata?.fetchedAt||data.metadata?.retrievedAt||'');$('#data-snapshot').textContent=`Snapshot${!Number.isNaN(date.getTime())?' · '+date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''}`;
      $('#export-csv').disabled=false;render();
    }catch(error){$('#table-body').innerHTML='';$('#error-state').hidden=false;$('#error-message').textContent=error.message+' Reload the page and try again.';$('#showing-count').textContent='Data unavailable';$('#sort-description').textContent='';}
  }
  function sortedValues(item){
    const values=[...new Set(state.paddles.map(p=>p[item.key]).filter(value=>!missing(value)).map(String))];
    return values.sort((a,b)=>{if(Array.isArray(item.order)){const ai=item.order.indexOf(a),bi=item.order.indexOf(b);if(ai>=0||bi>=0)return(ai<0?item.order.length:ai)-(bi<0?item.order.length:bi);}return a.localeCompare(b,undefined,{numeric:true});});
  }
  function categoryId(key){return key==='durabilityTier'?'durability-filter':`${key}-filter`;}
  function categoryHTML(item,removable=false){
    const counts=new Map();let missingCount=0;state.paddles.forEach(p=>{if(missing(p[item.key]))missingCount++;else{const value=String(p[item.key]);counts.set(value,(counts.get(value)||0)+1);}});
    const label=item.key==='durabilityTier'?'Grit durability':item.label,id=categoryId(item.key);
    return `<div class="filter-block category-filter-block ${item.key==='durabilityTier'?'durability-filter-block':''}" data-filter-field="${escape(item.key)}"><div class="range-heading"><label for="${escape(id)}">${escape(label)}</label>${removable?`<button type="button" class="remove-field-filter" data-remove-filter="${escape(item.key)}" aria-label="Remove ${escape(label)} filter">×</button>`:''}</div><select id="${escape(id)}" data-category="${escape(item.key)}" title="${escape(item.description||label)}"><option value="">${item.key==='durabilityTier'?'All durability tiers':'Any '+escape(label.toLowerCase())}</option>${sortedValues(item).map(value=>`<option value="${escape(value)}">${escape(value)} (${counts.get(value)})</option>`).join('')}<option value="${unknown}">Unknown (${missingCount})</option></select>${item.key==='durabilityTier'?'<p class="field-hint">Source spin-durability tier. Tier 1 has the highest retention.</p>':''}</div>`;
  }
  function rangeHTML(item,removable=false){
    const values=state.paddles.map(p=>p[item.key]).filter(numeric),min=values.length?format(Math.min(...values),item.key).replace(/[$,]/g,''):'',max=values.length?format(Math.max(...values),item.key).replace(/[$,]/g,''):'';
    return `<div class="filter-block" data-filter-field="${escape(item.key)}"><div class="range-heading"><label for="min-${escape(item.key)}">${escape(item.label)}</label><span>${escape(item.unit||'')}</span>${removable?`<button type="button" class="remove-field-filter" data-remove-filter="${escape(item.key)}" aria-label="Remove ${escape(item.label)} filter">×</button>`:''}</div><div class="range-pair"><label><span class="bound-label">Min</span><input type="number" inputmode="decimal" step="any" id="min-${escape(item.key)}" data-range="${escape(item.key)}" data-bound="min" placeholder="${escape(min)}" aria-label="Minimum ${escape(item.label)}" aria-describedby="range-error-${escape(item.key)}"></label><span aria-hidden="true">–</span><label><span class="bound-label">Max</span><input type="number" inputmode="decimal" step="any" id="max-${escape(item.key)}" data-range="${escape(item.key)}" data-bound="max" placeholder="${escape(max)}" aria-label="Maximum ${escape(item.label)}" aria-describedby="range-error-${escape(item.key)}"></label></div><p class="range-error" id="range-error-${escape(item.key)}" role="status" hidden>Minimum must not exceed maximum.</p></div>`;
  }
  function dateHTML(item,removable=false){
    return `<div class="filter-block date-filter-block" data-filter-field="${escape(item.key)}"><div class="range-heading"><label for="min-${escape(item.key)}">${escape(item.label)}</label>${removable?`<button type="button" class="remove-field-filter" data-remove-filter="${escape(item.key)}" aria-label="Remove ${escape(item.label)} filter">×</button>`:''}</div><div class="date-pair"><label><span class="bound-label">From</span><input type="date" id="min-${escape(item.key)}" data-date="${escape(item.key)}" data-bound="min" aria-label="Earliest ${escape(item.label)}" aria-describedby="range-error-${escape(item.key)}"></label><label><span class="bound-label">Through</span><input type="date" id="max-${escape(item.key)}" data-date="${escape(item.key)}" data-bound="max" aria-label="Latest ${escape(item.label)}" aria-describedby="range-error-${escape(item.key)}"></label></div><p class="range-error" id="range-error-${escape(item.key)}" role="status" hidden>Start date must not follow end date.</p></div>`;
  }
  function groupedOptions(available){
    const groups=[['Categories',available.filter(item=>item.type==='category')],['Dates',available.filter(item=>item.type==='date')]];
    for(const name of ['Performance','KewCOR surface','Specifications','Normalized scores','Historical readings'])groups.push([name,available.filter(item=>item.type==='numeric'&&(item.group||'Performance')===name)]);
    const known=new Set(groups.flatMap(([,items])=>items.map(item=>item.key)));groups.push(['Other measurements',available.filter(item=>!known.has(item.key))]);
    return groups.filter(([,items])=>items.length).map(([label,items])=>`<optgroup label="${label}">${items.map(item=>`<option value="${escape(item.key)}">${escape(item.label)}${item.unit?' ('+escape(item.unit)+')':''}</option>`).join('')}</optgroup>`).join('');
  }
  function buildFilters(){
    $('#category-filters').innerHTML=primaryCategories().map(key=>categoryHTML(category(key))).join('');
    const thicknessValues=[...new Set(state.paddles.map(p=>p.thickness).filter(numeric))].sort((a,b)=>a-b);
    $('#thickness-filter-wrapper').hidden=!metric('thickness');$('#thickness-filter').innerHTML='<option value="">Any thickness</option>'+thicknessValues.map(value=>`<option value="${value}">${value} mm</option>`).join('');$('#thickness-filter').value=state.thickness;
    $('#range-filters').innerHTML=primaryMetrics().map(key=>rangeHTML(metric(key))).join('');
    $('#extra-filters').innerHTML=[...state.addedFields].map(key=>field(key)).filter(Boolean).map(item=>item.type==='numeric'?rangeHTML(item,true):item.type==='date'?dateHTML(item,true):categoryHTML(item,true)).join('');
    const fixed=[...primaryCategories(),...primaryMetrics()];$('#filter-field-picker').innerHTML='<option value="">Choose a field…</option>'+groupedOptions(fields().filter(item=>!fixed.includes(item.key)&&!state.addedFields.has(item.key)));
    $('#field-picker-help').textContent=`${fields().length} imported fields · categories, numbers, dates. Added filters appear below.`;
    $$('[data-category]').forEach(select=>{select.value=state.categoriesFilter[select.dataset.category]||'';select.addEventListener('change',()=>{state.categoriesFilter[select.dataset.category]=select.value;state.page=1;render();});});
    $$('[data-range]').forEach(input=>{const key=input.dataset.range,bound=input.dataset.bound;input.value=state.ranges[key]?.[bound]??'';input.addEventListener('input',()=>{if(!state.ranges[key])state.ranges[key]={};state.ranges[key][bound]=input.value.trim()===''?null:Number(input.value);validateRanges();state.page=1;render();});});
    $$('[data-date]').forEach(input=>{const key=input.dataset.date,bound=input.dataset.bound;input.value=state.dates[key]?.[bound]||'';input.addEventListener('input',()=>{if(!state.dates[key])state.dates[key]={};state.dates[key][bound]=input.value;validateRanges();state.page=1;render();});});
    $$('[data-remove-filter]').forEach(button=>button.addEventListener('click',()=>{clearField(button.dataset.removeFilter,true);$('#filter-field-picker').focus();}));validateRanges();
  }
  function validateRanges(){
    fields().filter(item=>item.type==='numeric'||item.type==='date').forEach(item=>{const minInput=$(`#min-${item.key}`),maxInput=$(`#max-${item.key}`),error=$(`#range-error-${item.key}`);if(!minInput||!maxInput||!error)return;const bounds=item.type==='date'?state.dates[item.key]||{}:state.ranges[item.key]||{},invalid=item.type==='date'?Boolean(bounds.min&&bounds.max&&bounds.min>bounds.max):numeric(bounds.min)&&numeric(bounds.max)&&bounds.min>bounds.max;minInput.setAttribute('aria-invalid',String(invalid));maxInput.setAttribute('aria-invalid',String(invalid));error.hidden=!invalid;});
  }
  function buildSort(){$('#sort-metric').innerHTML=groupedOptions(fields());}
  function activeFilters(){
    const active=[];if(state.search)active.push({key:'search',text:`Search: ${state.search}`});
    for(const[key,value]of Object.entries(state.categoriesFilter))if(value)active.push({key,text:`${key==='durabilityTier'?'Grit durability':fieldLabel(key)}: ${value===unknown?'Unknown':value}`});
    if(state.thickness)active.push({key:'thicknessExact',text:`Thickness: ${state.thickness} mm`});
    for(const[key,bounds]of Object.entries(state.ranges))if(numeric(bounds.min)||numeric(bounds.max))active.push({key,text:`${fieldLabel(key)}: ${numeric(bounds.min)?format(bounds.min,key):'any'}–${numeric(bounds.max)?format(bounds.max,key):'any'}`});
    for(const[key,bounds]of Object.entries(state.dates))if(bounds.min||bounds.max)active.push({key,text:`${fieldLabel(key)}: ${bounds.min||'any'} → ${bounds.max||'any'}`});
    return active;
  }
  function clearField(key,remove=false){if(key==='search'){state.search='';$('#search').value='';}else if(key==='thicknessExact')state.thickness='';else{delete state.categoriesFilter[key];delete state.ranges[key];delete state.dates[key];if(remove)state.addedFields.delete(key);}state.page=1;buildFilters();render();}
  function getFiltered(){
    const query=state.search.trim().toLowerCase();
    const paddles=state.paddles.filter(p=>{
      if(query&&!`${p.brand||''} ${p.model||''}`.toLowerCase().includes(query))return false;
      if(!Object.entries(state.categoriesFilter).every(([key,value])=>!value||(value===unknown?missing(p[key]):String(p[key])===value)))return false;
      if(state.thickness&&String(p.thickness)!==state.thickness)return false;
      if(!Object.entries(state.ranges).every(([key,bounds])=>!numeric(bounds.min)&&!numeric(bounds.max)||numeric(p[key])&&(!numeric(bounds.min)||p[key]>=bounds.min)&&(!numeric(bounds.max)||p[key]<=bounds.max)))return false;
      return Object.entries(state.dates).every(([key,bounds])=>!bounds.min&&!bounds.max||!missing(p[key])&&(!bounds.min||p[key]>=bounds.min)&&(!bounds.max||p[key]<=bounds.max));
    });
    return paddles.sort((a,b)=>{
      for(const level of state.sorts){const result=compareLevel(a,b,level);if(result)return result;}
      return String(a.model||'').localeCompare(String(b.model||''))||String(a.brand||'').localeCompare(String(b.brand||''))||String(a.id).localeCompare(String(b.id));
    });
  }
  function compareLevel(a,b,level){
    const av=a[level.key],bv=b[level.key],aMissing=missing(av),bMissing=missing(bv);
    if(aMissing||bMissing)return aMissing===bMissing?0:aMissing?1:-1;
    const descriptor=field(level.key);let result;
    if(descriptor?.type==='date')result=Date.parse(av)-Date.parse(bv);
    else if(Array.isArray(descriptor?.order)){
      const ai=descriptor.order.indexOf(String(av)),bi=descriptor.order.indexOf(String(bv));
      if(ai<0&&bi>=0)return 1;if(bi<0&&ai>=0)return -1;
      result=ai>=0&&bi>=0?ai-bi:String(av).localeCompare(String(bv),undefined,{numeric:true});
    }else result=numeric(av)&&numeric(bv)?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true});
    return Number.isNaN(result)?0:level.direction==='asc'?result:-result;
  }
  function syncSorts(){
    const seen=new Set();state.sorts=state.sorts.filter(level=>field(level.key)&&!seen.has(level.key)&&seen.add(level.key));
    if(!state.sorts.length)state.sorts=[{key:metric('handSpeed')?'handSpeed':fields()[0].key,direction:'desc'}];
    state.sort=state.sorts[0].key;state.direction=state.sorts[0].direction;
  }
  function orderLabel(level={key:state.sort,direction:state.direction}){
    const descriptor=field(level.key),ascending=level.direction==='asc';
    if(descriptor?.type==='date')return ascending?'oldest to newest':'newest to oldest';
    if(Array.isArray(descriptor?.order)&&descriptor.order.length>1){const first=descriptor.order[0],last=descriptor.order.at(-1);return ascending?`${first} to ${last}`:`${last} to ${first}`;}
    if(descriptor?.type==='category')return ascending?'A to Z':'Z to A';
    return ascending?'low to high':'high to low';
  }
  function buildSortEditor(){
    $('#sort-levels').innerHTML=state.sorts.map((level,index)=>`<div class="sort-level" data-sort-level="${index}"><span class="sort-level-number">${index+1}</span>${index===0?`<span class="sort-level-primary">${escape(fieldLabel(level.key))}<small>Primary</small></span>`:`<select data-sort-level-field="${index}" data-sort-control="field:${escape(level.key)}" aria-label="Sort field at priority ${index+1}">${groupedOptions(fields().filter(item=>item.key===level.key||!state.sorts.some(other=>other.key===item.key)))}</select>`}<button class="sort-level-direction" data-sort-level-direction="${index}" data-sort-control="direction:${escape(level.key)}" aria-label="Priority ${index+1}: ${escape(orderLabel(level))}. Reverse direction">${level.direction==='asc'?'↑':'↓'} <span>${escape(orderLabel(level))}</span></button><button data-sort-move="up" data-sort-index="${index}" data-sort-control="up:${escape(level.key)}" aria-label="Move ${escape(fieldLabel(level.key))} up" ${index===0?'disabled':''}>↑</button><button data-sort-move="down" data-sort-index="${index}" data-sort-control="down:${escape(level.key)}" aria-label="Move ${escape(fieldLabel(level.key))} down" ${index===state.sorts.length-1?'disabled':''}>↓</button><button data-sort-remove="${index}" data-sort-control="remove:${escape(level.key)}" aria-label="Remove ${escape(fieldLabel(level.key))} sort" ${state.sorts.length===1?'disabled':''}>×</button></div>`).join('');
    $$('[data-sort-level-field]').forEach(select=>{select.value=state.sorts[Number(select.dataset.sortLevelField)].key;select.addEventListener('change',()=>{const index=Number(select.dataset.sortLevelField),key=select.value;if(state.sorts.some((level,i)=>i!==index&&level.key===key))return;state.sorts[index]={key,direction:field(key)?.direction||'asc'};syncSorts();state.page=1;state.preset='';render();$$('[data-sort-control]').find(control=>control.dataset.sortControl===`field:${key}`)?.focus({preventScroll:true});});});
    $$('[data-sort-level-direction]').forEach(button=>button.addEventListener('click',()=>{const level=state.sorts[Number(button.dataset.sortLevelDirection)];level.direction=level.direction==='asc'?'desc':'asc';syncSorts();state.page=1;state.preset='';render();}));
    $$('[data-sort-move]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.sortIndex),next=index+(button.dataset.sortMove==='up'?-1:1);if(next<0||next>=state.sorts.length)return;[state.sorts[index],state.sorts[next]]=[state.sorts[next],state.sorts[index]];syncSorts();state.page=1;state.preset='';render();}));
    $$('[data-sort-remove]').forEach(button=>button.addEventListener('click',()=>{if(state.sorts.length<2)return;state.sorts.splice(Number(button.dataset.sortRemove),1);syncSorts();state.page=1;state.preset='';render();}));
    const available=fields().filter(item=>!state.sorts.some(level=>level.key===item.key));$('#add-sort-field').innerHTML='<option value="">Add another sort field…</option>'+groupedOptions(available);$('#add-sort-field').disabled=!available.length;
    $('#delta-note').hidden=!metric('kewcorDelta');$('#delta-note').textContent=metric('kewcorDelta')?.description||'';
  }
  function rowBadges(p){
    const badges=[];if(category('durabilityTier'))badges.push(`<span class="tier-badge ${missing(p.durabilityTier)?'tier-unknown':''}" title="Source spin durability tier">Grit · ${escape(missing(p.durabilityTier)?'Unknown':p.durabilityTier)}</span>`);
    for(const[key,value]of Object.entries(state.categoriesFilter))if(value&&!['brand','model','shape','durabilityTier'].includes(key))badges.push(`<span class="row-attribute" title="${escape(fieldLabel(key))}">${escape(fieldLabel(key))}: ${escape(missing(p[key])?'Unknown':p[key])}</span>`);
    return badges.length?`<div class="row-attributes">${badges.join('')}</div>`:'';
  }
  function render(){
    if(!state.data)return;
    const focused=document.activeElement,focusCompare=focused?.dataset?.compare,focusSort=focused?.dataset?.sort,focusSortControl=focused?.dataset?.sortControl,primarySpeed=metric('handSpeed')?'handSpeed':'swingWeight';
    const visibleFields=[...state.sorts.map(level=>level.key),primarySpeed,'kewcorDelta','firepower','spin','power','twistWeight','price'].filter((key,index,keys)=>key!=='model'&&field(key)&&keys.indexOf(key)===index);
    state.filtered=getFiltered();const total=state.filtered.length,pages=Math.max(1,Math.ceil(total/state.pageSize));state.page=Math.min(state.page,pages);
    const start=(state.page-1)*state.pageSize,visible=state.filtered.slice(start,start+state.pageSize),active=activeFilters();
    $('#result-count').textContent=total.toLocaleString();$('#showing-count').textContent=`${total.toLocaleString()} of ${state.paddles.length.toLocaleString()} paddles${active.length?' match your filters':''}`;
    $('#sort-description').textContent=state.sorts.map((level,index)=>`${index+1}. ${fieldLabel(level.key)} (${orderLabel(level)})`).join(' → ');buildSortEditor();$('#sort-metric').value=state.sort;$('#sort-direction').textContent=state.direction==='asc'?'↑':'↓';$('#sort-direction').setAttribute('aria-label',`Current order: ${orderLabel()}. Reverse sort direction`);
    $('#filter-count').textContent=active.length;$('#filter-count').hidden=!active.length;$('#active-filters').hidden=!active.length;
    $('#active-filters').innerHTML=active.map(item=>`<button class="active-filter-chip" data-clear-filter="${escape(item.key)}" aria-label="Clear ${escape(item.text)}">${escape(item.text)} <span aria-hidden="true">×</span></button>`).join('');
    $$('[data-clear-filter]').forEach(button=>button.addEventListener('click',()=>{clearField(button.dataset.clearFilter);$('#reset-filters').focus({preventScroll:true});}));
    const modelRank=state.sorts.findIndex(level=>level.key==='model');$('#table-head').innerHTML=`<tr><th class="select-cell"><span aria-hidden="true">＋</span><span class="sr-only">Compare</span></th><th ${modelRank>0?`aria-label="Paddle name, sort priority ${modelRank+1}, ${escape(orderLabel(state.sorts[modelRank]))}"`:''} ${state.sort==='model'?`aria-sort="${state.direction==='asc'?'ascending':'descending'}"`:''}><button data-sort="model">Paddle ${modelRank>=0?`<span class="sort-priority-badge" aria-hidden="true">${modelRank+1}</span>`:''} <span class="sort-mark" aria-hidden="true">${state.sort==='model'?(state.direction==='asc'?'↑':'↓'):'↕'}</span></button></th>${visibleFields.map(key=>{const item=field(key);const rank=state.sorts.findIndex(level=>level.key===key);return `<th class="${item.type==='numeric'?'numeric':'category-column'}" ${rank>0?`aria-label="${escape(item.label)}, sort priority ${rank+1}, ${escape(orderLabel(state.sorts[rank]))}"`:''} ${state.sort===key?`aria-sort="${state.direction==='asc'?'ascending':'descending'}"`:''}><button data-sort="${escape(key)}">${escape(item.label)}${rank>=0?` <span class="sort-priority-badge" aria-hidden="true">${rank+1}</span>`:''}<span class="sort-mark" aria-hidden="true">${state.sort===key?(state.direction==='asc'?'↑':'↓'):'↕'}</span></button><small>${escape(item.unit||'')}</small></th>`;}).join('')}</tr>`;
    $('#table-body').innerHTML=visible.map((p,index)=>{
      const name=p.model||'Unnamed paddle',brand=p.brand||'Unknown brand',chosen=state.selected.has(p.id);
      return `<tr class="${chosen?'selected':''}" data-paddle-id="${escape(p.id)}"><td class="select-cell"><input type="checkbox" data-compare="${escape(p.id)}" aria-label="Compare ${escape(brand)} ${escape(name)}" ${chosen?'checked':''}></td><td class="paddle-cell"><div class="paddle-info">${photoMarkup(p)}<div><a class="paddle-model" href="${escape(safeUrl(p.sourceUrl||state.data.metadata?.sourceUrl))}" target="_blank" rel="noopener noreferrer" title="View ${escape(name)} at the data source">${escape(name)}</a><div class="paddle-brand">${escape(brand)}${p.shape?`<span class="shape-badge">${escape(p.shape)}</span>`:''}${numeric(p.thickness)?`<span>${escape(format(p.thickness,'thickness'))} mm</span>`:''}${p.condition&&p.condition.toLowerCase()!=='new'?`<span class="condition-badge">${escape(p.condition)}</span>`:''}</div>${rowBadges(p)}</div></div></td>${visibleFields.map(key=>{
        const value=p[key],item=field(key);if(missing(value)||item.type==='numeric'&&!numeric(value))return `<td class="${item.type==='numeric'?'numeric':'category-column'}"><span class="null-value" title="Not available in source data">—</span></td>`;
        if(key==='handSpeed')return `<td class="numeric speed-cell"><span class="metric-value">${format(value,key)}</span><span class="speed-bar" aria-hidden="true"><i style="width:${Math.max(0,Math.min(100,value))}%"></i></span></td>`;
        return `<td class="${item.type==='numeric'?'numeric':'category-column'} ${key==='price'?'price-cell':''}">${escape(formatField(value,key))}</td>`;
      }).join('')}</tr>`;
    }).join('');
    $('#empty-state').hidden=total>0;$('#table-head').hidden=total===0;$('#page-info').textContent=total?`Showing ${start+1}–${Math.min(start+state.pageSize,total)} of ${total.toLocaleString()} paddles`:'0 paddles';$('#page-number').textContent=state.page;$('#previous-page').disabled=state.page<=1;$('#next-page').disabled=state.page>=pages;
    $$('[data-sort]').forEach(button=>button.addEventListener('click',()=>setSort(button.dataset.sort)));$$('[data-compare]').forEach(input=>input.addEventListener('change',()=>toggleCompare(input.dataset.compare,input)));
    $$('.preset').forEach(button=>{const selected=button.dataset.preset===state.preset;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});updateComparison();
    if(focusCompare)$$('[data-compare]').find(input=>input.dataset.compare===focusCompare)?.focus({preventScroll:true});else if(focusSort)$$('[data-sort]').find(button=>button.dataset.sort===focusSort)?.focus({preventScroll:true});else if(focusSortControl){const original=$$('[data-sort-control]').find(control=>control.dataset.sortControl===focusSortControl);const key=focusSortControl.split(':')[1];const restore=original&&!original.disabled?original:$$('[data-sort-control]').find(control=>control.dataset.sortControl===`direction:${key}`)||$('#add-sort-field');restore.focus({preventScroll:true});}
  }
  function setSort(key,direction){const nextDirection=direction||(state.sort===key?(state.direction==='asc'?'desc':'asc'):field(key)?.direction||'asc');state.sorts=[{key,direction:nextDirection},...state.sorts.slice(1).filter(level=>level.key!==key)];syncSorts();state.page=1;state.preset='';render();}
  function resetFilters(){state.search='';state.categoriesFilter={};state.thickness='';state.ranges={};state.dates={};state.page=1;state.sort=metric('handSpeed')?'handSpeed':metric('swingWeight')?'swingWeight':fields()[0]?.key||'model';state.direction=metric('handSpeed')?'desc':field(state.sort)?.direction||'asc';state.preset='hands';state.sorts=[{key:state.sort,direction:state.direction}];$('#search').value='';buildFilters();render();}
  function toggleCompare(id,input){if(state.selected.has(id))state.selected.delete(id);else if(state.selected.size<comparisonLimit)state.selected.add(id);else{if(input)input.checked=false;toast(`Your shortlist holds up to ${comparisonLimit} paddles. Remove one to add another.`);return;}render();if($('#comparison-dialog').open)buildComparison();}
  function selectedPaddles(){return [...state.selected].map(id=>state.paddles.find(p=>p.id===id)).filter(Boolean);}
  function updateComparison(){const paddles=selectedPaddles();$('#nav-compare-count').textContent=paddles.length;$('#compare-tray').hidden=!paddles.length;$('#compare-tray-title').textContent=`Your shortlist · ${paddles.length} of ${comparisonLimit}`;$('#compare-tray-names').textContent=paddles.map(p=>p.model).join('  ·  ');$('#open-comparison').textContent=`Compare ${paddles.length===1?'paddle':'paddles'} →`;}
  function renderComparisonSearch(){
    const input=$('#comparison-search'),list=$('#comparison-search-results'),status=$('#comparison-search-status');
    $('#comparison-capacity').textContent=`${state.selected.size} of ${comparisonLimit} selected`;
    $('#comparison-search-hint').textContent=`Search all ${state.paddles.length.toLocaleString()} paddles, including those outside your explorer filters.`;
    list.innerHTML='';list.hidden=true;
    if(state.selected.size>=comparisonLimit){status.textContent=`All ${comparisonLimit} spots are filled. Remove a paddle below to add another.`;return;}
    const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const words=normalize(input.value).trim().split(/\s+/).filter(Boolean);
    if(!words.length){status.textContent='Type a paddle name or brand to find a match.';return;}
    const matches=state.paddles.filter(p=>words.every(word=>normalize(`${p.brand} ${p.model} ${numeric(p.thickness)?p.thickness+' mm':''}`).includes(word)));
    const available=matches.filter(p=>!state.selected.has(p.id)),shown=available.slice(0,8);
    if(!shown.length){status.textContent=matches.length?'Matching paddles are already in your comparison.':'No matching paddles. Try a shorter name or brand.';return;}
    status.textContent=available.length>shown.length?`Showing ${shown.length} of ${available.length} matches. Keep typing to narrow your search.`:`${shown.length} matching paddle${shown.length===1?'':'s'}. Choose one to add.`;
    list.innerHTML=shown.map(p=>{const details=[p.brand,numeric(p.thickness)?p.thickness+' mm':null,p.shape,p.condition&&p.condition.toLowerCase()!=='new'?p.condition:null].filter(Boolean).join(' · ');return `<li><button type="button" data-comparison-add="${escape(p.id)}" aria-label="Add ${escape(p.model)} · ${escape(details)} to comparison"><span><strong>${escape(p.model)}</strong><small>${escape(details)}</small></span><span class="comparison-add-label" aria-hidden="true">Add +</span></button></li>`;}).join('');
    list.hidden=false;
  }
  function addComparisonResult(id){
    const paddle=state.paddles.find(p=>p.id===id);if(!paddle||state.selected.has(id))return;
    if(state.selected.size>=comparisonLimit){renderComparisonSearch();return;}
    $('#comparison-search').value='';toggleCompare(id);
    $('#comparison-search').focus({preventScroll:true});
    $('#comparison-search-status').textContent=`Added ${paddle.model}. ${$('#comparison-search-status').textContent}`;
  }
  function buildComparison(){
    renderComparisonSearch();
    const paddles=selectedPaddles();if(!paddles.length){$('#comparison-content').innerHTML='<div class="comparison-empty"><p>Your shortlist is waiting.<br>Search above or select up to four paddles using the checkboxes in the explorer.</p><button class="button button-primary" data-close="comparison-dialog">Explore paddles</button></div>';return;}
    $('#comparison-content').innerHTML=`<table><thead><tr><th>At a glance</th>${paddles.map(p=>`<th>${photoMarkup(p,'comparison')}<span class="comparison-brand">${escape(p.brand)}${numeric(p.thickness)?' · '+escape(format(p.thickness,'thickness'))+' mm':''}</span><a class="comparison-paddle" href="${escape(safeUrl(p.sourceUrl||state.data.metadata?.sourceUrl))}" target="_blank" rel="noopener noreferrer">${escape(p.model)} ↗</a><button class="comparison-remove" data-remove="${escape(p.id)}">Remove</button></th>`).join('')}</tr></thead><tbody>${fields().map(item=>`<tr><td>${escape(item.key==='durabilityTier'?'Grit durability':item.label)}${item.unit&&item.key!=='price'?` <span class="metric-unit">${escape(item.unit)}</span>`:''}</td>${paddles.map(p=>`<td>${escape(formatField(p[item.key],item.key))}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="comparison-note">All ${fields().length} imported fields are shown. A dash means the source does not include this measurement. Different metrics describe different tradeoffs.</p>`;
    $$('[data-remove]').forEach(button=>button.addEventListener('click',()=>{toggleCompare(button.dataset.remove);$('#comparison-search').focus({preventScroll:true});}));
  }
  function buildSource(){
    const meta=state.data?.metadata||{};$('#source-content').innerHTML=`<p>This portfolio demo explores measurements from <a href="${escape(safeUrl(meta.sourceUrl))}" target="_blank" rel="noopener noreferrer">${escape(meta.sourceName||'John Kew Pickleball')} ↗</a>. It is an independent project and is not affiliated with or endorsed by John Kew.</p><div class="source-context"><strong>Demo data</strong><p>This demo uses a bundled snapshot. It does not update live. Missing data stays empty; no values or durability tiers are estimated.</p>${metadataNotes().map(note=>`<p>${escape(note)}</p>`).join('')}</div>${photoSourceNote()}<h3>Every imported field</h3>${fields().map(item=>`<div class="metric-definition"><strong>${escape(item.key==='durabilityTier'?'Grit durability':item.label)}${item.unit?' · '+escape(item.unit):''}</strong><p>${escape(item.description||`${item.label} as reported in the source dataset.`)}</p></div>`).join('')}<p>Prices reflect the source snapshot and can change. Always confirm current product details with the original source.</p>`;
  }
  function csvValue(value){let text=String(value??'');if(typeof value==='string'&&/^[=+\-@]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
  function exportCSV(){const columns=[...fields(),{key:'sourceRow',label:'Source row'},{key:'sourceUrl',label:'Source URL'}],csv=[columns.map(item=>csvValue(item.key==='durabilityTier'?'Grit durability':item.label)).join(','),...state.filtered.map(p=>columns.map(item=>csvValue(p[item.key])).join(','))].join('\r\n'),url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'})),link=document.createElement('a');link.href=url;link.download='paddle-finder-shortlist.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`Exported ${state.filtered.length} filtered paddle${state.filtered.length===1?'':'s'} with all ${fields().length} fields.`);}
  $('#filter-form').addEventListener('submit',event=>event.preventDefault());$('#search').addEventListener('input',event=>{state.search=event.target.value;state.page=1;render();});
  $('#thickness-filter').addEventListener('change',event=>{state.thickness=event.target.value;state.page=1;render();});
  $('#filter-field-picker').addEventListener('change',event=>{const key=event.target.value;if(!field(key))return;state.addedFields.add(key);buildFilters();const block=$$('[data-filter-field]').find(element=>element.dataset.filterField===key);block?.querySelector('input,select')?.focus();});
  $('#add-sort-field').addEventListener('change',event=>{const key=event.target.value;if(!field(key)||state.sorts.some(level=>level.key===key))return;state.sorts.push({key,direction:field(key).direction||'asc'});syncSorts();state.page=1;state.preset='';render();$$('[data-sort-level-field]').at(-1)?.focus();});
  $('#sort-metric').addEventListener('change',event=>setSort(event.target.value,field(event.target.value)?.direction||'asc'));$('#sort-direction').addEventListener('click',()=>setSort(state.sort,state.direction==='asc'?'desc':'asc'));
  $('#reset-filters').addEventListener('click',resetFilters);$('#empty-reset').addEventListener('click',resetFilters);$('#previous-page').addEventListener('click',()=>{if(state.page>1){state.page--;render();}});$('#next-page').addEventListener('click',()=>{state.page++;render();});
  $$('.preset').forEach(button=>button.addEventListener('click',()=>{const preset=button.dataset.preset,key=preset==='hands'?(metric('handSpeed')?'handSpeed':'swingWeight'):preset==='spin'?'spin':'power';if(!metric(key)){toast('This measurement is not available in the data snapshot.');return;}state.sort=key;state.direction=preset==='hands'&&key==='swingWeight'?'asc':'desc';state.preset=preset;state.sorts=[{key:state.sort,direction:state.direction}];state.page=1;render();}));
  for(const id of ['nav-source','hero-source','footer-source'])$(`#${id}`).addEventListener('click',()=>{if(state.data)openDialog('source-dialog');else toast('Data source: johnkewpickleball.com/paddle-database');});
  for(const id of ['nav-compare','open-comparison'])$(`#${id}`).addEventListener('click',()=>{if(!state.data){toast('Paddle data is still loading. Please try again in a moment.');return;}$('#comparison-search').value='';buildComparison();openDialog('comparison-dialog');});$('#clear-comparison').addEventListener('click',()=>{state.selected.clear();render();});
  $('#comparison-search').addEventListener('input',renderComparisonSearch);
  $('#comparison-search').addEventListener('keydown',event=>{if(!['ArrowDown','Enter'].includes(event.key))return;const buttons=$$('[data-comparison-add]');if(!buttons.length)return;event.preventDefault();if(event.key==='Enter'&&buttons.length===1)addComparisonResult(buttons[0].dataset.comparisonAdd);else buttons[0].focus();});
  $('#comparison-search-results').addEventListener('click',event=>{const button=event.target.closest('[data-comparison-add]');if(button)addComparisonResult(button.dataset.comparisonAdd);});
  $('#comparison-search-results').addEventListener('keydown',event=>{if(!['ArrowDown','ArrowUp'].includes(event.key))return;const buttons=$$('[data-comparison-add]'),index=buttons.indexOf(document.activeElement);if(index<0)return;event.preventDefault();if(event.key==='ArrowUp'&&index===0)$('#comparison-search').focus();else buttons[Math.max(0,Math.min(buttons.length-1,index+(event.key==='ArrowDown'?1:-1)))].focus();});
  document.addEventListener('click',event=>{const button=event.target.closest('[data-photo-open]');if(button)openPhoto(button.dataset.photoOpen);});
  document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&event.target.dataset.photoId)handlePhotoError(event.target);},true);
  document.addEventListener('load',event=>{const img=event.target;if(img instanceof HTMLImageElement&&img.dataset.photoId){img.dataset.photoState='loaded';if(img.id==='photo-dialog-image')$('#photo-status').hidden=true;}},true);
  $('#photo-dialog').addEventListener('close',()=>{const target=photoReturnFocus?.isConnected?photoReturnFocus:photoReturnContainer?.querySelector('a,button')||$('#comparison-dialog[open] .close-dialog')||$('#search');target?.focus({preventScroll:true});});
  document.addEventListener('click',event=>{const button=event.target.closest('[data-close]');if(button)$(`#${button.dataset.close}`).close();});$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}}));
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$$('dialog').some(dialog=>dialog.open)){event.preventDefault();$('#search').focus();}});$('#export-csv').addEventListener('click',exportCSV);$('#retry-data').addEventListener('click',loadData);loadData();
})();
