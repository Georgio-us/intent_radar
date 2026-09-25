import type {Media} from './store.ts';
export class ThreadsError extends Error{
 code:string;retryAfter:number;
 constructor(code:string,message:string,retryAfter=0){super(message);this.code=code;this.retryAfter=retryAfter;}
}
export function safePermalink(value:unknown):string|null{try{const u=new URL(String(value));return u.protocol==='https:'&&['threads.net','www.threads.net','threads.com','www.threads.com'].includes(u.hostname)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function parsePage(body:unknown){
 if(!body||typeof body!=='object'||!Array.isArray((body as {data?:unknown}).data))throw new ThreadsError('invalid_response','API вернул неожиданный формат; публикации не подменены демоданными.');
 const b=body as {data:unknown[];paging?:{next?:unknown;cursors?:{after?:unknown}}};const media:Media[]=[];let skipped=0;
 for(const raw of b.data){const p=raw as Record<string,unknown>|null;if(!p||typeof p.id!=='string'||!p.id||p.id.startsWith('demo-')||p.id.length>200||typeof p.text!=='string'||!p.text.trim()||p.text.length>100000||typeof p.timestamp!=='string'||!Number.isFinite(Date.parse(p.timestamp))){skipped++;continue;}media.push({id:p.id,text:p.text,permalink:safePermalink(p.permalink),publishedAt:new Date(p.timestamp).toISOString()});}
 const hasNext=typeof b.paging?.next==='string'&&!!b.paging.next;
 const after=hasNext&&typeof b.paging?.cursors?.after==='string'?b.paging.cursors.after:null;
 return {media,skipped,after,hasNext};
}
export async function fetchPage(args:{token:string;query:string;since:string;until:string;after?:string;fetcher?:typeof fetch}){
 if(!args.token)throw new ThreadsError('missing_token','Нужен токен Threads с доступом к поиску. Запустите npm run setup:token.');
 const url=new URL('https://graph.threads.net/v1.0/keyword_search');
 for(const [k,v] of Object.entries({q:args.query,search_type:'RECENT',search_mode:'KEYWORD',fields:'id,text,permalink,timestamp',limit:'50',since:String(Math.floor(Date.parse(args.since)/1000)),until:String(Math.floor(Date.parse(args.until)/1000)),...(args.after?{after:args.after}:{})}))url.searchParams.set(k,v);
 let response:Response;try{response=await(args.fetcher??fetch)(url,{signal:AbortSignal.timeout(20000),cache:'no-store',redirect:'error',headers:{Authorization:'Bearer '+args.token}});}catch{throw new ThreadsError('network','Не удалось связаться с Threads: сеть, тайм-аут или перенаправление.');}
 let body:any;try{body=await response.json();}catch{throw new ThreadsError('invalid_response','Threads вернул ответ без корректного JSON.');}
 const code=body?.error?.code;
 if(response.status===429||[4,17,32,613].includes(code)){const header=response.headers.get('retry-after');const parsed=Number(header);const seconds=header?(Number.isFinite(parsed)?parsed:(Date.parse(header)-Date.now())/1000):900;throw new ThreadsError('rate_limit','Лимит API. Сбор приостановлен; частота будет уточнена по фактической квоте.',Math.max(60,Math.min(86400,Number.isFinite(seconds)?seconds:900)));}
 if(response.status===401||code===190)throw new ThreadsError('token','Токен истёк или недействителен. Нужна повторная авторизация Threads.');
 if(response.status===403||[10,200].includes(code))throw new ThreadsError('permission','Нет доступа к поиску: проверьте threads_basic и threads_keyword_search, режим приложения и требования App Review.');
 if(!response.ok||body?.error)throw new ThreadsError('api',`Threads отклонил запрос (HTTP ${response.status}${typeof code==='number'?`, код ${code}`:''}). Нужно проверить доступ и параметры.`);
 return parsePage(body);
}
