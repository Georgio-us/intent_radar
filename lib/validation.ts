import {labels} from './analysis.ts';
import type {Topic,Stream,SearchQuery} from './catalog.ts';
const isObject=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=100):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const strings=(v:unknown,max=100):v is string[]=>Array.isArray(v)&&v.length<=max&&v.every(x=>text(x));
const uniqueIds=(v:unknown[])=>new Set(v.map(x=>isObject(x)?x.id:undefined)).size===v.length;
const languages=['ru','uk','en','es','mixed','other','und'];
export function validTopics(v:unknown):v is Topic[]{return Array.isArray(v)&&v.length>0&&v.length<=30&&uniqueIds(v)&&v.every(t=>isObject(t)&&text(t.id,80)&&text(t.name)&&typeof t.enabled==='boolean'&&strings(t.words)&&t.words.length>0);}
export function validStreams(v:unknown):v is Stream[]{return Array.isArray(v)&&v.length<=30&&uniqueIds(v)&&v.every(t=>isObject(t)&&text(t.id,80)&&text(t.name)&&strings(t.languages,7)&&t.languages.every(l=>languages.includes(l))&&strings(t.topicIds,30)&&strings(t.intentIds,10)&&t.intentIds.every(i=>i in labels)&&typeof t.includeUnknownLanguage==='boolean'&&['any','property'].includes(String(t.industry))&&strings(t.excludedProjectCountries,100)&&t.excludedProjectCountries.every(c=>/^[A-Z]{2}$/.test(c))&&typeof t.includeUnknownGeography==='boolean');}
export function validQueries(v:unknown):v is SearchQuery[]{return Array.isArray(v)&&v.length<=200&&uniqueIds(v)&&v.every(t=>isObject(t)&&text(t.id,80)&&text(t.topicId,80)&&text(t.text,200)&&languages.includes(String(t.language))&&['focused','broad'].includes(String(t.tier))&&typeof t.enabled==='boolean');}
export function localRequest(req:Request){
 const configured=process.env.APP_ORIGIN||(process.env.RAILWAY_PUBLIC_DOMAIN?'https://'+process.env.RAILWAY_PUBLIC_DOMAIN:'');
 const origins=configured?[configured]:['http://127.0.0.1:3100','http://localhost:3100'];
 return origins.some(origin=>{try{return req.headers.get('origin')===origin&&req.headers.get('host')===new URL(origin).host;}catch{return false;}});
}
