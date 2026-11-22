export function validate(bank){
 const ids=new Set(),texts=new Set();
 for(const q of bank){if(!q.id||ids.has(q.id)||texts.has(q.q))throw Error('Duplicate question');ids.add(q.id);texts.add(q.q);
 if(!q.cat||!q.why||!q.q||![2,3].includes(q.level)||!Array.isArray(q.options)||q.options.length!==4||q.options.some(s=>typeof s!=='string'||!s.trim())||new Set(q.options.map(s=>s.trim().toLowerCase())).size!==4||!Number.isInteger(q.correct)||q.correct<0||q.correct>3)throw Error('Invalid '+q.id)}
 if(bank.length<21)throw Error('Need 21 questions');return true}
export function shuffle(a,rng=Math.random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function schedule(bank,seen=[]){
 const used=new Set(),counts={},recent=new Set(seen),deck=[];
 for(let i=0;i<21;i++){let a=bank.filter(q=>!used.has(q.id)&&(i<10?q.level===2:q.level===3));if(!a.length)a=bank.filter(q=>!used.has(q.id));
 const fresh=a.filter(q=>!recent.has(q.id));if(fresh.length)a=fresh;
 const min=Math.min(...a.map(q=>counts[q.cat]||0));a=a.filter(q=>(counts[q.cat]||0)===min);const q=shuffle(a)[0];used.add(q.id);counts[q.cat]=(counts[q.cat]||0)+1;
 const order=shuffle([0,1,2,3]);deck.push({...q,options:order.map(j=>q.options[j]),correct:order.indexOf(q.correct)})}return deck}
export function createRoom(code,id,name){return{code,host:id,epoch:Date.now().toString(36)+Math.random().toString(36).slice(2),rev:0,phase:'lobby',players:[{id,name,score:0}],deck:[],index:0,answers:{},bets:{},ready:[],deadline:0,result:null}}
export function start(r,deck,now){if(r.phase!=='lobby'||!r.players.length)return false;r.players.forEach(p=>p.score=0);r.deck=deck;r.index=0;r.bets={};open(r,now);return true}
function open(r,now){r.phase=r.index===20?'final':'question';r.answers={};r.ready=[];r.result=null;r.deadline=now+(r.index===20?35000:28000)}
export function token(r){return r.epoch+':'+r.index+':'+r.phase}
export function input(r,m,now){const p=r.players.find(p=>p.id===m.id);if(!p||m.token!==token(r))return false;
 if(m.t==='answer'&&['question','final'].includes(r.phase)&&now<r.deadline&&!(m.id in r.answers)&&Number.isInteger(m.option)&&m.option>=0&&m.option<4){r.answers[m.id]=m.option;return true}
 if(m.t==='bet'&&r.phase==='bets'&&now<r.deadline&&!(m.id in r.bets)&&Number.isInteger(m.value)&&m.value>=0&&m.value<=Math.max(0,p.score)){r.bets[m.id]=m.value;return true}
 if(m.t==='ready'&&r.phase==='result'&&!r.ready.includes(m.id)){r.ready.push(m.id);return true}return false}
export function tick(r,now){if(r.phase==='result'){if(now<r.deadline&&r.ready.length<r.players.length)return false;r.index++;if(r.index===20){r.phase='bets';r.bets={};r.deadline=now+30000;r.result=null}else open(r,now);return true}
 if(r.phase==='bets'&&now>=r.deadline){open(r,now);return true}
 if(!['question','final'].includes(r.phase)||now<r.deadline)return false;
 const q=r.deck[r.index],final=r.phase==='final',value=r.index<10?200:400;
 const details=r.players.map(p=>{const selected=r.answers[p.id],ok=selected===q.correct,stake=final?(r.bets[p.id]||0):value,delta=final?(ok?stake:-stake):(ok?value:0);p.score+=delta;return{id:p.id,selected:Number.isInteger(selected)?selected:null,ok,delta,stake}});
 r.result={q:q.q,options:q.options,correct:q.correct,why:q.why,details};r.phase=final?'done':'result';r.ready=[];r.deadline=now+14000;return true}
export function view(r,now){const q=r.deck[r.index],asking=['question','final'].includes(r.phase);return{code:r.code,host:r.host,epoch:r.epoch,rev:r.rev,phase:r.phase,index:r.index,players:r.players.map(p=>({...p})),deadline:r.deadline,serverNow:now,answered:Object.keys(r.answers),betted:Object.keys(r.bets),ready:r.ready.slice(),token:token(r),cat:q?.cat||null,question:asking?{q:q.q,options:q.options.slice(),value:r.index===20?null:r.index<10?200:400}:null,result:['result','done'].includes(r.phase)?r.result:null}}
