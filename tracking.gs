function requestBelongsToUser_(request, userEmail) {
  return normalizeEmail_(request.requesterEmail) === normalizeEmail_(userEmail);
}

function normalizeTrackingRequestId_(value) {
  return cleanText_(value || '').toUpperCase();
}

function isLikelyRequestId_(requestId) {
  return /^REQ-\d{8}-[A-Z0-9]+$/.test(requestId);
}

function getTrackingHistoryByRequestId_(requestId) {
  var target = normalizeTrackingRequestId_(requestId);
  if (!target) return [];

  var rows = [];
  try {
    rows = getWorkflowRowsByRequestId_(target);
  } catch (err) {
    return [];
  }

  var events = rows.filter(function (row) {
    var id = normalizeTrackingRequestId_(row.obj.RequestID || row.obj.RequestId || row.obj.requestId || '');
    return id === target;
  }).map(function (row) {
    var actionAt = row.obj.ActionDateTime || row.obj.Timestamp || '';
    return {
      at: toIso_(actionAt),
      actionType: cleanText_(row.obj.ActionType || row.obj.Action || ''),
      oldStatus: cleanText_(row.obj.OldStatus || ''),
      newStatus: cleanText_(row.obj.NewStatus || row.obj.Status || ''),
      notes: cleanText_(row.obj.Notes || '')
    };
  });

  events.sort(function (a, b) {
    return (toDate_(a.at) || 0) - (toDate_(b.at) || 0);
  });

  return events;
}

function buildTrackingLifecycle_(request) {
  var status = cleanText_(request.status);
  var financeNotified = !!request.financeNotified;
  var isFinanceNotifiedStatus = status === 'Finance Notified';
  var completedStatuses = [NLF.STATUS.COMPLETED, NLF.STATUS.RETURNED, NLF.STATUS.CLOSED, NLF.STATUS.CANCELLED, NLF.STATUS.REJECTED];

  var submittedDone = true;
  var pendingItDone = [NLF.STATUS.PENDING_TECH_ASSIGNMENT, NLF.STATUS.ASSIGNED, 'Finance Notified', NLF.STATUS.READY_FOR_COLLECTION, NLF.STATUS.ON_LOAN].concat(completedStatuses).indexOf(status) >= 0;
  var assignedDone = [NLF.STATUS.ASSIGNED, 'Finance Notified', NLF.STATUS.READY_FOR_COLLECTION, NLF.STATUS.ON_LOAN].concat(completedStatuses).indexOf(status) >= 0;
  var financeDone = financeNotified || isFinanceNotifiedStatus || completedStatuses.indexOf(status) >= 0;
  var completedDone = completedStatuses.indexOf(status) >= 0;

  var active = 'Submitted';
  if (status === NLF.STATUS.PENDING_TECH_ASSIGNMENT) active = 'Pending IT Assignment';
  else if (status === 'Finance Notified') active = 'Finance Notified';
  else if ([NLF.STATUS.ASSIGNED, NLF.STATUS.READY_FOR_COLLECTION, NLF.STATUS.ON_LOAN].indexOf(status) >= 0) active = financeDone ? 'Finance Notified' : 'Assigned';
  else if (!completedDone && financeDone) active = 'Finance Notified';
  else if (completedDone) active = 'Completed';

  return [
    { key: 'submitted', label: 'Submitted', done: submittedDone, active: active === 'Submitted' },
    { key: 'pending_it', label: 'Pending IT Assignment', done: pendingItDone, active: active === 'Pending IT Assignment' },
    { key: 'assigned', label: 'Assigned', done: assignedDone, active: active === 'Assigned' },
    { key: 'finance_notified', label: 'Finance Notified', done: financeDone, active: active === 'Finance Notified' },
    { key: 'completed', label: 'Completed', done: completedDone, active: active === 'Completed' }
  ];
}

function getRequestById(requestId) {
  var id = normalizeTrackingRequestId_(requestId);
  if (!id) return null;

  var record = findRequestRecordById_(id);
  if (!record) return null;

  var req = record.normalized || normalizeRequest_(record.obj);
  var details = {
    requestId: req.requestId,
    id: req.requestId,
    status: req.status,
    requesterName: req.requesterName,
    requesterEmail: req.requesterEmail,
    division: req.department || '',
    location: req.location || '',
    startDate: req.needDate || '',
    endDate: req.returnDate || '',
    terminal: req.assignedTerminalId || '',
    submittedAt: req.submittedAt || req.requestDateTime || '',
    lastUpdated: req.lastUpdated || req.requestDateTime || '',
    reason: req.purpose || '',
    eventName: req.eventName || '',
    onBehalf: !!req.onBehalf,
    borrowerFirst: req.borrowerFirst || '',
    borrowerLast: req.borrowerLast || '',
    borrowerEmail: req.borrowerEmail || '',
    relationship: req.relationship || '',
    glCode: req.glCode || req.financeReference || '',
    costCentre: req.costCentre || '',
    specialTrackingCode: req.specialTrackingCode || '',
    plannedDays: req.plannedDays || '',
    remarks: req.remarks || '',
    assignedTechEmail: req.assignedTechEmail || '',
    collectionDateTime: req.collectionDateTime || '',
    returnedDateTime: req.returnedDateTime || '',
    financeNotified: !!req.financeNotified,
    ownerEmail: req.ownerEmail || ''
  };

  return details;
}

function apiGetTrackingByRequestId(payload) {
  try {
    var requestId = '';
    if (typeof payload === 'string') requestId = payload;
    else requestId = (payload || {}).requestId || (payload || {}).id || '';
    requestId = normalizeTrackingRequestId_(requestId);

    ensure_(!!requestId, 'Request ID is required.');
    ensure_(isLikelyRequestId_(requestId), 'Invalid request ID format.');

    var request = getRequestById(requestId);
    ensure_(!!request, 'Request not found.');

    var workflow = buildTrackingLifecycle_(request);
    var history = getTrackingHistoryByRequestId_(requestId);

    if (!history.length) {
      history.push({
        at: request.submittedAt || '',
        actionType: 'REQUEST_SUBMITTED',
        oldStatus: '',
        newStatus: request.status || 'Submitted',
        notes: 'Initial request submission'
      });
    }

    return {
      ok: true,
      request: request,
      workflow: workflow,
      history: history
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function canRequesterCancel_(request) {
  if (!isRequesterCancelEnabled_()) return false;
  var cancelableStatuses = [
    NLF.STATUS.SUBMITTED,
    NLF.STATUS.PENDING_APPROVAL,
    NLF.STATUS.PENDING_TECH_ASSIGNMENT,
    NLF.STATUS.ASSIGNED,
    NLF.STATUS.READY_FOR_COLLECTION
  ];
  return cancelableStatuses.indexOf(request.status) >= 0;
}

function canSendReminderForStatus_(status) {
  return [NLF.STATUS.PENDING_APPROVAL, NLF.STATUS.PENDING_TECH_ASSIGNMENT].indexOf(status) >= 0;
}

function apiGetTrackingData(filters) {
  try {
    var userEmail = currentUserEmail_();
    ensure_(isAllowedDomainEmail_(userEmail), 'Only internal users can access tracking.');

    var all = getAllRequests_();
    var mine = all.filter(function (req) {
      return requestBelongsToUser_(req, userEmail);
    });

    var requestId = cleanText_((filters || {}).requestId);
    if (requestId) {
      mine = mine.filter(function (req) { return req.requestId === requestId; });
    }

    mine.sort(function (a, b) {
      return (toDate_(b.requestDateTime) || 0) - (toDate_(a.requestDateTime) || 0);
    });

    var items = mine.map(function (req) {
      return {
        requestId: req.requestId,
        status: req.status,
        needDate: req.needDate,
        returnDate: req.returnDate,
        requesterName: req.requesterName,
        ownerEmail: req.ownerEmail,
        assignedTerminalId: req.assignedTerminalId,
        approvalRequired: req.approvalRequired,
        collectionDateTime: req.collectionDateTime,
        returnedDateTime: req.returnedDateTime,
        remarks: req.remarks,
        canRemind: canSendReminderForStatus_(req.status),
        canCancel: canRequesterCancel_(req),
        lastReminderSent: req.lastReminderSent
      };
    });

    return {
      ok: true,
      userEmail: userEmail,
      requests: items
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function apiSendReminder(requestId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var userEmail = currentUserEmail_();
    ensure_(isAllowedDomainEmail_(userEmail), 'Only internal users can send reminders.');

    var record = findRequestRecordById_(requestId);
    ensure_(!!record, 'Request not found.');
    ensure_(requestBelongsToUser_(record.normalized, userEmail) || getUserRole_(userEmail) === NLF.ROLE.ADMIN, 'Not allowed.');

    ensure_(canSendReminderForStatus_(record.normalized.status), 'Reminder is not allowed for this status.');

    var lastReminder = toDate_(getField_(record.obj, 'LAST_REMINDER_SENT', ''));
    var cooldownHours = getReminderCooldownHours_();
    if (lastReminder) {
      var elapsedHours = (now_().getTime() - lastReminder.getTime()) / (1000 * 60 * 60);
      ensure_(elapsedHours >= cooldownHours, 'Reminder cooldown active. Try again later.');
    }

    var targetOwner = record.normalized.ownerEmail || currentOwnerFromStatus_(record.normalized);
    ensure_(!!targetOwner, 'No owner found for reminder.');

    setField_(record.obj, 'LAST_REMINDER_SENT', now_());
    setField_(record.obj, 'UPDATED_AT', now_());
    saveRequestObject_(record);

    writeWorkflowLog_(record.normalized.requestId, 'REMINDER_SENT', record.normalized.status, record.normalized.status, 'Reminder sent by ' + userEmail);

    notifyReminder_(normalizeRequest_(record.obj), targetOwner, userEmail);

    if (record.normalized.status === NLF.STATUS.PENDING_APPROVAL) {
      var waitlistTarget = getWaitlistReminderEmail_();
      if (waitlistTarget && waitlistTarget !== targetOwner) {
        notifyReminder_(normalizeRequest_(record.obj), waitlistTarget, userEmail);
      }
    }

    return { ok: true, message: 'Reminder sent.' };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

function apiCancelRequest(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var requestId = cleanText_((payload || {}).requestId);
    var reason = cleanText_((payload || {}).reason);

    var userEmail = currentUserEmail_();
    ensure_(isAllowedDomainEmail_(userEmail), 'Only internal users can cancel requests.');

    var record = findRequestRecordById_(requestId);
    ensure_(!!record, 'Request not found.');
    ensure_(requestBelongsToUser_(record.normalized, userEmail) || getUserRole_(userEmail) === NLF.ROLE.ADMIN, 'Not allowed.');
    ensure_(canRequesterCancel_(record.normalized), 'Request can no longer be cancelled.');

    if (record.normalized.assignedTerminalId) {
      updateTerminalState_(record.normalized.assignedTerminalId, {
        status: 'Available',
        currentRequestId: '',
        currentHolder: '',
        lastAssignedDate: now_(),
        remarks: 'Released due to cancellation (' + record.normalized.requestId + ')'
      });
    }

    var oldStatus = record.normalized.status;
    setField_(record.obj, 'STATUS', NLF.STATUS.CANCELLED);
    setField_(record.obj, 'CANCELLED_AT', now_());
    setField_(record.obj, 'CANCELLED_BY', userEmail);
    setField_(record.obj, 'UPDATED_AT', now_());
    setField_(record.obj, 'OWNER_EMAIL', '');

    if (reason) {
      var existing = cleanText_(getField_(record.obj, 'REMARKS', ''));
      var merged = existing ? (existing + ' | Cancel reason: ' + reason) : ('Cancel reason: ' + reason);
      setField_(record.obj, 'REMARKS', merged);
    }

    saveRequestObject_(record);

    writeWorkflowLog_(record.normalized.requestId, 'REQUEST_CANCELLED', oldStatus, NLF.STATUS.CANCELLED, reason || 'Cancelled by requester');

    var normalized = normalizeRequest_(record.obj);
    notifyCancellation_(normalized, reason);

    return { ok: true, message: 'Request cancelled.' };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}
