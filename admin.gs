function hasTechPortalAccess_(email) {
  return hasTechAccess_(email);
}

function normalizeTechQueueStatus_(statusValue) {
  var raw = cleanText_(statusValue || '').toLowerCase();
  if (!raw) return NLF.STATUS.SUBMITTED;
  if (raw === 'submitted') return NLF.STATUS.SUBMITTED;
  if (raw === 'pending approval') return NLF.STATUS.PENDING_APPROVAL;
  if (raw === 'approved') return NLF.STATUS.APPROVED;
  if (raw === 'pending tech assignment' || raw === 'pending it assignment') return NLF.STATUS.PENDING_TECH_ASSIGNMENT;
  if (raw === 'assigned') return NLF.STATUS.ASSIGNED;
  if (raw === 'finance notified') return 'Finance Notified';
  if (raw === 'ready for collection') return NLF.STATUS.READY_FOR_COLLECTION;
  if (raw === 'on loan') return NLF.STATUS.ON_LOAN;
  if (raw === 'completed') return NLF.STATUS.COMPLETED;
  if (raw === 'returned') return NLF.STATUS.RETURNED;
  return cleanText_(statusValue || '');
}

function toTechRequestDto_(req) {
  var requestId = cleanText_(req.requestId || req.id || '');
  var requesterName = cleanText_(req.requesterName || ((req.requesterFirst || '') + ' ' + (req.requesterLast || '')).trim() || req.requester || req.requesterEmail || '');
  var needDate = cleanText_(req.needDate || req.startDate || '');
  var returnDate = cleanText_(req.returnDate || req.endDate || '');

  return {
    requestId: requestId,
    status: normalizeTechQueueStatus_(req.status || ''),
    requesterName: requesterName,
    requesterEmail: normalizeEmail_(req.requesterEmail || ''),
    department: cleanText_(req.department || req.division || ''),
    purpose: cleanText_(req.purpose || req.reason || ''),
    eventName: cleanText_(req.eventName || ''),
    location: cleanText_(req.location || ''),
    needDate: needDate,
    returnDate: returnDate,
    assignedTerminalId: cleanText_(req.assignedTerminalId || req.terminal || ''),
    budgetCodes: cleanText_(req.budgetCodes || ''),
    financeReference: cleanText_(req.financeReference || ''),
    costCentre: cleanText_(req.costCentre || ''),
    financeNotified: parseBool_(req.financeNotified)
  };
}

function toTechTerminalDto_(terminal) {
  return {
    terminalId: cleanText_(terminal.terminalId || terminal.terminalNumber || ''),
    terminalNumber: cleanText_(terminal.terminalNumber || terminal.terminalId || ''),
    status: normalizeTerminalStatus_(terminal.status || 'Available'),
    lastUsedBy: cleanText_(terminal.lastUsedBy || ''),
    lastUsedDate: cleanText_(terminal.lastUsedDate || ''),
    notes: cleanText_(terminal.notes || ''),
    location: cleanText_(terminal.location || ''),
    serialNumber: cleanText_(terminal.serialNumber || '')
  };
}

function requireTechAccess_(fallbackEmail) {
  var email = currentUserEmail_() || normalizeEmail_(fallbackEmail || '');
  ensure_(isAllowedDomainEmail_(email), 'Internal access only.');
  ensure_(hasTechPortalAccess_(email), 'Tech access required.');
  return email;
}

function apiGetTechDashboardData(payload) {
  try {
    var email = requireTechAccess_((payload || {}).actorEmail);
    var requests = getNormalizedRequestsByStatuses_([
      NLF.STATUS.APPROVED,
      NLF.STATUS.PENDING_TECH_ASSIGNMENT,
      NLF.STATUS.ASSIGNED,
      'Finance Notified',
      NLF.STATUS.READY_FOR_COLLECTION,
      NLF.STATUS.ON_LOAN,
      NLF.STATUS.COMPLETED,
      NLF.STATUS.RETURNED,
      NLF.STATUS.SUBMITTED
    ]).map(toTechRequestDto_);
    var terminals = listTerminals_().map(toTechTerminalDto_);

    var queue = requests.filter(function (req) {
      if (!cleanText_(req.requestId)) return false;
      return [
        NLF.STATUS.APPROVED,
        NLF.STATUS.PENDING_TECH_ASSIGNMENT,
        NLF.STATUS.ASSIGNED,
        'Finance Notified',
        NLF.STATUS.READY_FOR_COLLECTION,
        NLF.STATUS.ON_LOAN,
        NLF.STATUS.COMPLETED,
        NLF.STATUS.RETURNED,
        NLF.STATUS.SUBMITTED
      ].indexOf(req.status) >= 0;
    });

    queue.sort(function (a, b) {
      return (toDate_(a.needDate) || 0) - (toDate_(b.needDate) || 0);
    });

    var nowDate = toDate_(toYmd_(now_()));
    var overdue = queue.filter(function (req) {
      return req.status === NLF.STATUS.ON_LOAN && toDate_(req.returnDate) && toDate_(req.returnDate).getTime() < nowDate.getTime();
    });

    var pendingQueue = queue.filter(function (req) {
      return [
        NLF.STATUS.SUBMITTED,
        NLF.STATUS.PENDING_TECH_ASSIGNMENT,
        NLF.STATUS.APPROVED
      ].indexOf(req.status) >= 0;
    });

    var activeItems = queue.filter(function (req) {
      return [NLF.STATUS.ASSIGNED, 'Finance Notified', NLF.STATUS.READY_FOR_COLLECTION, NLF.STATUS.ON_LOAN].indexOf(req.status) >= 0;
    });

    return {
      ok: true,
      userEmail: email,
      queue: queue || [],
      pendingQueue: pendingQueue || [],
      activeItems: activeItems || [],
      overdue: overdue || [],
      terminals: terminals || [],
      generatedAt: toIso_(now_())
    };
  } catch (err) {
    return {
      ok: false,
      error: 'TECH_DASHBOARD_LOAD_FAILED: ' + err.message,
      queue: [],
      pendingQueue: [],
      activeItems: [],
      overdue: [],
      terminals: []
    };
  }
}

function apiAssignTerminal(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var actor = requireTechAccess_((payload || {}).actorEmail);

    var requestId = cleanText_((payload || {}).requestId);
    var terminalId = cleanText_((payload || {}).terminalId);
    var remarks = cleanText_((payload || {}).remarks);
    var collectionDateTime = toDate_((payload || {}).collectionDateTime) || now_();

    ensure_(requestId, 'Request ID is required.');
    ensure_(terminalId, 'Terminal ID is required.');

    var record = findRequestRecordById_(requestId);
    ensure_(!!record, 'Request not found.');
    var selectedTerminal = listTerminals_().filter(function (t) {
      return cleanText_(t.terminalId) === terminalId || cleanText_(t.terminalNumber) === terminalId;
    })[0];
    ensure_(!!selectedTerminal, 'Selected terminal not found.');
    ensure_(normalizeTerminalStatus_(selectedTerminal.status) === 'Available', 'Selected terminal is not available.');

    ensure_([
      NLF.STATUS.SUBMITTED,
      NLF.STATUS.PENDING_TECH_ASSIGNMENT,
      NLF.STATUS.ASSIGNED,
      NLF.STATUS.APPROVED
    ].indexOf(record.normalized.status) >= 0, 'Request is not in assignable status.');

    ensure_(isTerminalAvailableForRange_(terminalId, record.normalized.needDate, record.normalized.returnDate, requestId),
      'Selected terminal is not available for the requested date range.');

    setField_(record.obj, 'ASSIGNED_TERMINAL_ID', selectedTerminal.terminalNumber || selectedTerminal.terminalId);
    setField_(record.obj, 'ASSIGNED_TECH_EMAIL', actor);
    setField_(record.obj, 'COLLECTION_DATE_TIME', collectionDateTime);
    setField_(record.obj, 'FINANCE_NOTIFIED', 'Y');
    setField_(record.obj, 'UPDATED_AT', now_());
    setField_(record.obj, 'REMARKS', remarks || getField_(record.obj, 'REMARKS', ''));
    setField_(record.obj, 'OWNER_EMAIL', record.normalized.requesterEmail);

    var oldStatus = record.normalized.status;
    var nextStatus = NLF.STATUS.ASSIGNED;
    setField_(record.obj, 'STATUS', nextStatus);

    saveRequestObject_(record);

    updateTerminalState_(selectedTerminal.terminalId || selectedTerminal.terminalNumber, {
      status: 'In Use',
      currentRequestId: requestId,
      currentHolder: record.normalized.requesterName,
      lastAssignedDate: now_(),
      terminalNumber: selectedTerminal.terminalNumber,
      terminalId: selectedTerminal.terminalId,
      notes: remarks || 'Assigned for ' + requestId
    });

    writeWorkflowLog_(requestId, 'TERMINAL_ASSIGNED', oldStatus, nextStatus, 'Terminal ' + (selectedTerminal.terminalNumber || terminalId) + ' assigned by ' + actor);

    var normalized = normalizeRequest_(record.obj);
    notifyAssignment_(normalized);

    return { ok: true, request: normalized, message: 'Terminal assigned.' };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

function apiMarkCollected(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var actor = requireTechAccess_((payload || {}).actorEmail);
    var requestId = cleanText_((payload || {}).requestId);
    ensure_(requestId, 'Request ID is required.');

    var record = findRequestRecordById_(requestId);
    ensure_(!!record, 'Request not found.');
    ensure_(record.normalized.status === NLF.STATUS.READY_FOR_COLLECTION || record.normalized.status === NLF.STATUS.ASSIGNED,
      'Request is not ready for collection.');

    var oldStatus = record.normalized.status;
    setField_(record.obj, 'STATUS', NLF.STATUS.ON_LOAN);
    setField_(record.obj, 'COLLECTION_DATE_TIME', now_());
    setField_(record.obj, 'UPDATED_AT', now_());
    setField_(record.obj, 'OWNER_EMAIL', record.normalized.requesterEmail);
    saveRequestObject_(record);

    writeWorkflowLog_(requestId, 'COLLECTED', oldStatus, NLF.STATUS.ON_LOAN, 'Marked collected by ' + actor);
    return { ok: true, request: normalizeRequest_(record.obj) };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

function apiMarkReturned(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var actor = requireTechAccess_((payload || {}).actorEmail);
    var requestId = cleanText_((payload || {}).requestId);
    ensure_(requestId, 'Request ID is required.');

    var record = findRequestRecordById_(requestId);
    ensure_(!!record, 'Request not found.');
    ensure_(
      record.normalized.status === NLF.STATUS.ON_LOAN ||
      record.normalized.status === NLF.STATUS.READY_FOR_COLLECTION ||
      record.normalized.status === NLF.STATUS.ASSIGNED ||
      cleanText_(record.normalized.status).toLowerCase() === 'finance notified',
      'Request is not returnable.');

    var oldStatus = record.normalized.status;
    setField_(record.obj, 'STATUS', NLF.STATUS.COMPLETED);
    setField_(record.obj, 'RETURNED_DATE_TIME', now_());
    setField_(record.obj, 'UPDATED_AT', now_());
    setField_(record.obj, 'OWNER_EMAIL', '');
    saveRequestObject_(record);

    if (record.normalized.assignedTerminalId) {
      updateTerminalState_(record.normalized.assignedTerminalId, {
        status: 'Available',
        currentRequestId: '',
        currentHolder: '',
        lastAssignedDate: now_(),
        notes: 'Returned from ' + requestId
      });
    }

    writeWorkflowLog_(requestId, 'REQUEST_COMPLETED', oldStatus, NLF.STATUS.COMPLETED, 'Terminal returned and request completed by ' + actor);

    var normalized = normalizeRequest_(record.obj);
    notifyReturned_(normalized);

    return { ok: true, request: normalized, message: 'Request marked completed.' };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

function apiUpdateTerminalStatus(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var actor = requireTechAccess_((payload || {}).actorEmail);
    var terminalId = cleanText_((payload || {}).terminalId);
    var status = normalizeTerminalStatus_(cleanText_((payload || {}).status));
    var notes = cleanText_((payload || {}).notes);

    ensure_(terminalId, 'Terminal is required.');
    ensure_(['Available', 'In Use', 'Under maintenance'].indexOf(status) >= 0, 'Invalid terminal status.');

    updateTerminalState_(terminalId, {
      status: status,
      lastUsedBy: actor,
      lastUsedDate: now_(),
      notes: notes
    });

    writeWorkflowLog_('', 'TERMINAL_STATUS_UPDATE', '', '', terminalId + ' set to ' + status + ' by ' + actor);
    return { ok: true, message: 'Terminal status updated.' };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}
