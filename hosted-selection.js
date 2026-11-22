import {LEGACY} from './hosted-bank.js?v=1';
import {BANKS,LABELS} from './difficulty-bank.js?v=1';
export {LABELS};
export const normalize=s=>String(s).normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]/gu,'');
export function pool(difficulty){if(!Object.hasOwn(LABELS,difficulty))throw Error('Invalid difficulty');const cats=new Map(),used=new Set();
 const add=(cat,q)=>{const key=normalize(q.q);if(!key||used.has(key))return;used.add(key);if(!cats.has(cat))cats.set(cat,[]);cats.get(cat).push({...q,key})};
 for(const t of LEGACY)for(const q of t.q)if(q.difficulty===difficulty)add(t.n,q);
 for(const q of BANKS[difficulty])add(q.cat,{q:q.q,a:q.options[q.correct],rank:q.level||3});
 return [...cats].map(([n,q])=>({n,q})).filter(t=>t.q.length>=5)}
export function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function blank(){return{clock:0,themes:{},questions:{}}}
export function load(storage){try{const h=JSON.parse(storage.getItem('svoyak-hosted-history-v1'));return h&&Number.isFinite(h.clock)&&h.themes&&h.questions?h:blank()}catch{return blank()}}
export function save(storage,h){try{storage.setItem('svoyak-hosted-history-v1',JSON.stringify(h));return true}catch{return false}}
function old(a,dates,key){return shuffle(a).sort((x,y)=>(dates[key(x)]||0)-(dates[key(y)]||0))}
export function makeGame(difficulty,h){const p=pool(difficulty);if(p.length<10)throw Error('Need ten themes');const picked=old(p,h.themes,t=>t.n).slice(0,10),used=new Set();
 function draw(t,count){const a=old(t.q.filter(q=>!used.has(q.key)),h.questions,q=>q.key).slice(0,count);if(a.length<count)throw Error('Not enough unique questions');a.forEach(q=>used.add(q.key));return a}
 const boards=[0,1].map(r=>{const cats=picked.slice(r*5,r*5+5).map(t=>({n:t.n,qs:draw(t,5).sort((a,b)=>a.rank-b.rank).map((q,i)=>({...q,v:(i+1)*100*(r+1)}))}));const cells=[];for(let c=0;c<5;c++)for(let i=1;i<5;i++)cells.push(c+'-'+i);const types=shuffle(['secret','swap','x2','stake']),mods={};shuffle(cells).slice(0,4).forEach((k,i)=>mods[k]=types[i]);return{cats,mods}});
 const fin=old(p.filter(t=>t.q.some(q=>!used.has(q.key))),h.themes,t=>t.n).slice(0,5).map(t=>({n:t.n,...draw(t,1)[0]}));if(fin.length!==5)throw Error('Need five final topics');return{boards,fin}}
export function markThemes(h,boards){h.clock++;for(const b of boards)for(const t of b.cats)h.themes[t.n]=h.clock}
export function markQuestion(h,q){h.clock++;h.questions[q.key||normalize(q.q)]=h.clock}
