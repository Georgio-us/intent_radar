import {Store} from './store.ts';
import {fetchPage,ThreadsError} from './threads.ts';
import {defaults,allQueries,type Topic,type SearchQuery} from './catalog.ts';
export const LOCAL_DAILY_BUDGET=100; // Our safety budget, not Meta's published quota.
export async function collect(store:Store,token:string,queryIds?:string[],fetcher?:typeof fetch){
 if(!token)throw new ThreadsError('missing_token','Сначала сохраните токен: npm run setup:token.');
 if(store.get<number>('cooldownUntil',0)>Date.now())throw new ThreadsError('cooldown','Ожидаем окончания паузы после ограничения API.');
 const queries=store.get<SearchQuery[]>('queries',allQueries).filter(q=>queryIds?queryIds.includes(q.id):q.enabled);
 if(!queries.length)throw new ThreadsError('no_queries','Не выбраны поисковые запросы.');
 if(queries.length>3)throw new ThreadsError('too_many_queries','Для первого исследования выбирайте не больше трёх запросов за запуск.');
 const owner=store.acquire();if(!owner)throw new ThreadsError('busy','Сбор уже выполняется.');
 const topics=store.get<Topic[]>('topics',defaults),until=new Date().toISOString();let requests=0,inserted=0;
 try{
 for(const q of queries){
  const checkpoint=store.checkpoint(q.id,q.text);
  const since=new Date(checkpoint?Date.parse(checkpoint)-10*60000:Date.parse(until)-86400000).toISOString();
  const runId=store.startRun(q.id,q.text,since,until);let after:string|undefined;const seen=new Set<string>();
  try{
   for(let page=0;page<2;page++){
    if(store.requestCount()>=LOCAL_DAILY_BUDGET)throw new ThreadsError('budget','Достигнут локальный бюджет 100 запросов за 24 часа. Это наше ограничение, не квота Meta.');
    store.recordRequest(runId);requests++;
    const result=await fetchPage({token,query:q.text,since,until,after,fetcher});
    inserted+=store.ingestPage(result.media,runId,topics,result.skipped);
    if(!result.hasNext){store.finishRun(runId,'complete',result.skipped?'Окно получено; часть объектов пропущена из-за отсутствия текста/даты.':'Окно получено в пределах выдачи API; полнота индекса неизвестна.');store.completeCheckpoint(q.id,q.text,until);break;}
    if(page===1||!result.after||seen.has(result.after)){store.finishRun(runId,'partial','Выдача неполная: лимит страниц или отсутствующий/повторный курсор. Контрольная дата не продвинута.');break;}
    seen.add(result.after);after=result.after;
   }
  }catch(e){const error=e instanceof ThreadsError?e:new ThreadsError('local','Ошибка локального сохранения; подробности проверяются локально.');store.finishRun(runId,'error',error.message);if(error.retryAfter)store.set('cooldownUntil',Date.now()+error.retryAfter*1000);throw error;}
 }
 return {requests,inserted};
 }finally{store.release(owner);}
}
