import {join} from 'node:path';
import {Store} from '../lib/store.ts';
import {collect} from '../lib/collector.ts';
import {ThreadsError} from '../lib/threads.ts';
const token=process.env.THREADS_ACCESS_TOKEN;
if(!token){console.error('Нет токена. Сначала npm run setup:token. Никаких запросов не выполнено.');process.exit(1);}
const store=new Store(join(process.cwd(),'data','radar.sqlite'));
try{const result=await collect(store,token);console.log(JSON.stringify(result));}
catch(e){console.error(e instanceof ThreadsError?e.message:'Ошибка локального сбора');process.exitCode=1;}
finally{store.close();}
