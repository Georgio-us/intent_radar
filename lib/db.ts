import {join} from 'node:path';
import {Store} from './store.ts';
import {defaults,examples,type Topic,type Post} from './radar.ts';
import {defaultStreams,allQueries,type Stream,type SearchQuery} from './catalog.ts';
import {analyze} from './analysis.ts';
let database:Store;
export function getStore(){return database??=new Store(join(process.env.RADAR_DATA_DIR??join(process.cwd(),'data'),'radar.sqlite'));}
export function read(source='demo'){
 const store=getStore(),topics=store.get<Topic[]>('topics',defaults),feedback=store.feedbackMap();
 const posts:Post[]=source==='threads'?store.rows().map(p=>({id:p.id,text:p.text,permalink:p.permalink,publishedAt:p.published_at,firstSeenAt:p.first_seen_at,age:p.published_at,projectCountry:p.project_country,language:analyze(p.text,topics).language.code,feedback:feedback.get(p.id)??''})):examples.map(p=>({...p,feedback:feedback.get(p.id)??''}));
 return {topics,posts,source,streams:store.get<Stream[]>('streams',defaultStreams),queries:store.get<SearchQuery[]>('queries',allQueries),connection:{configured:!!process.env.THREADS_ACCESS_TOKEN,verified:store.runs().some(r=>r.status==='complete'||r.received>0),total:store.count(),shown:posts.length,used:store.requestCount(),cooldownUntil:store.get<number>('cooldownUntil',0)},runs:store.runs()};
}
export function saveTopics(topics:Topic[]){getStore().set('topics',topics);getStore().reanalyze(topics);}
export function saveFeedback(id:string,value:string){getStore().feedback(id,value);}
