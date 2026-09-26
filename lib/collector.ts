import {Store} from './store.ts';
import {fetchPage,ThreadsError} from './threads.ts';
import {defaults,allQueries,type Topic,type SearchQuery} from './catalog.ts';
export async function collect(store:Store,token:string,queryIds?:string[],fetcher?:typeof fetch){
 if(!token)throw new ThreadsError('missing_token','Добавьте токен THREADS_ACCESS_TOKEN в Variables сервиса Railway.');
 if(store.get<number>('cooldownUntil',0)>Date.now())throw new ThreadsError('cooldown','Ожидаем окончания паузы после ограничения API.');
 const queries=store.get<SearchQuery[]>('queries',allQueries).filter(q=>queryIds?queryIds.includes(q.id):q.enabled);
 if(!queries.length)throw new ThreadsError('no_queries','Не выбраны поисковые запросы.');

 const owner=store.acquire();if(!owner)throw new ThreadsError('busy','Сбор уже выполняется.');
 const topics=store.get<Topic[]>('topics',defaults),until=new Date().toISOString();let requests=0,inserted=0,received=0,partial=0;
 try{
 for(const q of queries){
  const checkpoint=store.checkpoint(q.id,q.text);
  const since=new Date(checkpoint?Date.parse(checkpoint)-10*60000:Date.parse(until)-86400000).toISOString();
  const runId=store.startRun(q.id,q.text,since,until);let after:string|undefined;const seen=new Set<string>();
  try{
   for(let page=0;page<2;page++){
    store.recordRequest(runId);requests++;
    const result=await fetchPage({token,query:q.text,since,until,after,fetcher});
    received+=result.media.length;
    inserted+=store.ingestPage(result.media,runId,topics,result.skipped);
    if(!result.hasNext){store.finishRun(runId,'complete',result.skipped?'Окно получено; часть объектов пропущена из-за отсутствия текста/даты.':'Окно получено в пределах выдачи API; полнота индекса неизвестна.');store.completeCheckpoint(q.id,q.text,until);break;}
    if(page===1||!result.after||seen.has(result.after)){partial++;store.finishRun(runId,'partial','Выдача неполная: лимит страниц или отсутствующий/повторный курсор. Контрольная дата не продвинута.');break;}
    seen.add(result.after);after=result.after;
   }
  }catch(e){const error=e instanceof ThreadsError?e:new ThreadsError('local','Ошибка локального сохранения; подробности проверяются локально.');store.finishRun(runId,'error',error.message);if(error.retryAfter)store.set('cooldownUntil',Date.now()+error.retryAfter*1000);throw error;}
 }
 return {requests,inserted,received,partial};
 }finally{store.release(owner);}
}
