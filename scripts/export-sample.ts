import {Store} from '../lib/store.ts';
import {defaults,type Topic} from '../lib/catalog.ts';
import {analyze} from '../lib/analysis.ts';
import {mkdirSync,writeFileSync} from 'node:fs';
const store=new Store('data/radar.sqlite');
try{const topics=store.get<Topic[]>('topics',defaults);const rows=store.rows(10000).map(p=>{const a=analyze(p.text,topics);return {id:p.id,text:p.text,permalink:p.permalink,publishedAt:p.published_at,firstSeenAt:p.first_seen_at,intent:null,industry:null,language:null,prediction:{intent:a.category,industry:a.industry,language:a.language.code},analyzerVersion:a.version};});mkdirSync('data',{recursive:true});writeFileSync('data/annotation.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+(rows.length?'\n':''));console.log(`Экспортировано ${rows.length} реальных публикаций в data/annotation.jsonl. Поля intent,industry,language заполняются человеком; prediction не является разметкой.`);}finally{store.close();}
