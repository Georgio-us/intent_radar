import {existsSync} from 'node:fs';
import {Store} from '../lib/store.ts';
import {allQueries,type SearchQuery} from '../lib/catalog.ts';
const store=new Store('data/radar.sqlite');
try{console.log(JSON.stringify({node:process.version,sqlite:'ready',schemaVersions:store.db.prepare('SELECT version FROM schema_migrations').all(),tokenConfigured:!!process.env.THREADS_ACCESS_TOKEN,envFileExists:existsSync('.env.local'),realPosts:store.count(),queryCount:store.get<SearchQuery[]>('queries',allQueries).length,enabledQueries:store.get<SearchQuery[]>('queries',allQueries).filter(q=>q.enabled).map(q=>q.id),requestCount24h:store.requestCount(),networkRequestsMadeByDoctor:0},null,2));}finally{store.close();}
