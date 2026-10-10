const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2]||'index.html','utf8');
const source=html.slice(html.indexOf('function monthlyKey('),html.indexOf('function renderMonthlyGoals('));
let sheetGoal='3,000,000';
const context={cfg:{monthlyGoals:{}},getRollProductionRows:()=>[{date:'09/10/2026'}],readMetric:()=>sheetGoal,formatDate:v=>v};
vm.createContext(context);vm.runInContext(source,context);
for(const value of [3000000,'3000000','3,000,000','3.000.000','3 000 000','3,000,000.00','3.000.000,00','3000000,00','3000000.00']){
  assert.equal(context.parseMonthlyProductionGoal(value),3000000,String(value));
  sheetGoal=value;assert.equal(context.getMonthlyProductionGoal(),3000000);
}
for(const value of ['',null,undefined,'invalid','30%','3,00,000',0,-1,Infinity])assert.equal(context.parseMonthlyProductionGoal(value),0,String(value));
context.cfg.monthlyGoals={'2026-10':2500000,'2026-11':2800000};
assert.equal(context.getMonthlyProductionGoal(),2500000);
assert.equal(context.getMonthlyProductionGoal('01/11/2026'),2800000);
context.cfg.monthlyGoals={};sheetGoal='3,000,000';
assert.equal((991153/context.getMonthlyProductionGoal()*100).toFixed(2),'33.04');
assert.equal(Math.round((context.getMonthlyProductionGoal()-991153)/15),133923);
sheetGoal='invalid';assert.equal(context.getMonthlyProductionGoal(),3000000);
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))if(match[1].trim())new Function(match[1]);
console.log('PASS: goal formats, invalid values, month selection, 33.04% compliance, daily requirement and script syntax');
