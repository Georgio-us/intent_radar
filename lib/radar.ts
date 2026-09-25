import type {Language} from './catalog.ts';
export {defaults} from './catalog.ts';
export type {Topic,Language,Stream} from './catalog.ts';
export {analyze,fragments,labels} from './analysis.ts';
export type Post = {id:string; text:string; language:Language; age:string; feedback:string; permalink:string|null; publishedAt?:string; firstSeenAt?:string; projectCountry?:string|null};
export const examples:Post[] = [
 {id:'demo-1',text:'Хлопці, потрібна CRM для нерухомості. У нас невелика агенція, зараз усе в таблицях. Хто чим користується?',language:'uk',age:'Пример 01',feedback:'',permalink:null},
 {id:'demo-2',text:'Ищу специалиста, который внедрит CRM в агентстве недвижимости и перенесёт текущую базу клиентов. Посоветуйте проверенного человека.',language:'ru',age:'Пример 02',feedback:'',permalink:null},
 {id:'demo-3',text:'Ребят, а кто какой CRM пользуется? Интересно сравнить опыт разных команд.',language:'ru',age:'Пример 03',feedback:'',permalink:null},
 {id:'demo-4',text:'Это всё напоминает времена, когда появились CRM. Сначала обещали революцию, потом все вернулись к таблицам.',language:'ru',age:'Пример 04',feedback:'',permalink:null},
 {id:'demo-5',text:'Шукаю розробника: потрібен сайт для агентства нерухомості. Важливо мати каталог об’єктів двома мовами.',language:'uk',age:'Пример 05',feedback:'',permalink:null},
 {id:'demo-6',text:'Настраиваем рекламу в Facebook и Instagram под ключ. Наше агентство поможет увеличить продажи. Пишите в личку!',language:'ru',age:'Пример 06',feedback:'',permalink:null},
 {id:'demo-7',text:'Реклама працює, але менеджери гублять ліди. Не розумію, як налагодити облік звернень у відділі продажів.',language:'uk',age:'Пример 07',feedback:'',permalink:null},
 {id:'demo-8',text:'Посоветуйте, как улучшить сайт. Люди заходят, но заявок почти нет. Продаём загородные дома.',language:'ru',age:'Пример 08',feedback:'',permalink:null},
 {id:'demo-9',text:'Нужен специалист по таргету для проекта застройщика. Есть команда продаж и рекламный бюджет, ищем подрядчика на запуск.',language:'ru',age:'Пример 09',feedback:'',permalink:null},
 {id:'demo-10',text:'Моя мета на цей рік — більше часу проводити з родиною. Маркетинг може почекати.',language:'uk',age:'Пример 10',feedback:'',permalink:null}
];
