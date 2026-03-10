function allowedTransitions_() {
  var s = NLF.STATUS;
  var map = {};
  map[s.SUBMITTED] = [s.PENDING_APPROVAL, s.PENDING_TECH_ASSIGNMENT, s.CANCELLED];
  map[s.PENDING_APPROVAL] = [s.APPROVED, s.REJECTED, s.CANCELLED, s.PENDING_TECH_ASSIGNMENT];
  map[s.APPROVED] = [s.PENDING_TECH_ASSIGNMENT, s.REJECTED, s.CANCELLED];
  map[s.PENDING_TECH_ASSIGNMENT] = [s.ASSIGNED, s.READY_FOR_COLLECTION, s.CANCELLED, s.REJECTED];
  map[s.ASSIGNED] = [s.READY_FOR_COLLECTION, s.COMPLETED, s.CANCELLED];
  map[s.READY_FOR_COLLECTION] = [s.ON_LOAN, s.COMPLETED, s.CANCELLED, s.RETURNED];
  map[s.ON_LOAN] = [s.COMPLETED, s.RETURNED, s.CLOSED];
  map[s.COMPLETED] = [];
  map[s.RETURNED] = [s.CLOSED, s.COMPLETED];
  map[s.REJECTED] = [];
  map[s.CANCELLED] = [];
  map[s.CLOSED] = [];
  map[s.DRAFT] = [s.SUBMITTED, s.CANCELLED];
  return map;
}

function canTransition_(oldStatus, newStatus) {
  if (oldStatus === newStatus) return true;
  var map = allowedTransitions_();
  var allowed = map[oldStatus] || [];
  return allowed.indexOf(newStatus) >= 0;
}

function updateRequestStatus_(record, newStatus, notes, actorEmail) {
  var oldStatus = record.normalized.status;
  ensure_(canTransition_(oldStatus, newStatus), 'Invalid status transition: ' + oldStatus + ' -> ' + newStatus);

  var now = now_();
  setField_(record.obj, 'STATUS', newStatus);
  setField_(record.obj, 'UPDATED_AT', now);

  if (actorEmail) {
    if (newStatus === NLF.STATUS.READY_FOR_COLLECTION || newStatus === NLF.STATUS.ASSIGNED) {
      setField_(record.obj, 'ASSIGNED_TECH_EMAIL', actorEmail);
    }
  }

  if (newStatus === NLF.STATUS.ON_LOAN) {
    var existing = getField_(record.obj, 'COLLECTION_DATE_TIME', '');
    if (!existing) setField_(record.obj, 'COLLECTION_DATE_TIME', now);
  }

  if (newStatus === NLF.STATUS.COMPLETED || newStatus === NLF.STATUS.RETURNED || newStatus === NLF.STATUS.CLOSED) {
    setField_(record.obj, 'RETURNED_DATE_TIME', now);
  }

  setField_(record.obj, 'OWNER_EMAIL', currentOwnerFromStatus_(normalizeRequest_(record.obj)));

  saveRequestObject_(record);
  writeWorkflowLog_(record.normalized.requestId, 'STATUS_CHANGE', oldStatus, newStatus, notes || '');

  record.normalized = normalizeRequest_(record.obj);
  return record.normalized;
}
