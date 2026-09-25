import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {defaults,defaultStreams,allQueries,type Topic} from './catalog.ts';
import {analyze,ANALYZER_VERSION} from './analysis.ts';
export type Media={id:string;text:string;permalink:string|null;publishedAt:string};
export type Run={id:string;query_id:string;query_text:string;since_at:string;until_at:string;started_at:string;finished_at:string|null;status:string;requests:number;received:number;inserted:number;skipped:number;message:string};
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export class Store {
 db:DatabaseSync;
 constructor(path:string){
  if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});
  this.db=new DatabaseSync(path);this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS feedback(id TEXT PRIMARY KEY,value TEXT NOT NULL)');
  this.db.exec(readFileSync(join(process.cwd(),'db/migrations/001_collector.sql'),'utf8'));
  this.db.prepare('INSERT OR IGNORE INTO schema_migrations VALUES (1,?)').run(new Date().toISOString());
  for(const [key,value] of Object.entries({topics:defaults,streams:defaultStreams,queries:allQueries}))this.db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run(key,JSON.stringify(value));
  if(!this.get('catalogV2',false)){const current=this.get<Topic[]>('topics',[]);for(const t of defaults){const old=current.find(x=>x.id===t.id);if(old)old.words=[...new Set([...old.words,...t.words])];else current.push(t);}this.set('topics',current);this.set('catalogV2',true);}
 }
 get<T>(key:string,fallback:T):T{const r=this.db.prepare('SELECT value FROM settings WHERE id=?').get(key) as {value:string}|undefined;return r?JSON.parse(r.value):fallback;}
 set(key:string,value:unknown){this.db.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));}
 feedback(id:string,value:string){this.db.prepare('INSERT INTO feedback VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(id,value);}
 hasPost(id:string){return !!this.db.prepare('SELECT id FROM posts WHERE id=?').get(id);}
 feedbackMap(){return new Map((this.db.prepare('SELECT id,value FROM feedback').all() as {id:string;value:string}[]).map(r=>[r.id,r.value]));}
 count(){return Number((this.db.prepare('SELECT count(*) AS n FROM posts').get() as {n:number}).n);}
 rows(limit=1000){return this.db.prepare('SELECT * FROM posts ORDER BY published_at DESC LIMIT ?').all(limit) as {id:string;text:string;permalink:string|null;published_at:string;first_seen_at:string;last_seen_at:string;project_country:string|null}[];}
 runs(){return this.db.prepare('SELECT * FROM query_runs ORDER BY started_at DESC LIMIT 40').all() as Run[];}
 startRun(queryId:string,text:string,since:string,until:string){const id=randomUUID();this.db.prepare("INSERT INTO query_runs(id,query_id,query_text,since_at,until_at,started_at,status) VALUES(?,?,?,?,?,?,'running')").run(id,queryId,text,since,until,new Date().toISOString());return id;}
 recordRequest(id:string){this.db.prepare('UPDATE query_runs SET requests=requests+1 WHERE id=?').run(id);}
 requestCount(){return Number((this.db.prepare('SELECT coalesce(sum(requests),0) AS n FROM query_runs WHERE started_at>=?').get(new Date(Date.now()-86400000).toISOString()) as {n:number}).n);}
 finishRun(id:string,status:'complete'|'partial'|'error',message:string){this.db.prepare('UPDATE query_runs SET status=?,message=?,finished_at=? WHERE id=?').run(status,message,new Date().toISOString(),id);}
 checkpoint(queryId:string,text:string){const r=this.db.prepare('SELECT completed_until FROM checkpoints WHERE query_id=? AND query_text=?').get(queryId,text) as {completed_until:string}|undefined;return r?.completed_until;}
 completeCheckpoint(queryId:string,text:string,until:string){this.db.prepare('INSERT INTO checkpoints VALUES (?,?,?) ON CONFLICT(query_id) DO UPDATE SET query_text=excluded.query_text,completed_until=excluded.completed_until').run(queryId,text,until);}
 ingestPage(media:Media[],runId:string,topics:Topic[],skipped=0){
  let inserted=0;const now=new Date().toISOString();this.db.exec('BEGIN IMMEDIATE');
  try{for(const p of media){if(!this.hasPost(p.id))inserted++;
   this.db.prepare('INSERT INTO posts(id,text,permalink,published_at,first_seen_at,last_seen_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET text=excluded.text,permalink=excluded.permalink,published_at=excluded.published_at,last_seen_at=excluded.last_seen_at').run(p.id,p.text,p.permalink,p.publishedAt,now,now);
   this.db.prepare('INSERT OR IGNORE INTO post_query_matches VALUES (?,?)').run(p.id,runId);
   this.storeAnalysis(p,topics);
  }
  this.db.prepare('UPDATE query_runs SET received=received+?,inserted=inserted+?,skipped=skipped+? WHERE id=?').run(media.length+skipped,inserted,skipped,runId);
  this.db.exec('COMMIT');return inserted;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 storeAnalysis(p:{id:string;text:string},topics:Topic[]){const result=analyze(p.text,topics);this.db.prepare('INSERT OR IGNORE INTO analyses VALUES (?,?,?,?,?,?)').run(p.id,ANALYZER_VERSION,hash(JSON.stringify(topics)),hash(p.text),JSON.stringify(result),new Date().toISOString());return result;}
 reanalyze(topics:Topic[]){const rows=this.db.prepare('SELECT id,text FROM posts').all() as {id:string;text:string}[];this.db.exec('BEGIN IMMEDIATE');try{for(const p of rows)this.storeAnalysis(p,topics);this.db.exec('COMMIT');return rows.length;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 acquire(){const now=Date.now(),owner=randomUUID();const r=this.db.prepare("INSERT INTO locks VALUES('collector',?,?) ON CONFLICT(name) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at WHERE locks.expires_at<?").run(owner,now+30*60000,now);if(!r.changes)return null;
  this.db.prepare("UPDATE query_runs SET status='error',finished_at=?,message='Предыдущий сбор был прерван; окно будет проверено повторно' WHERE status='running'").run(new Date().toISOString());return owner;
 }
 release(owner:string){this.db.prepare("DELETE FROM locks WHERE name='collector' AND owner=?").run(owner);}
 close(){this.db.close();}
}
