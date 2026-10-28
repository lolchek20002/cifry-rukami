import {test} from 'node:test';
import assert from 'node:assert/strict';
import {StableCount,countFingers} from './fingers.js';
test('stable count rejects brief changes and clears immediately',()=>{const s=new StableCount(130);assert.equal(s.update(5,0),null);assert.equal(s.update(5,140),5);assert.equal(s.update(2,150),5);assert.equal(s.update(5,190),5);assert.equal(s.update(null,200),null);assert.equal(s.update(0,210),null);assert.equal(s.update(0,350),0);});
test('extended non-thumb fingers are rotation invariant',()=>{const p=Array.from({length:21},()=>({x:0,y:0,z:0}));p[0]={x:0,y:1,z:0};for(const [m,a,b,t]of [[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]]){const x=m/30;p[m]={x,y:.6,z:0};p[a]={x,y:.4,z:0};p[b]={x,y:.2,z:0};p[t]={x,y:0,z:0};}assert.equal(countFingers(p),4);assert.equal(countFingers(p.map(({x,y,z})=>({x:-y,y:x,z}))),4);});
test('degenerate hand has no extended fingers',()=>assert.equal(countFingers(Array.from({length:21},()=>({x:0,y:0,z:0}))),0));
