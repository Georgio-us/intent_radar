import type {Language,Topic,Stream} from './catalog.ts';
export const ANALYZER_VERSION='rules-0.2';
export const labels:Record<string,string>={contractor:'Ищет исполнителя',solution:'Ищет решение',discussion:'Обсуждение',mention:'Упоминание',offer:'Предлагает услуги',problem:'Описывает проблему',unmatched:'Нет совпадений'};
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Exact words for Latin brand names and acronyms; stems remain useful for inflected Cyrillic terms.
export function hasTerm(text:string,term:string){
 const t=term.trim();if(!t)return false;
 if(/^[a-z0-9. ]+$/i.test(t)||['срм','црм','бот'].includes(t.toLowerCase()))return new RegExp(`(?<![\\p{L}\\p{N}])${escape(t)}(?![\\p{L}\\p{N}])`,'iu').test(text);
 return text.toLocaleLowerCase().includes(t.toLocaleLowerCase());
}
export function detectLanguage(text:string):{code:Language;confidence:'low'|'medium';evidence:string[]}{
 const signals:Record<string,RegExp>={
  uk:/[іїєґ]|(?<!\p{L})(потрібна|потрібен|шукаю|нерухомості|клієнтів|хто|який|будь)(?!\p{L})/giu,
  ru:/(?<!\p{L})(ищу|нужен|нужна|нужно|нужны|кто|какой|посоветуйте|недвижимости|клиентов|для|это|как|нам|нет|который|сделать|пользуется|разработчика|подрядчика)(?!\p{L})|[ыэёъ]/giu,
  en:/(?<!\p{L})(the|a|an|need|looking|for|our|we|can|anyone|recommend|which|using|estate|with|developer|website|want|not)(?!\p{L})/giu,
  es:/(?<!\p{L})(necesito|busco|para|una|un|la|el|que|alguien|recomienda|inmobiliaria|inmobiliario|desarrollador|datos|automatizar|clientes|qué|usáis|web)(?!\p{L})/giu
 };
 const scores=Object.entries(signals).map(([code,re])=>({code:code as Language,hits:[...text.matchAll(re)].map(x=>x[0])})).sort((a,b)=>b.hits.length-a.hits.length);
 const [a,b]=scores;if(a.hits.length<2)return {code:'und',confidence:'low',evidence:a.hits};
 if(b.hits.length>=2&&b.hits.length>=a.hits.length*.7)return {code:'mixed',confidence:'low',evidence:[...a.hits,...b.hits].slice(0,8)};
 return {code:a.code,confidence:a.hits.length>=4?'medium':'low',evidence:a.hits.slice(0,8)};
}
export function analyze(text:string,topics:Topic[]){
 const found=topics.filter(t=>t.enabled&&t.words.some(w=>hasTerm(text,w)));
 const words=[...new Set(found.flatMap(t=>t.words.filter(w=>hasTerm(text,w))))];
 const checks:[string,RegExp][]=[
 ['contractor',/(?<!\p{L})(ищу|ищем|нужен|нужна|нужны|шукаю|шукаємо|потрібен|потрібна|looking for|need|hire|busco|buscamos|necesito)\s+(?:(?:a|an|un|una|нам|мне|нам потрібен)\s+)?(?:опытного\s+|хорошего\s+|досвідченого\s+|experienced\s+|reliable\s+|web\s+|website\s+|software\s+){0,2}(?:специалист\p{L}*|подрядчик\p{L}*|разработчик\p{L}*|таргетолог\p{L}*|программист\p{L}*|розробник\p{L}*|програміст\p{L}*|спеціаліст\p{L}*|developer|agency|specialist|marketer|desarrollador\p{L}*|agencia|especialista)/iu],
 ['contractor',/recommend (?:a |an )?(?:website |web |software )?developer/iu],
 ['offer',/настраиваем|наше агентство поможет|предлагаем|предлагаю|пропонуємо|пропоную|we offer|i offer|our agency offers|ofrecemos|ofrezco/iu],
 ['solution',/ищу|ищем|шукаю|шукаємо|потрібна|потрібен|потрібно|нужна|нужен|нужно|нужны|посоветуйте|порадьте|\bi need\b|\bwe need\b|\bneed a\b|\bnecesito\b|\bnecesitamos\b|\brecomienda\b/iu],
 ['problem',/гублять|теряются|заявок почти нет|нет заявок|немає заявок|losing leads|no leads|lost leads|perdemos leads|sin clientes|не работает|не працює/iu],
 ['discussion',/кто какой|хто чим|пользуется|користується|which crm|what crm|anyone using|qué crm|que crm|usáis/iu]
 ];
 const negation=/(?:не|not|no)\s+(?:нуж[а-я]*|потріб[а-яіїє]*|ищ[а-я]*|шука[а-яіїє]*|looking|need|busco|necesito)/iu.test(text);
 const match=checks.find(([,r])=>r.test(text));
 const category=found.length?(negation&&['solution','contractor'].includes(match?.[0]??'')?'mention':match?.[0]??'mention'):'unmatched';
 const evidence=match&&category===match[0]?text.match(match[1])?.[0]??'':'';
 const property=text.match(/недвижим\p{L}*|нерухом\p{L}*|риелтор\p{L}*|ріелтор\p{L}*|застройщик\p{L}*|забудовник\p{L}*|загородные дома|real estate|realtor\p{L}*|property agency|inmobiliari\p{L}*/iu)?.[0];
 const adjacent=text.match(/ремонт\p{L}*|строитель\p{L}*|будівниц\p{L}*|інтер’єр\p{L}*|интерьер\p{L}*|renovation|construction|interior design|reformas|construcción/iu)?.[0];
 const industry=property?'property':adjacent?'adjacent':'unknown';
 const score=category==='unmatched'?0:({contractor:60,solution:40,problem:30,discussion:10,mention:0,offer:-20}[category]??0)+(property?25:adjacent?10:0);
 return {version:ANALYZER_VERSION,category,topicIds:found.map(t=>t.id),topics:found.map(t=>t.name),words,evidence,industry,industryEvidence:property??adjacent??'',score,language:detectLanguage(text),priority:category==='contractor'?'high':category==='solution'||category==='problem'?'medium':'low'};
}
export type Analysis=ReturnType<typeof analyze>;
export function streamExclusions(a:Analysis,stream:Stream,language:Language,projectCountry:string|null=null){
 const reasons:string[]=[];
 if(!a.topicIds.length)reasons.push('no_topic');
 if(language==='und'?!stream.includeUnknownLanguage:stream.languages.length>0&&!stream.languages.includes(language))reasons.push('language');
 if(stream.topicIds.length&&!stream.topicIds.some(t=>a.topicIds.includes(t)))reasons.push('topic');
 if(stream.intentIds.length&&!stream.intentIds.includes(a.category))reasons.push('intent');
 if(stream.industry==='property'&&!['property','adjacent'].includes(a.industry))reasons.push('industry');
 if(projectCountry?stream.excludedProjectCountries.includes(projectCountry):!stream.includeUnknownGeography)reasons.push('geography');
 return reasons;
}
export function fragments(text:string,terms:string[]){
 const escaped=[...new Set(terms.filter(Boolean))].sort((a,b)=>b.length-a.length).map(escape);
 if(!escaped.length)return [{text,hit:false}];
 return text.split(new RegExp('('+escaped.join('|')+')','giu')).filter(Boolean).map(part=>({text:part,hit:terms.some(t=>t.toLocaleLowerCase()===part.toLocaleLowerCase())}));
}
