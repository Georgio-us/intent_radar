import {collect} from '../../../lib/collector.ts';
import {getStore} from '../../../lib/db.ts';
import {ThreadsError} from '../../../lib/threads.ts';
import {localRequest} from '../../../lib/validation.ts';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!localRequest(req))return Response.json({error:'Недопустимый источник запроса'},{status:403});
 try{const body=await req.json().catch(()=>null);if(!body||typeof body.queryId!=='string')return Response.json({error:'Выберите язык и темы в скринере.'},{status:400});const result=await collect(getStore(),process.env.THREADS_ACCESS_TOKEN??'',[body.queryId]);return Response.json(result);}
 catch(e){const error=e instanceof ThreadsError?e:new ThreadsError('local','Ошибка локального сбора.');return Response.json({error:error.message,code:error.code},{status:error.code==='missing_token'?409:400});}
}
