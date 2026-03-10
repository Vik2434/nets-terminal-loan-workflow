/**
 * Backward-compatible wrappers.
 * These keep older HTML calls working while the new API uses api* function names.
 */

function submitStep1(payload) {
  return apiSubmitRequest({
    requesterEmail: payload.reqEmail,
    requesterName: ((payload.reqFirst || '') + ' ' + (payload.reqLast || '')).trim(),
    division: payload.division,
    department: payload.division,
    onBehalf: payload.onBehalf || payload.on_behalf || false,
    borrowerFirst: payload.bFirst || '',
    borrowerLast: payload.bLast || '',
    borrowerEmail: payload.bEmail || '',
    relationship: payload.bRel || '',
    reason: payload.reason || '',
    purpose: payload.reason || '',
    startDate: payload.startDate || payload.needDate,
    endDate: payload.endDate || payload.returnDate,
    needDate: payload.startDate || payload.needDate,
    returnDate: payload.endDate || payload.returnDate,
    glCode: payload.glCode || payload.financeReference || '',
    financeReference: payload.glCode || payload.financeReference || '',
    costCentre: payload.costCentre || '',
    specialTrackingCode: payload.trackingCode || '',
    remarks: payload.remarks || payload.reason || '',
    timeOption: payload.timeOption || 'Full Day',
    eventName: payload.eventName || '',
    deploymentLocation: payload.location || '',
    location: payload.location || ''
  });
}

function submitStep2(payload) {
  return apiAssignTerminal({
    requestId: payload.requestId,
    terminalId: payload.terminal,
    remarks: payload.notes,
    collectionDateTime: payload.collectionDateTime || ''
  });
}

function submitStep3(payload) {
  if (String(payload.decision || '').toLowerCase() === 'rejected') {
    return apiRejectRequest({ requestId: payload.requestId, note: payload.note || payload.fixNote || '' });
  }
  return apiApproveRequest({ requestId: payload.requestId, note: payload.note || '' });
}
