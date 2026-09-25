import {read,getStore,saveTopics,saveFeedback} from '../../../lib/db.ts';
import {examples} from '../../../lib/radar.ts';
import {validTopics,validStreams,validQueries,localRequest} from '../../../lib/validation.ts';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request){const source=new URL(req.url).searchParams.get('source')==='threads'?'threads':'demo';return Response.json(read(source),{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 if(!localRequest(req))return Response.json({error:'Недопустимый источник запроса'},{status:403});
 try{
 const raw=await req.text();if(raw.length>128000)return Response.json({error:'Слишком большой запрос'},{status:413});const body=JSON.parse(raw);
 if(body.type==='feedback'&&typeof body.id==='string'&&(examples.some(p=>p.id===body.id)||getStore().hasPost(body.id))&&['','useful','skip','replied'].includes(body.value))saveFeedback(body.id,body.value);
 else if(body.type==='topics'&&validTopics(body.topics))saveTopics(body.topics);
 else if(body.type==='streams'&&validStreams(body.streams))getStore().set('streams',body.streams);
 else if(body.type==='queries'&&validQueries(body.queries))getStore().set('queries',body.queries);
 else if(body.type==='reanalyze')getStore().reanalyze(getStore().get('topics',[]));
 else return Response.json({error:'Проверьте поля: названия и ключевые слова должны быть непустыми.'},{status:400});
 return Response.json(read(body.source==='threads'?'threads':'demo'));
 }catch{return Response.json({error:'Не удалось сохранить изменения'},{status:400});}
}
