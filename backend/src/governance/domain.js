'use strict';
function evaluate(input = {}, context = {}) {
  const errors = [];
  const facility = input.facility || {};
  const assets = input.assets || [];
  const events = input.events || [];
  const job = input.job || {};
  const decision = input.decision || {};
  const execution = input.execution || {};
  const validation = input.validation || {};
  if (!facility.id || !facility.tenantId || facility.tenantId !== context.tenant || !facility.sitePermissionVersion || !facility.safetyLimitVersion
      || !facility.constraintVersion || !facility.retentionDays) errors.push('scoped warehouse facility required');
  const assetIds = new Set();
  for (const asset of assets) {
    if (!asset.id || assetIds.has(String(asset.id)) || !asset.kind || !asset.version || !asset.status
        || !asset.capacityVersion || !asset.locationVersion || !asset.provenanceRef) errors.push('versioned warehouse asset invalid');
    assetIds.add(String(asset.id));
  }
  const eventIds = new Set();
  for (const event of events) {
    if (!event.id || eventIds.has(String(event.id)) || !assetIds.has(String(event.assetId)) || !event.observedAt
        || !event.receivedAt || !event.sourceVersion || !event.unit || !Number.isFinite(event.value)
        || event.duplicate || event.stale) errors.push('timestamped warehouse event invalid');
    eventIds.add(String(event.id));
  }
  if (!job.id || !job.ownerId || job.ownerId !== context.actor || !job.constraintVersion || !['planned','submitted','approved','executing','completed','failed','manual_recovery'].includes(job.status)) errors.push('warehouse job state invalid');
  if (!decision.id || decision.jobId !== job.id || !decision.modelVersion || !decision.constraintVersion
      || !decision.eventIds?.every((id) => eventIds.has(String(id))) || !decision.uncertaintyNote
      || decision.autonomousDispatch || decision.operatorApproved !== true || !decision.approvedBy
      || decision.approvedBy === job.ownerId || decision.constraintsPassed !== true) errors.push('independent constrained warehouse decision required');
  if (!['queued','receipt_recorded','failed','manual_recovery'].includes(execution.status) || !execution.feedbackAt
      || (execution.status === 'receipt_recorded' && !execution.receiptRef)) errors.push('execution feedback or recovery invalid');
  for (const key of ['datasetVersion','forecastError','latencyMs','missedEvents','realizedOutcomeRecorded']) {
    if (validation[key] === undefined) errors.push(`validation ${key} required`);
  }
  if (validation.constraintViolations !== 0) errors.push('historical constraint validation failed');
  return { errors, result: { facilityId: facility.id, assetCount: assets.length, disposition: errors.length ? 'revise' : 'operator-reviewed' },
    assumptions: ['No material-handling or inventory dispatch occurs without a provider receipt'],
    uncertainty: { systemsConnected: false, manualFallbackRequired: true } };
}
module.exports = { evaluate };
