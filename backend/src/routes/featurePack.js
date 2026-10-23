'use strict';
// Feature pack: authenticated tasks, search/filter, CSV/JSON export, deterministic AI fallback.
// No provider calls are made here; AI endpoints always use the labelled deterministic fallback.
const express = require('express');
const store = new Map(); let seq = 0;
function ownerOf(req){ const u=req.user||{}; return String(u.id ?? u.userId ?? u.email ?? 'unknown'); }
function requireUser(req,res,next){ if(!req.user) return res.status(401).json({error:'authentication required'}); next(); }
function pick(body, keys){ const out={}; for(const k of keys){ if(Object.prototype.hasOwnProperty.call(body||{},k)) out[k]=body[k]; } return out; }
const FIELDS=['title','description','status','priority','assignee','dueDate','estimateHours','flagged'];
function norm(body, base={}){ const p=pick(body,FIELDS); const t={...base,...p};
  if(t.title!==undefined) t.title=String(t.title);
  if(t.status===undefined||t.status===''||t.status===null) t.status = base.status ?? 'open';
  if(t.priority===undefined||t.priority===null) t.priority = base.priority ?? 'medium';
  if(t.estimateHours!==undefined && t.estimateHours!==null && t.estimateHours!=='') t.estimateHours=Number(t.estimateHours);
  if(t.flagged!==undefined) t.flagged=Boolean(t.flagged);
  return t; }
function ownTasks(req){ return [...store.values()].filter(t=>t.ownerId===ownerOf(req)); }
function filterTasks(tasks,q={}){ let out=[...tasks];
  if(q.search){ const s=String(q.search).toLowerCase(); out=out.filter(t=>[t.title,t.description,t.assignee,t.status,t.priority].some(v=>String(v??'').toLowerCase().includes(s))); }
  if(q.status) out=out.filter(t=>t.status===q.status);
  if(q.priority) out=out.filter(t=>t.priority===q.priority);
  if(q.assignee) out=out.filter(t=>t.assignee===q.assignee);
  return out; }
function esc(v){ const s=v===null||v===undefined?'':String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function toCsv(rows){ const cols=['id','title','description','status','priority','assignee','dueDate','estimateHours','flagged','ownerId','createdAt','updatedAt'];
  return [cols.join(','), ...rows.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n')+'\n'; }
function sections(pairs){ return pairs.map(([label,value])=>({label, value})); }
function envelope(feature, summary, pairs, recommendations){ return { aiGenerated:false, source:'deterministic-fallback', label:'Deterministic fallback \u2014 no provider call', feature, summary, sections:sections(pairs), recommendations }; }
const AI={
 'replenishment-priority'(tasks){ const open=tasks.filter(t=>t.status!=='done'); const crit=open.filter(t=>t.priority==='critical'||t.priority==='high');
   return envelope('replenishment-priority', crit.length?`Replenish ${crit.length} high-priority bin(s) first.`:'No urgent replenishment.',
    [['Total tasks',tasks.length],['Open',open.length],['Urgent',crit.length],['Flagged',tasks.filter(t=>t.flagged).length]], crit.slice(0,3).map(t=>`Replenish first: ${t.title}`)); },
 'slotting-summary'(tasks){ const done=tasks.filter(t=>t.status==='done').length;
   return envelope('slotting-summary', `${done} of ${tasks.length} slotting task(s) complete.`,
    [['Total tasks',tasks.length],['Completed',done],['Completion %',tasks.length?Math.round(done/tasks.length*100):0]], ['Review open slotting tasks for fast-moving SKUs.']); },
 'workload-balance'(tasks){ const open=tasks.filter(t=>t.status!=='done');
   return envelope('workload-balance', `${open.reduce((a,t)=>a+(Number(t.estimateHours)||0),0)} open hour(s) across ${open.length} task(s).`,
    [['Total tasks',tasks.length],['Open',open.length],['Unassigned',open.filter(t=>!t.assignee).length],['Open hours',open.reduce((a,t)=>a+(Number(t.estimateHours)||0),0)]], open.filter(t=>!t.assignee).slice(0,3).map(t=>`Assign picker: ${t.title}`)); },
};
function createRouter(authenticate){
  const router=express.Router();
  if(authenticate) router.use(authenticate);
  router.use(requireUser);
  router.get('/tasks',(req,res)=>{ const rows=filterTasks(ownTasks(req), req.query); res.json({tasks:rows, total:rows.length}); });
  router.post('/tasks',(req,res)=>{ const b=req.body||{}; if(!b.title||!String(b.title).trim()) return res.status(400).json({error:'title is required'});
    const now=new Date().toISOString(); const task={id:++seq, ownerId:ownerOf(req), createdAt:now, updatedAt:now, description:'', assignee:'', dueDate:'', estimateHours:0, flagged:false, ...norm(b)}; store.set(task.id,task); res.status(201).json(task); });
  router.put('/tasks/:id',(req,res)=>{ const t=store.get(Number(req.params.id)); if(!t||t.ownerId!==ownerOf(req)) return res.status(404).json({error:'task not found'});
    const upd=norm(req.body||{}, t); if(upd.title!==undefined && !String(upd.title).trim()) return res.status(400).json({error:'title is required'});
    Object.assign(t, upd, {updatedAt:new Date().toISOString()}); res.json(t); });
  router.patch('/tasks/:id',(req,res)=>{ const t=store.get(Number(req.params.id)); if(!t||t.ownerId!==ownerOf(req)) return res.status(404).json({error:'task not found'});
    Object.assign(t, norm(req.body||{}, t), {updatedAt:new Date().toISOString()}); res.json(t); });
  router.get('/tasks/export',(req,res)=>{ const rows=filterTasks(ownTasks(req), req.query); const fmt=String(req.query.format||'json').toLowerCase();
    if(fmt==='csv'){ res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="tasks.csv"'); return res.send(toCsv(rows)); }
    if(fmt!=='json') return res.status(400).json({error:'format must be csv or json'});
    res.setHeader('Content-Disposition','attachment; filename="tasks.json"'); res.json({tasks:rows, total:rows.length}); });
  for(const [name,fn] of Object.entries(AI)) router.post('/ai/'+name,(req,res)=>{ const rows=filterTasks(ownTasks(req), req.body||{}); res.json(fn(rows)); });
  return router;
}
module.exports={createRouter, filterTasks, toCsv, sections, AI, _reset(){store.clear(); seq=0;}};
module.exports.default=createRouter();
