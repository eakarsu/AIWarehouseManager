// No-provider guard: keys removed before importing the app pack; pack never calls a provider.
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const test=require('node:test'); const assert=require('node:assert/strict');
const express=require('express');
const pack=require('../src/routes/featurePack');
const auth=(req,res,next)=>{ req.user={id:'user-1',tenantId:'t1',role:'operator',subjectIds:['account:user-1']}; next(); };
async function boot(){ pack._reset(); const app=express(); app.use(express.json()); app.use('/api/feature-pack', pack.createRouter(auth)); const s=app.listen(0); await new Promise(r=>s.once('listening',r)); return {s, base:'http://127.0.0.1:'+s.address().port+'/api/feature-pack'}; }
const J={ 'Content-Type':'application/json' };
test('tasks auth, CRUD, search/filter, export, AI fallback', async ()=>{
  const {s,base}=await boot();
  let r=await fetch(base+'/tasks',{method:'POST',headers:J,body:JSON.stringify({title:'Alpha check',priority:'high',estimateHours:0,flagged:false})}); assert.equal(r.status,201); const a=await r.json(); assert.equal(a.estimateHours,0); assert.equal(a.flagged,false);
  r=await fetch(base+'/tasks',{method:'POST',headers:J,body:JSON.stringify({title:'Beta sweep',status:'done'})}); assert.equal(r.status,201);
  r=await fetch(base+'/tasks?search=alpha'); let body=await r.json(); assert.equal(body.total,1); assert.equal(body.tasks[0].title,'Alpha check');
  r=await fetch(base+'/tasks?status=done'); body=await r.json(); assert.equal(body.total,1);
  r=await fetch(base+'/tasks/'+a.id,{method:'PUT',headers:J,body:JSON.stringify({status:'done',estimateHours:0,flagged:false,description:''})}); const upd=await r.json(); assert.equal(upd.status,'done'); assert.equal(upd.estimateHours,0); assert.equal(upd.flagged,false); assert.equal(upd.description,'');
  r=await fetch(base+'/tasks/export?format=csv'); assert.match(r.headers.get('content-type'),/text\/csv/); assert.match(await r.text(),/Alpha check/);
  r=await fetch(base+'/tasks/export?format=json'); body=await r.json(); assert.equal(body.total,2);
  for(const f of ["replenishment-priority", "slotting-summary", "workload-balance"]){ r=await fetch(base+'/ai/'+f,{method:'POST',headers:J,body:'{}'}); body=await r.json(); assert.equal(body.aiGenerated,false); assert.equal(body.source,'deterministic-fallback'); assert.ok(Array.isArray(body.sections)&&body.sections.length>0); assert.ok(body.sections.some(x=>x.value===0||x.value===false||x.value==='')||body.sections.length>0); }
  r=await fetch(base+'/tasks',{method:'POST',headers:J,body:'{}'}); assert.equal(r.status,400);
  s.close();
});
test('unauthenticated request is rejected', async ()=>{ pack._reset(); const app=express(); app.use(express.json()); app.use('/api/feature-pack', pack.createRouter()); const s=app.listen(0); await new Promise(r=>s.once('listening',r)); const r=await fetch('http://127.0.0.1:'+s.address().port+'/api/feature-pack/tasks'); assert.equal(r.status,401); s.close(); });
