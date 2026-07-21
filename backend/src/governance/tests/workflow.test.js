const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../domain');

function fixture() {
  return {
  facility:{id:'wh1',tenantId:'t1',sitePermissionVersion:'site1',safetyLimitVersion:'safe1',constraintVersion:'con1',retentionDays:30},
  assets:[{id:'a1',kind:'forklift',version:'a1',status:'available',capacityVersion:'cap1',locationVersion:'loc1',provenanceRef:'wms:1'}],
  events:[{id:'e1',assetId:'a1',observedAt:'2026-07-18T00:00:00Z',receivedAt:'2026-07-18T00:00:01Z',sourceVersion:'s1',unit:'kg',value:100,duplicate:false,stale:false}],
  job:{id:'j1',ownerId:'owner',constraintVersion:'con1',status:'approved'},
  decision:{id:'d1',jobId:'j1',modelVersion:'m1',constraintVersion:'con1',eventIds:['e1'],uncertaintyNote:'operator check',autonomousDispatch:false,operatorApproved:true,approvedBy:'reviewer',constraintsPassed:true},
  execution:{status:'receipt_recorded',feedbackAt:'2026-07-18T00:00:02Z',receiptRef:'wms:1'},
  validation:{datasetVersion:'ds1',forecastError:0.02,latencyMs:20,missedEvents:0,realizedOutcomeRecorded:true,constraintViolations:0}
};
}

test('accepts governed warehouse operation', () => {
  const result = evaluate(fixture(), { tenant: 't1', actor: 'owner' });
  assert.deepEqual(result.errors, []);
});

test('blocks unsafe or ungoverned warehouse operation', () => {
  const input = fixture();
  input.events[0].stale = true;
  assert.ok(evaluate(input, { tenant: 't1', actor: 'owner' }).errors.length > 0);
  assert.ok(evaluate(fixture(), { tenant: 'other', actor: 'owner' }).errors.length > 0);
});
