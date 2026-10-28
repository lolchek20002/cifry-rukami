import {test} from 'node:test';
import assert from 'node:assert/strict';
import {StableCount,countFingers} from './fingers.js';
test('stable count rejects brief changes and clears immediately',()=>{const s=new StableCount(130);assert.equal(s.update(5,0),null);assert.equal(s.update(5,140),5);assert.equal(s.update(2,150),5);assert.equal(s.update(5,190),5);assert.equal(s.update(null,200),null);assert.equal(s.update(0,210),null);assert.equal(s.update(0,350),0);});
test('extended non-thumb fingers are rotation invariant',()=>{const p=Array.from({length:21},()=>({x:0,y:0,z:0}));p[0]={x:0,y:1,z:0};for(const [m,a,b,t]of [[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]]){const x=m/30;p[m]={x,y:.6,z:0};p[a]={x,y:.4,z:0};p[b]={x,y:.2,z:0};p[t]={x,y:0,z:0};}assert.equal(countFingers(p),4);assert.equal(countFingers(p.map(({x,y,z})=>({x:-y,y:x,z}))),4);});
test('degenerate hand has no extended fingers',()=>assert.equal(countFingers(Array.from({length:21},()=>({x:0,y:0,z:0}))),0));

function hand(raised = 5, curved = false) {
  const p = Array.from({length: 21}, () => ({x: 0, y: 0, z: 0}));
  p[0] = {x: 0, y: 1, z: 0};
  p[1] = {x: -.2, y: .85, z: 0};
  p[2] = {x: -.4, y: .7, z: 0};
  p[3] = raised === 5 ? {x: -.6, y: .55, z: 0} : {x: -.2, y: .65, z: 0};
  p[4] = raised === 5 ? {x: -.8, y: .4, z: 0} : {x: 0, y: .65, z: 0};
  [[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]].forEach(([m,a,b,t],i)=>{
    const x = (i - 1.5) * .15;
    p[m] = {x, y: .6, z: 0};
    p[a] = {x, y: .4, z: 0};
    if (i < raised) {
      p[b] = {x: x + (curved ? .07 : 0), y: .25, z: 0};
      p[t] = {x: x + (curved ? .16 : 0), y: .14, z: curved ? .04 : 0};
    } else {
      p[b] = {x, y: .55, z: -.05};
      p[t] = {x, y: .7, z: -.05};
    }
  });
  return p;
}
test('counts 0 through 5 including naturally curved raised fingers',()=>{
  for (let n=0;n<=5;n++) {
    assert.equal(countFingers(hand(n)),n,`straight ${n}`);
    assert.equal(countFingers(hand(n,true)),n,`curved ${n}`);
  }
});
test('counts both hands independently, mirrored and rotated', async()=>{
  const {countHands}=await import('./fingers.js');
  const left=hand(5,true), right=left.map(({x,y,z})=>({x:-y,y:x,z}));
  const result={landmarks:[left,right],worldLandmarks:[left,right]};
  assert.deepEqual(countHands(result),[5,5]);
  assert.equal(countHands(result).reduce((a,b)=>a+b,0),10);
});
test('majority smoothing tolerates a bad frame and accepts a new gesture',()=>{
  const s=new StableCount();
  for (let t=0;t<=300;t+=40)s.update(t===120?2:4,t);
  assert.equal(s.value,4);
  for(let t=320;t<=600;t+=40)s.update(10,t);
  assert.equal(s.value,10);
  assert.equal(s.update(null,640),null);
});
