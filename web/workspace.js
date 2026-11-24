import {$,read,save} from './ui.js';
const key='daymeter-clock',defaultClock={total:1500000,left:1500000,end:0,history:[]};
let session=read(key,defaultClock);
const format=ms=>{const sec=Math.ceil(ms/1000);return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')};
function remaining(){return Math.max(0,session.end?session.end-Date.now():session.left)}
function store(){save(key,session)}
function stop(record){
 const elapsed=Math.max(0,session.total-remaining());
 if(record&&elapsed>=1000)session.history.unshift({at:session.end&&remaining()===0?session.end:Date.now(),ms:elapsed});
 session.left=session.total;session.end=0;store();history();render();
}
function history(){
 const list=$('#history'),week=$('#week');list.replaceChildren();week.replaceChildren();
 const rows=session.history.slice(0,12);
 for(const item of rows){const li=document.createElement('li');li.textContent=new Date(item.at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' · '+format(item.ms);list.append(li)}
 if(!rows.length){const li=document.createElement('li');li.textContent='Completed focus sessions appear here.';list.append(li)}
 const days=Array.from({length:7},(_,i)=>{const date=new Date();date.setDate(date.getDate()-6+i);const ms=session.history.filter(x=>new Date(x.at).toDateString()===date.toDateString()).reduce((sum,x)=>sum+x.ms,0);return {date,ms}});
 const peak=Math.max(1,...days.map(x=>x.ms));for(const {date,ms} of days){const day=document.createElement('div'),bar=document.createElement('i');day.className='day';bar.style.height=(70*ms/peak)+'px';day.title=date.toLocaleDateString()+' · '+format(ms);day.append(bar,date.toLocaleDateString(undefined,{weekday:'narrow'}));week.append(day)}
}
function render(){const left=remaining();if(session.end&&left===0){stop(true);return}
 $('#clock').textContent=format(left);$('#state').textContent=session.end?'Running':left===session.total?'Ready':'Paused';$('#toggle').textContent=session.end?'Pause':left===session.total?'Start':'Resume';$('#minutes').disabled=!!session.end||left<session.total;$('#finish').disabled=$('#reset').disabled=!session.end&&left===session.total}
$('#minutes').value=session.total/60000;
$('#minutes').onchange=e=>{if(!e.target.value||!e.target.checkValidity()){e.target.reportValidity();return}session.total=session.left=Number(e.target.value)*60000;store();render()};
$('#toggle').onclick=()=>{if(!$('#minutes').disabled&&!$('#minutes').reportValidity())return;if(session.end){session.left=remaining();session.end=0}else session.end=Date.now()+session.left;store();render()};
$('#finish').onclick=()=>stop(true);$('#reset').onclick=()=>stop(false);
addEventListener('storage',e=>{if(e.key===key){session=read(key,defaultClock);$('#minutes').value=session.total/60000;history();render()}});history();render();setInterval(render,240);
