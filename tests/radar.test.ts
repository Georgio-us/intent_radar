import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyze,fragments,defaults} from '../lib/radar.ts';
test('separates recommendation request from contractor demand',()=>{assert.equal(analyze('Потрібна CRM для нерухомості',defaults).category,'solution');assert.equal(analyze('Ищу специалиста по CRM',defaults).category,'contractor');});
test('offer is not classified as demand',()=>assert.equal(analyze('Настраиваем рекламу под ключ',defaults).category,'offer'));
test('disabled topics do not match',()=>assert.equal(analyze('Потрібна CRM',defaults.map(t=>({...t,enabled:false}))).category,'unmatched'));
test('highlighting preserves original text and handles regex symbols',()=>{const text='CRM + crm? [test]';const f=fragments(text,['CRM','[test]']);assert.equal(f.map(x=>x.text).join(''),text);assert.equal(f.filter(x=>x.hit).length,3);});
test('incidental mention stays low priority',()=>assert.equal(analyze('Когда появились CRM, было много разговоров.',defaults).priority,'low'));
