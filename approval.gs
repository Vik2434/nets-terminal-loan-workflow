function requireApprovalAccess_() {
  var email = currentUserEmail_();
  ensure_(isAllowedDomainEmail_(email), 'Internal access only.');

  ensure_(hasApprovalAccess_(email), 'Approver access required.');
  return email;
}

function apiGetApprovalDashboardData() {
  try {
    var userEmail = requireApprovalAccess_();
    var pending = getNormalizedRequestsByStatuses_([NLF.STATUS.PENDING_APPROVAL]);

    pending.sort(function (a, b) {
      return (toDate_(a.requestDateTime) || 0) - (toDate_(b.requestDateTime) || 0);
    });

    return {
      ok: true,
      userEmail: userEmail,
      pending: pending
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function apiApproveRequest(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var actor = requireApprovalAccess_();

    var requestId = cleanText_((payload || {}).requestId);
    var note = cleanText_((payload || {}).note);
    ensure_(requestId, 'Request ID is required.');

    var record = findRequestRecordById_(requestId);
    ensure_(!!record, 'Request not found.');
    ensure_(record.normalized.status === NLF.STATUS.PENDING_APPROVAL, 'Request is not pending approval.');

    var oldStatus = record.normalized.status;
    setField_(record.obj, 'STATUS', NLF.STATUS.PENDING_TECH_ASSIGNMENT);
    setField_(record.obj, 'APPROVAL_REQUIRED', 'Y');
    setField_(record.obj, 'APPROVER_EMAIL', actor);
    setField_(record.obj, 'APPROVAL_NOTE', note || 'Approved for waitlist queue');
    setField_(record.obj, 'UPDATED_AT', now_());

    var techs = getTechEmails_();
    setField_(record.obj, 'OWNER_EMAIL', techs.length ? techs[0] : '');

    saveRequestObject_(record);

    writeWorkflowLog_(requestId, 'APPROVED', oldStatus, NLF.STATUS.PENDING_TECH_ASSIGNMENT, note || 'Approved for waitlist queue');

    var normalized = normalizeRequest_(record.obj);
    notifyApprovalDecision_(normalized, true, note);

    return { ok: true, request: normalized, message: 'Request approved and moved to tech queue.' };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

function apiRejectRequest(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var actor = requireApprovalAccess_();

    var requestId = cleanText_((payload || {}).requestId);
    var note = cleanText_((payload || {}).note);
    ensure_(requestId, 'Request ID is required.');

    var record = findRequestRecordById_(requestId);
    ensure_(!!record, 'Request not found.');
    ensure_(record.normalized.status === NLF.STATUS.PENDING_APPROVAL, 'Request is not pending approval.');

    var oldStatus = record.normalized.status;
    setField_(record.obj, 'STATUS', NLF.STATUS.REJECTED);
    setField_(record.obj, 'APPROVER_EMAIL', actor);
    setField_(record.obj, 'APPROVAL_NOTE', note || 'Rejected');
    setField_(record.obj, 'UPDATED_AT', now_());
    setField_(record.obj, 'OWNER_EMAIL', '');

    saveRequestObject_(record);

    writeWorkflowLog_(requestId, 'REJECTED', oldStatus, NLF.STATUS.REJECTED, note || 'Rejected by approver');

    var normalized = normalizeRequest_(record.obj);
    notifyApprovalDecision_(normalized, false, note);

    return { ok: true, request: normalized, message: 'Request rejected.' };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}
