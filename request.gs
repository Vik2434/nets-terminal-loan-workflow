function plannedDays_(startDate, endDate, timeOption) {
  var s = toDate_(startDate);
  var e = toDate_(endDate);
  if (!s || !e) return '';

  var sDay = toDate_(toYmd_(s));
  var eDay = toDate_(toYmd_(e));
  var millisPerDay = 1000 * 60 * 60 * 24;
  var days = Math.floor((eDay.getTime() - sDay.getTime()) / millisPerDay) + 1;
  if (days < 1) days = 1;

  if (String(timeOption || '').toLowerCase().indexOf('half day') === 0) {
    return days === 1 ? 0.5 : (days - 0.5);
  }
  return days;
}

function normalizeHalfDaySlot_(value) {
  var slot = cleanText_(value).toUpperCase();
  if (slot === 'AM' || slot === 'PM') return slot;
  return '';
}

function resolveRequesterNameForSubmission_(payload, requesterEmail) {
  var manualName = cleanText_((payload || {}).requesterName);
  var known = getRequesterNameBootstrap_(requesterEmail).name || '';

  if (manualName && !looksLikeWeakRequesterName_(manualName, requesterEmail)) {
    return manualName;
  }
  if (known) return known;
  if (manualName) return manualName;
  return deriveNameFromEmail_(requesterEmail);
}

function buildRequestRemarks_(data) {
  var parts = [];
  if (data.remarks) parts.push(data.remarks);
  parts.push('Time Option: ' + data.timeOption);
  if (data.timeOption === 'Half Day' && data.halfDaySlot) parts.push('Half Day Slot: ' + data.halfDaySlot);
  if (data.timeOption === 'Half Day' && data.specificTime) parts.push('Specific Time: ' + data.specificTime);
  if (data.deviceType) parts.push('Device: ' + data.deviceType);
  return parts.filter(function (item) { return !!item; }).join(' | ');
}

function validateRequestPayload_(payload, currentEmail) {
  var requesterEmail = normalizeEmail_(payload.requesterEmail || currentEmail);
  ensure_(requesterEmail, 'Your signed-in email could not be confirmed. Refresh the page and try again.');
  ensure_(isAllowedDomainEmail_(requesterEmail), 'Please submit this request using your @' + getAllowedDomain_() + ' account.');

  var requesterName = resolveRequesterNameForSubmission_(payload || {}, requesterEmail);
  ensure_(requesterName, 'Please enter your full name as it should appear on the request.');

  var department = cleanText_(payload.division || payload.department);
  ensure_(department, 'Please select the division requesting the NETS terminal.');

  var purpose = cleanText_(payload.reason || payload.purpose);
  ensure_(purpose, 'Please enter the reason for this loan request.');

  var needDate = toDate_(payload.startDate || payload.needDate);
  var returnDate = toDate_(payload.endDate || payload.returnDate);
  ensure_(!!needDate, 'Please choose the start date for this request.');
  ensure_(!!returnDate, 'Please choose the end date for this request.');
  ensure_(needDate.getTime() <= returnDate.getTime(), 'The end date must be the same as or later than the start date.');

  var glCode = cleanText_(payload.glCode || payload.financeReference);
  var costCentre = cleanText_(payload.costCentre);
  var timeOption = cleanText_(payload.timeOption || 'Full Day') || 'Full Day';
  var halfDaySlot = timeOption === 'Half Day'
    ? normalizeHalfDaySlot_(payload.halfDaySlot || payload.halfDayPeriod || '')
    : '';
  var specificTime = timeOption === 'Half Day'
    ? cleanText_(payload.specificTime || payload.halfDayTime || '')
    : '';
  var acknowledgementsAccepted = payload.acknowledgementsAccepted === true || parseBool_(payload.acknowledgementsAccepted);

  ensure_(acknowledgementsAccepted, 'Please confirm all acknowledgement statements before submitting.');
  if (timeOption === 'Half Day') {
    ensure_(!!halfDaySlot, 'Please choose whether this half-day request is for AM or PM.');
  }

  var onBehalf = payload.onBehalf === true || String(payload.onBehalf || '').toUpperCase() === 'Y';
  var borrowerEmail = normalizeEmail_(payload.borrowerEmail || payload.bEmail || '');
  if (onBehalf) {
    ensure_(cleanText_(payload.borrowerFirst || payload.bFirst), 'Please enter the borrower’s first name.');
    ensure_(cleanText_(payload.borrowerLast || payload.bLast), 'Please enter the borrower’s last name.');
    ensure_(borrowerEmail, 'Please enter the borrower’s work email address.');
    ensure_(cleanText_(payload.relationship || payload.bRel), 'Please describe your relationship to the borrower.');
    ensure_(isAllowedDomainEmail_(borrowerEmail), 'The borrower email must be an @' + getAllowedDomain_() + ' address.');
  }

  return {
    requesterEmail: requesterEmail,
    requesterName: requesterName,
    employeeId: cleanText_(payload.employeeId),
    department: department,
    purpose: purpose,
    needDate: needDate,
    returnDate: returnDate,
    glCode: glCode,
    financeReference: glCode,
    costCentre: costCentre,
    specialTrackingCode: cleanText_(payload.specialTrackingCode || payload.trackingCode),
    timeOption: timeOption,
    halfDaySlot: halfDaySlot,
    specificTime: specificTime,
    acknowledgementsAccepted: acknowledgementsAccepted,
    onBehalf: onBehalf,
    borrowerFirst: cleanText_(payload.borrowerFirst || payload.bFirst),
    borrowerLast: cleanText_(payload.borrowerLast || payload.bLast),
    borrowerEmail: borrowerEmail,
    relationship: cleanText_(payload.relationship || payload.bRel),
    deviceType: cleanText_(payload.deviceType || 'NETS Terminal'),
    remarks: cleanText_(payload.remarks),
    eventName: cleanText_(payload.eventName),
    location: cleanText_(payload.deploymentLocation || payload.location)
  };
}

function apiSubmitRequest(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var userEmail = currentUserEmail_();
    var data = validateRequestPayload_(payload || {}, userEmail);

    var availableTerminals = getAvailableTerminalsForRange_(data.needDate, data.returnDate, '');
    var approvalRequired = availableTerminals.length === 0;

    var requestObj = createEmptyRequestObject_();
    var requestId = generateRequestId_();
    var now = now_();
    var approverEmail = getApproverEmail_();
    var techEmails = getTechEmails_();

    setFieldAllAliases_(requestObj, 'ID', requestId);
    // Production flow: every new request enters queue as Submitted.
    setFieldAllAliases_(requestObj, 'STATUS', NLF.STATUS.SUBMITTED);
    setFieldAllAliases_(requestObj, 'REQUEST_DATE_TIME', now);
    setRequesterName_(requestObj, data.requesterName);
    setFieldAllAliases_(requestObj, 'REQUESTER_EMAIL', data.requesterEmail);
    setFieldAllAliases_(requestObj, 'EMPLOYEE_ID', data.employeeId);
    setFieldAllAliases_(requestObj, 'DEPARTMENT', data.department);
    setFieldAllAliases_(requestObj, 'PURPOSE', data.purpose);
    setFieldAllAliases_(requestObj, 'NEED_DATE', data.needDate);
    setFieldAllAliases_(requestObj, 'RETURN_DATE', data.returnDate);
    setFieldAllAliases_(requestObj, 'GL_CODE', data.glCode);
    setFieldAllAliases_(requestObj, 'FINANCE_REFERENCE', data.financeReference);
    setFieldAllAliases_(requestObj, 'COST_CENTRE', data.costCentre);
    setFieldAllAliases_(requestObj, 'SPECIAL_TRACKING_CODE', data.specialTrackingCode);
    setFieldAllAliases_(requestObj, 'BUDGET_CODES', [
      data.glCode ? ('GL:' + data.glCode) : '',
      data.costCentre ? ('CC:' + data.costCentre) : '',
      data.specialTrackingCode ? ('STC:' + data.specialTrackingCode) : ''
    ].filter(function (x) { return x; }).join(' | '));
    setFieldAllAliases_(requestObj, 'REMARKS', buildRequestRemarks_(data));
    setFieldAllAliases_(requestObj, 'EVENT_NAME', data.eventName);
    setFieldAllAliases_(requestObj, 'LOCATION', data.location);
    setFieldAllAliases_(requestObj, 'ON_BEHALF', data.onBehalf ? 'Y' : 'N');
    setFieldAllAliases_(requestObj, 'BORROWER_FIRST', data.borrowerFirst);
    setFieldAllAliases_(requestObj, 'BORROWER_LAST', data.borrowerLast);
    setFieldAllAliases_(requestObj, 'BORROWER_EMAIL', data.borrowerEmail);
    setFieldAllAliases_(requestObj, 'RELATIONSHIP', data.relationship);
    setFieldAllAliases_(requestObj, 'APPROVAL_REQUIRED', approvalRequired ? 'Y' : 'N');
    setFieldAllAliases_(requestObj, 'APPROVER_EMAIL', approverEmail);
    setFieldAllAliases_(requestObj, 'ASSIGNED_TECH_EMAIL', techEmails.length ? techEmails[0] : '');
    setFieldAllAliases_(requestObj, 'OWNER_EMAIL', techEmails.length ? techEmails[0] : '');
    setFieldAllAliases_(requestObj, 'FINANCE_NOTIFIED', 'N');
    setFieldAllAliases_(requestObj, 'STEP1_TOKEN', makeToken_());
    setFieldAllAliases_(requestObj, 'STEP2_TOKEN', makeToken_());
    setFieldAllAliases_(requestObj, 'STEP3_TOKEN', makeToken_());
    setFieldAllAliases_(requestObj, 'CREATED_AT', now);
    setFieldAllAliases_(requestObj, 'UPDATED_AT', now);
    setFieldAllAliases_(requestObj, 'PLANNED_DAYS', plannedDays_(data.needDate, data.returnDate, data.timeOption));

    appendRequestObject_(requestObj);

    var normalized = normalizeRequest_(requestObj);
    writeWorkflowLog_(normalized.requestId, 'REQUEST_SUBMITTED', '', normalized.status, 'Request created');

    notifySubmission_(normalized);
    if (approvalRequired) {
      notifyApprovalRequired_(normalized);
    }

    return {
      ok: true,
      requestId: normalized.requestId,
      status: normalized.status,
      approvalRequired: approvalRequired,
      availableTerminalCount: availableTerminals.length,
      message: 'Request submitted successfully.'
    };
  } catch (err) {
    Logger.log('apiSubmitRequest error: ' + err.message + '\n' + err.stack);
    return { ok: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

function apiGetRequestSummary(requestId) {
  try {
    var record = findRequestRecordById_(requestId);
    if (!record) return { ok: false, error: 'Request not found.' };

    var user = currentUserEmail_();
    var access = getUserAccessProfile_(user);

    if (!access.isAdmin && user !== record.normalized.requesterEmail && !(access.isTech || access.isApprover || access.isFinance)) {
      return { ok: false, error: 'You are not allowed to view this request.' };
    }

    return { ok: true, request: record.normalized };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
