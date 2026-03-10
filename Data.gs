function requestsSheet_() {
  var sh = getSheetByCandidates_(NLF.SHEET_NAMES.REQUESTS);
  if (!sh) throw new Error('Requests sheet not found. Run setupNetsLoanForm().');
  return sh;
}

function terminalsSheet_() {
  var sh = getSheetByCandidates_(NLF.SHEET_NAMES.TERMINALS);
  if (!sh) throw new Error('Terminals/Inventory sheet not found. Run setupNetsLoanForm().');
  return sh;
}

function workflowSheet_() {
  var sh = getSheetByCandidates_(NLF.SHEET_NAMES.WORKFLOW_LOG);
  if (!sh) throw new Error('Workflow log sheet not found. Run setupNetsLoanForm().');
  return sh;
}

function emailLogSheet_() {
  return getSheetByCandidates_(NLF.SHEET_NAMES.EMAIL_LOG);
}

function rolesSheet_() {
  return getSheetByCandidates_(NLF.SHEET_NAMES.USER_ROLES);
}

function memoKeyForSheet_(sheet) {
  return String(sheet.getSheetId()) + ':' + sheet.getName();
}

function clearSheetMemo_(sheet) {
  var memo = runtimeMemo_();
  var key = memoKeyForSheet_(sheet);
  delete memo.headers[key];
  delete memo.rows[key];
}

function clearRequestMemo_() {
  var memo = runtimeMemo_();
  delete memo.requests.records;
  delete memo.requests.list;
  delete memo.requests.byId;
  delete memo.requests.byRequesterEmail;
  var sh = requestsSheet_();
  clearSheetMemo_(sh);
}

function clearRoleMemo_() {
  var memo = runtimeMemo_();
  delete memo.roles.byEmail;
  delete memo.users.accessByEmail;
  var sh = rolesSheet_();
  if (sh) clearSheetMemo_(sh);
}

function clearTerminalMemo_() {
  var memo = runtimeMemo_();
  delete memo.terminals.list;
  delete memo.terminals.byIdentifier;
  var sh = terminalsSheet_();
  clearSheetMemo_(sh);
}

function clearWorkflowMemo_() {
  var memo = runtimeMemo_();
  delete memo.workflow.byRequestId;
  var sh = workflowSheet_();
  clearSheetMemo_(sh);
}

function normalizeColumnKey_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function headersForSheet_(sheet) {
  var memo = runtimeMemo_();
  var key = memoKeyForSheet_(sheet);
  if (memo.headers[key]) return memo.headers[key];

  var lastColumn = Math.max(1, sheet.getLastColumn());
  memo.headers[key] = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (h) {
    return String(h || '').trim();
  });
  return memo.headers[key];
}

function rowsToObjects_(sheet) {
  var memo = runtimeMemo_();
  var key = memoKeyForSheet_(sheet);
  if (memo.rows[key]) return memo.rows[key];

  var headers = headersForSheet_(sheet);
  if (sheet.getLastRow() < 2) {
    memo.rows[key] = {
      headers: headers,
      rows: []
    };
    return memo.rows[key];
  }

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  var rows = data.map(function (row, index) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    return {
      rowNumber: index + 2,
      obj: obj
    };
  });

  memo.rows[key] = {
    headers: headers,
    rows: rows
  };
  return memo.rows[key];
}

function headerIndexByAliases_(headers, aliases) {
  headers = headers || [];
  aliases = aliases || [];

  for (var i = 0; i < aliases.length; i++) {
    var exact = headers.indexOf(aliases[i]);
    if (exact >= 0) return exact + 1;
  }

  var normalized = {};
  for (var h = 0; h < headers.length; h++) {
    normalized[normalizeColumnKey_(headers[h])] = h + 1;
  }

  for (var j = 0; j < aliases.length; j++) {
    var candidate = normalized[normalizeColumnKey_(aliases[j])];
    if (candidate) return candidate;
  }

  return 0;
}

function rowObjectFromSheet_(sheet, rowNumber) {
  var headers = headersForSheet_(sheet);
  var values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = values[i];
  }
  return {
    rowNumber: rowNumber,
    headers: headers,
    obj: obj
  };
}

function findRowNumbersByExactValue_(sheet, headerAliases, targetValue) {
  var target = String(targetValue === null || targetValue === undefined ? '' : targetValue).trim();
  if (!target || sheet.getLastRow() < 2) return [];

  var headers = headersForSheet_(sheet);
  var rowNumbers = [];
  for (var i = 0; i < headerAliases.length; i++) {
    var col = headerIndexByAliases_(headers, [headerAliases[i]]);
    if (!col) continue;

    var range = sheet.getRange(2, col, sheet.getLastRow() - 1, 1);
    var matches = range.createTextFinder(target)
      .matchEntireCell(true)
      .matchCase(false)
      .useRegularExpression(false)
      .findAll();

    for (var m = 0; m < matches.length; m++) {
      rowNumbers.push(matches[m].getRow());
    }
  }

  rowNumbers.sort(function (a, b) { return a - b; });
  var unique = [];
  for (var r = 0; r < rowNumbers.length; r++) {
    if (unique.indexOf(rowNumbers[r]) < 0) unique.push(rowNumbers[r]);
  }
  return unique;
}

function objectToRow_(headers, obj) {
  return headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(obj, header) ? obj[header] : '';
  });
}

function makeBlankObject_(headers) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) obj[headers[i]] = '';
  return obj;
}

function findFirstExistingAlias_(obj, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    if (Object.prototype.hasOwnProperty.call(obj, aliases[i])) return aliases[i];
  }
  return '';
}

function setField_(obj, fieldName, value) {
  var aliases = NLF.FIELD[fieldName] || [];
  for (var i = 0; i < aliases.length; i++) {
    if (Object.prototype.hasOwnProperty.call(obj, aliases[i])) {
      obj[aliases[i]] = value;
      return;
    }
  }
}

function setFieldAllAliases_(obj, fieldName, value) {
  var aliases = NLF.FIELD[fieldName] || [];
  for (var i = 0; i < aliases.length; i++) {
    if (Object.prototype.hasOwnProperty.call(obj, aliases[i])) {
      obj[aliases[i]] = value;
    }
  }
}

function getField_(obj, fieldName, fallback) {
  var aliases = NLF.FIELD[fieldName] || [];
  for (var i = 0; i < aliases.length; i++) {
    var key = aliases[i];
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    var value = obj[key];
    if (value !== '' && value !== null && value !== undefined) return value;
  }
  return fallback;
}

function getRequesterName_(obj) {
  var full = cleanText_(getField_(obj, 'REQUESTER_NAME', ''));
  if (full) return full;
  var first = cleanText_(getField_(obj, 'REQUESTER_FIRST', ''));
  var last = cleanText_(getField_(obj, 'REQUESTER_LAST', ''));
  return cleanText_((first + ' ' + last).trim());
}

function setRequesterName_(obj, fullName) {
  var clean = cleanText_(fullName);
  var parts = parseNameParts_(clean);
  setFieldAllAliases_(obj, 'REQUESTER_NAME', clean);
  setFieldAllAliases_(obj, 'REQUESTER_FIRST', parts.first);
  setFieldAllAliases_(obj, 'REQUESTER_LAST', parts.last);
}

function parseLegacyBudgetCodes_(budgetCodesText) {
  var text = cleanText_(budgetCodesText || '');
  if (!text) return { glCode: '', costCentre: '', specialTrackingCode: '' };

  var out = {
    glCode: '',
    costCentre: '',
    specialTrackingCode: ''
  };

  var parts = text.split('|');
  for (var i = 0; i < parts.length; i++) {
    var part = cleanText_(parts[i]);
    if (!part) continue;
    var idx = part.indexOf(':');
    if (idx < 0) continue;

    var key = cleanText_(part.slice(0, idx)).toUpperCase();
    var value = cleanText_(part.slice(idx + 1));
    if (!value) continue;

    if (key === 'GL' || key === 'GLCODE' || key === 'GL CODE') out.glCode = value;
    if (key === 'CC' || key === 'COSTCENTRE' || key === 'COST CENTRE') out.costCentre = value;
    if (key === 'STC' || key === 'SPECIALTRACKINGCODE' || key === 'SPECIAL TRACKING CODE') out.specialTrackingCode = value;
  }

  return out;
}

function normalizeRequest_(obj) {
  var budgetCodes = cleanText_(getField_(obj, 'BUDGET_CODES', ''));
  var legacyBudget = parseLegacyBudgetCodes_(budgetCodes);
  var glCode = cleanText_(getField_(obj, 'GL_CODE', '')) || cleanText_(getField_(obj, 'FINANCE_REFERENCE', '')) || legacyBudget.glCode;
  var costCentre = cleanText_(getField_(obj, 'COST_CENTRE', '')) || legacyBudget.costCentre;
  var specialTrackingCode = cleanText_(getField_(obj, 'SPECIAL_TRACKING_CODE', '')) || legacyBudget.specialTrackingCode;

  var req = {
    requestId: cleanText_(getField_(obj, 'ID', '')),
    status: cleanText_(getField_(obj, 'STATUS', NLF.STATUS.SUBMITTED)),
    requesterName: getRequesterName_(obj),
    requesterEmail: normalizeEmail_(getField_(obj, 'REQUESTER_EMAIL', '')),
    employeeId: cleanText_(getField_(obj, 'EMPLOYEE_ID', '')),
    department: cleanText_(getField_(obj, 'DEPARTMENT', '')),
    purpose: cleanText_(getField_(obj, 'PURPOSE', '')),
    needDate: toYmd_(getField_(obj, 'NEED_DATE', '')),
    returnDate: toYmd_(getField_(obj, 'RETURN_DATE', '')),
    plannedDays: cleanText_(getField_(obj, 'PLANNED_DAYS', '')),
    glCode: glCode,
    financeReference: cleanText_(getField_(obj, 'FINANCE_REFERENCE', '')) || glCode,
    costCentre: costCentre,
    specialTrackingCode: specialTrackingCode,
    budgetCodes: budgetCodes,
    remarks: cleanText_(getField_(obj, 'REMARKS', '')),
    eventName: cleanText_(getField_(obj, 'EVENT_NAME', '')),
    location: cleanText_(getField_(obj, 'LOCATION', '')),
    onBehalf: parseBool_(getField_(obj, 'ON_BEHALF', false)),
    borrowerFirst: cleanText_(getField_(obj, 'BORROWER_FIRST', '')),
    borrowerLast: cleanText_(getField_(obj, 'BORROWER_LAST', '')),
    borrowerEmail: normalizeEmail_(getField_(obj, 'BORROWER_EMAIL', '')),
    relationship: cleanText_(getField_(obj, 'RELATIONSHIP', '')),
    approvalRequired: parseBool_(getField_(obj, 'APPROVAL_REQUIRED', false)),
    approverEmail: normalizeEmail_(getField_(obj, 'APPROVER_EMAIL', '')),
    assignedTechEmail: normalizeEmail_(getField_(obj, 'ASSIGNED_TECH_EMAIL', '')),
    assignedTerminalId: cleanText_(getField_(obj, 'ASSIGNED_TERMINAL_ID', '')),
    collectionDateTime: toIso_(getField_(obj, 'COLLECTION_DATE_TIME', '')),
    returnedDateTime: toIso_(getField_(obj, 'RETURNED_DATE_TIME', '')),
    lastReminderSent: toIso_(getField_(obj, 'LAST_REMINDER_SENT', '')),
    financeNotified: parseBool_(getField_(obj, 'FINANCE_NOTIFIED', false)),
    ownerEmail: normalizeEmail_(getField_(obj, 'OWNER_EMAIL', '')),
    requestDateTime: toIso_(getField_(obj, 'REQUEST_DATE_TIME', getField_(obj, 'CREATED_AT', ''))),
    submittedAt: toIso_(getField_(obj, 'REQUEST_DATE_TIME', getField_(obj, 'CREATED_AT', ''))),
    lastUpdated: toIso_(getField_(obj, 'UPDATED_AT', getField_(obj, 'CREATED_AT', ''))),
    approvalNote: cleanText_(getField_(obj, 'APPROVAL_NOTE', '')),
    cancelledAt: toIso_(getField_(obj, 'CANCELLED_AT', ''))
  };

  if (!req.ownerEmail) {
    req.ownerEmail = currentOwnerFromStatus_(req);
  }

  return req;
}

function currentOwnerFromStatus_(request) {
  var status = request.status;
  if (status === NLF.STATUS.PENDING_APPROVAL) return request.approverEmail || getApproverEmail_();
  if (status === NLF.STATUS.PENDING_TECH_ASSIGNMENT || status === NLF.STATUS.ASSIGNED) {
    var techEmails = getTechEmails_();
    return techEmails.length ? techEmails[0] : '';
  }
  if (status === NLF.STATUS.READY_FOR_COLLECTION || status === NLF.STATUS.ON_LOAN) {
    return request.requesterEmail;
  }
  return '';
}

function looksLikeWeakRequesterName_(name, email) {
  var cleaned = cleanText_(name);
  if (!cleaned) return true;
  if (cleaned.indexOf('@') >= 0) return true;
  return cleaned.toLowerCase() === deriveNameFromEmail_(email).toLowerCase();
}

function requesterNameFromRoles_(email) {
  var normalized = normalizeEmail_(email);
  if (!normalized) return '';

  var rows = getRoleRowsByEmail_(normalized);
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i].obj || {};
    if (!isActiveRoleRow_(row)) continue;
    var name = cleanText_(getRoleRowValue_(row, ['Name'], ''));
    if (name) return name;
  }

  return '';
}

function requesterNameFromHistory_(email) {
  var normalized = normalizeEmail_(email);
  if (!normalized) return '';

  try {
    var record = findLatestRequestRecordByRequesterEmail_(normalized);
    if (!record) return '';
    var name = getRequesterName_(record.obj);
    if (name) return name;
  } catch (err) {
    Logger.log('requesterNameFromHistory_ error: ' + err.message);
  }

  return '';
}

function getRequesterNameBootstrap_(email, options) {
  var normalized = normalizeEmail_(email);
  if (!normalized) return { name: '', source: 'none' };
  options = options || {};

  var memo = runtimeMemo_();
  memo.boot.requesterNameBootstrap = memo.boot.requesterNameBootstrap || {};
  var cacheKey = normalized + '|' + (options.allowHistory === false ? 'nohistory' : 'history');
  if (memo.boot.requesterNameBootstrap[cacheKey]) {
    return memo.boot.requesterNameBootstrap[cacheKey];
  }

  try {
    var roleName = requesterNameFromRoles_(normalized);
    if (roleName && !looksLikeWeakRequesterName_(roleName, normalized)) {
      memo.boot.requesterNameBootstrap[cacheKey] = { name: roleName, source: 'roles' };
      return memo.boot.requesterNameBootstrap[cacheKey];
    }
  } catch (err) {
    Logger.log('getRequesterNameBootstrap_ roles error: ' + err.message);
  }

  if (options.allowHistory !== false) {
    try {
      var historyName = requesterNameFromHistory_(normalized);
      if (historyName && !looksLikeWeakRequesterName_(historyName, normalized)) {
        memo.boot.requesterNameBootstrap[cacheKey] = { name: historyName, source: 'history' };
        return memo.boot.requesterNameBootstrap[cacheKey];
      }
    } catch (err2) {
      Logger.log('getRequesterNameBootstrap_ history error: ' + err2.message);
    }
  }

  memo.boot.requesterNameBootstrap[cacheKey] = { name: '', source: 'none' };
  return memo.boot.requesterNameBootstrap[cacheKey];
}

function getAllRequestsRecords_() {
  var memo = runtimeMemo_();
  if (!memo.requests.records) {
    memo.requests.records = rowsToObjects_(requestsSheet_());
  }
  return memo.requests.records;
}

function getAllRequests_() {
  var memo = runtimeMemo_();
  if (!memo.requests.list) {
    var data = getAllRequestsRecords_();
    memo.requests.list = data.rows.map(function (record) {
      return normalizeRequest_(record.obj);
    });
  }
  return memo.requests.list;
}

function getNormalizedRequestsByStatuses_(statuses) {
  var allowed = {};
  (statuses || []).forEach(function (status) {
    allowed[cleanText_(status)] = true;
  });

  return getAllRequestsRecords_().rows.reduce(function (out, record) {
    var status = cleanText_(getField_(record.obj, 'STATUS', NLF.STATUS.SUBMITTED));
    if (!allowed[status]) return out;
    out.push(normalizeRequest_(record.obj));
    return out;
  }, []);
}

function findLatestRequestRecordByRequesterEmail_(email) {
  var normalized = normalizeEmail_(email);
  if (!normalized) return null;

  var memo = runtimeMemo_();
  memo.requests.byRequesterEmail = memo.requests.byRequesterEmail || {};
  if (Object.prototype.hasOwnProperty.call(memo.requests.byRequesterEmail, normalized)) {
    return memo.requests.byRequesterEmail[normalized];
  }

  var sh = requestsSheet_();
  var rows = findRowNumbersByExactValue_(sh, ['RequesterEmail', 'Requester Email'], normalized);
  if (!rows.length) {
    var allRecords = getAllRequestsRecords_().rows.filter(function (record) {
      return normalizeEmail_(getField_(record.obj, 'REQUESTER_EMAIL', '')) === normalized;
    });
    memo.requests.byRequesterEmail[normalized] = allRecords.length
      ? {
          rowNumber: allRecords[allRecords.length - 1].rowNumber,
          headers: getAllRequestsRecords_().headers,
          obj: allRecords[allRecords.length - 1].obj,
          normalized: normalizeRequest_(allRecords[allRecords.length - 1].obj)
        }
      : null;
    return memo.requests.byRequesterEmail[normalized];
  }

  var record = rowObjectFromSheet_(sh, rows[rows.length - 1]);
  record.normalized = normalizeRequest_(record.obj);
  memo.requests.byRequesterEmail[normalized] = record;
  return record;
}

function findRequestRecordById_(requestId) {
  var target = cleanText_(requestId);
  if (!target) return null;

  var memo = runtimeMemo_();
  memo.requests.byId = memo.requests.byId || {};
  if (Object.prototype.hasOwnProperty.call(memo.requests.byId, target)) {
    return memo.requests.byId[target];
  }

  var sh = requestsSheet_();
  var rowNumbers = findRowNumbersByExactValue_(sh, ['ID', 'RequestID'], target);
  if (!rowNumbers.length) {
    var data = getAllRequestsRecords_();
    for (var i = 0; i < data.rows.length; i++) {
      var row = data.rows[i];
      if (cleanText_(getField_(row.obj, 'ID', '')) !== target) continue;
      memo.requests.byId[target] = {
        rowNumber: row.rowNumber,
        headers: data.headers,
        obj: row.obj,
        normalized: normalizeRequest_(row.obj)
      };
      return memo.requests.byId[target];
    }
    memo.requests.byId[target] = null;
    return null;
  }

  var record = rowObjectFromSheet_(sh, rowNumbers[0]);
  record.normalized = normalizeRequest_(record.obj);
  memo.requests.byId[target] = record;
  return record;
}

function appendRequestObject_(obj) {
  var sh = requestsSheet_();
  var headers = headersForSheet_(sh);
  sh.appendRow(objectToRow_(headers, obj));
  clearRequestMemo_();
}

function saveRequestObject_(record) {
  var sh = requestsSheet_();
  sh.getRange(record.rowNumber, 1, 1, record.headers.length).setValues([
    objectToRow_(record.headers, record.obj)
  ]);
  clearRequestMemo_();
}

function createEmptyRequestObject_() {
  var headers = headersForSheet_(requestsSheet_());
  return makeBlankObject_(headers);
}

function normalizeTerminalStatus_(statusValue) {
  var raw = String(statusValue || '').toLowerCase().trim();
  if (!raw) return 'Available';
  if (raw === 'available') return 'Available';
  if (raw === 'in use' || raw === 'in_use' || raw === 'inuse') return 'In Use';
  if (raw === 'under maintenance' || raw === 'maintenance' || raw === 'under_maintenance') return 'Under maintenance';
  return statusValue;
}

function listTerminals_() {
  var memo = runtimeMemo_();
  if (!memo.terminals.list) {
    var data = rowsToObjects_(terminalsSheet_());
    memo.terminals.list = data.rows.map(function (row) {
      var obj = row.obj;

      var terminalNumber = cleanText_(
        obj['TerminalNumber'] || obj['TerminalName'] || obj['Terminal Name'] || obj['TerminalID'] || obj['Terminal ID'] || ''
      );
      var terminalId = cleanText_(
        obj['Terminal ID'] || obj['TerminalID'] || terminalNumber
      );
      var status = normalizeTerminalStatus_(
        cleanText_(obj['Status'] || obj['AvailabilityStatus'] || obj['availability_status'] || 'Available')
      );
      var name = terminalNumber || terminalId;
      var currentRequestId = cleanText_(obj['CurrentRequestID'] || obj['CurrentRequestId'] || '');
      var currentHolder = cleanText_(obj['CurrentHolder'] || obj['LastUsedBy'] || '');
      var lastAssignedDate = obj['LastAssignedDate'] || obj['LastUsedDate'] || '';
      var notes = cleanText_(obj['Notes'] || obj['Remarks'] || '');
      var location = cleanText_(obj['Location'] || '');
      var serialNumber = cleanText_(obj['Serial Number'] || obj['SerialNumber'] || '');
      var lastUsedBy = cleanText_(obj['LastUsedBy'] || currentHolder || '');

      return {
        rowNumber: row.rowNumber,
        obj: obj,
        terminalId: terminalId,
        terminalNumber: terminalNumber || terminalId,
        terminalName: name,
        status: status,
        currentRequestId: currentRequestId,
        currentHolder: currentHolder,
        lastAssignedDate: toIso_(lastAssignedDate),
        lastUsedBy: lastUsedBy,
        lastUsedDate: toIso_(lastAssignedDate),
        notes: notes,
        remarks: notes,
        location: location,
        serialNumber: serialNumber
      };
    }).filter(function (item) {
      return !!item.terminalId || !!item.terminalNumber;
    });
  }

  return memo.terminals.list;
}

function findTerminalRecordByIdentifier_(terminalIdentifier) {
  var target = cleanText_(terminalIdentifier);
  if (!target) return null;

  var memo = runtimeMemo_();
  memo.terminals.byIdentifier = memo.terminals.byIdentifier || {};
  if (Object.prototype.hasOwnProperty.call(memo.terminals.byIdentifier, target)) {
    return memo.terminals.byIdentifier[target];
  }

  var sh = terminalsSheet_();
  var rowNumbers = findRowNumbersByExactValue_(sh, ['Terminal ID', 'TerminalID', 'TerminalNumber', 'TerminalName', 'Terminal Name'], target);
  if (!rowNumbers.length) {
    var rows = rowsToObjects_(sh).rows;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var candidateId = cleanText_(row.obj['Terminal ID'] || row.obj['TerminalID'] || '');
      var candidateNumber = cleanText_(row.obj['TerminalNumber'] || row.obj['TerminalName'] || row.obj['Terminal Name'] || '');
      if (candidateId !== target && candidateNumber !== target) continue;
      memo.terminals.byIdentifier[target] = {
        rowNumber: row.rowNumber,
        headers: headersForSheet_(sh),
        obj: row.obj
      };
      return memo.terminals.byIdentifier[target];
    }
    memo.terminals.byIdentifier[target] = null;
    return null;
  }

  var record = rowObjectFromSheet_(sh, rowNumbers[0]);
  memo.terminals.byIdentifier[target] = record;
  return record;
}

function updateTerminalState_(terminalIdentifier, updates) {
  var target = cleanText_(terminalIdentifier);
  ensure_(target, 'Terminal ID is required');

  var sh = terminalsSheet_();
  var found = findTerminalRecordByIdentifier_(target);

  ensure_(!!found, 'Terminal not found: ' + target);

  var obj = found.obj;
  var headers = found.headers;
  var normalizedStatus = updates.status !== undefined ? normalizeTerminalStatus_(updates.status) : undefined;
  var normalizedCurrentHolder = updates.currentHolder !== undefined
    ? updates.currentHolder
    : undefined;
  var normalizedLastUsedBy = updates.lastUsedBy !== undefined
    ? updates.lastUsedBy
    : (normalizedCurrentHolder ? normalizedCurrentHolder : undefined);
  var normalizedLastUsedDate = updates.lastUsedDate !== undefined
    ? updates.lastUsedDate
    : (updates.lastAssignedDate !== undefined ? updates.lastAssignedDate : undefined);
  var normalizedNotes = updates.notes !== undefined
    ? updates.notes
    : (updates.remarks !== undefined ? updates.remarks : undefined);

  if (Object.prototype.hasOwnProperty.call(obj, 'Status') && normalizedStatus !== undefined) {
    obj['Status'] = normalizedStatus;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'AvailabilityStatus') && normalizedStatus !== undefined) {
    obj['AvailabilityStatus'] = normalizedStatus;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'TerminalNumber') && updates.terminalNumber !== undefined) {
    obj['TerminalNumber'] = updates.terminalNumber;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'TerminalName') && updates.terminalNumber !== undefined) {
    obj['TerminalName'] = updates.terminalNumber;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'Terminal Name') && updates.terminalNumber !== undefined) {
    obj['Terminal Name'] = updates.terminalNumber;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'Terminal ID') && updates.terminalId !== undefined) {
    obj['Terminal ID'] = updates.terminalId;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'TerminalID') && updates.terminalId !== undefined) {
    obj['TerminalID'] = updates.terminalId;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'CurrentRequestID') && updates.currentRequestId !== undefined) {
    obj['CurrentRequestID'] = updates.currentRequestId;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'CurrentRequestId') && updates.currentRequestId !== undefined) {
    obj['CurrentRequestId'] = updates.currentRequestId;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'CurrentHolder') && normalizedCurrentHolder !== undefined) {
    obj['CurrentHolder'] = normalizedCurrentHolder;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'LastUsedBy') && normalizedLastUsedBy !== undefined) {
    obj['LastUsedBy'] = normalizedLastUsedBy;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'LastAssignedDate') && normalizedLastUsedDate !== undefined) {
    obj['LastAssignedDate'] = normalizedLastUsedDate;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'LastUsedDate') && normalizedLastUsedDate !== undefined) {
    obj['LastUsedDate'] = normalizedLastUsedDate;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'Notes') && normalizedNotes !== undefined) {
    obj['Notes'] = normalizedNotes;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'Remarks') && normalizedNotes !== undefined) {
    obj['Remarks'] = normalizedNotes;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'Location') && updates.location !== undefined) {
    obj['Location'] = updates.location;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'Serial Number') && updates.serialNumber !== undefined) {
    obj['Serial Number'] = updates.serialNumber;
  }

  sh.getRange(found.rowNumber, 1, 1, headers.length).setValues([objectToRow_(headers, obj)]);
  clearTerminalMemo_();
}

function writeWorkflowLog_(requestId, actionType, oldStatus, newStatus, notes) {
  var sh = workflowSheet_();
  var headers = headersForSheet_(sh);
  var obj = makeBlankObject_(headers);

  var userEmail = currentUserEmail_();
  var stamp = now_();

  if (Object.prototype.hasOwnProperty.call(obj, 'LogID')) obj['LogID'] = 'LOG-' + uuidShort_();
  if (Object.prototype.hasOwnProperty.call(obj, 'RequestID')) obj['RequestID'] = requestId;
  if (Object.prototype.hasOwnProperty.call(obj, 'ActionDateTime')) obj['ActionDateTime'] = stamp;
  if (Object.prototype.hasOwnProperty.call(obj, 'ActionBy')) obj['ActionBy'] = userEmail;
  if (Object.prototype.hasOwnProperty.call(obj, 'ActionType')) obj['ActionType'] = actionType;
  if (Object.prototype.hasOwnProperty.call(obj, 'OldStatus')) obj['OldStatus'] = oldStatus;
  if (Object.prototype.hasOwnProperty.call(obj, 'NewStatus')) obj['NewStatus'] = newStatus;
  if (Object.prototype.hasOwnProperty.call(obj, 'Notes')) obj['Notes'] = notes || '';

  if (headers.length >= 5 && !Object.prototype.hasOwnProperty.call(obj, 'ActionType')) {
    sh.appendRow([stamp, requestId, actionType, userEmail, notes || '']);
    clearWorkflowMemo_();
    return;
  }

  sh.appendRow(objectToRow_(headers, obj));
  clearWorkflowMemo_();
}

function writeEmailLog_(requestId, recipient, subject, type, status) {
  var sh = emailLogSheet_();
  if (!sh) return;

  var headers = headersForSheet_(sh);
  var obj = makeBlankObject_(headers);

  if (Object.prototype.hasOwnProperty.call(obj, 'EmailID')) obj['EmailID'] = 'EML-' + uuidShort_();
  if (Object.prototype.hasOwnProperty.call(obj, 'RequestID')) obj['RequestID'] = requestId;
  if (Object.prototype.hasOwnProperty.call(obj, 'Recipient')) obj['Recipient'] = recipient;
  if (Object.prototype.hasOwnProperty.call(obj, 'Subject')) obj['Subject'] = subject;
  if (Object.prototype.hasOwnProperty.call(obj, 'SentDateTime')) obj['SentDateTime'] = now_();
  if (Object.prototype.hasOwnProperty.call(obj, 'Type')) obj['Type'] = type;
  if (Object.prototype.hasOwnProperty.call(obj, 'Status')) obj['Status'] = status;

  sh.appendRow(objectToRow_(headers, obj));
}

function getUserRole_(email) {
  return getUserAccessProfile_(email).primaryRole;
}

function normalizeRoleColumnKey_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getRoleRowValue_(row, candidates, fallback) {
  row = row || {};
  candidates = candidates || [];

  for (var i = 0; i < candidates.length; i++) {
    if (Object.prototype.hasOwnProperty.call(row, candidates[i])) {
      return row[candidates[i]];
    }
  }

  var normalized = {};
  var keys = Object.keys(row);
  for (var k = 0; k < keys.length; k++) {
    normalized[normalizeRoleColumnKey_(keys[k])] = row[keys[k]];
  }

  for (var j = 0; j < candidates.length; j++) {
    var candidateKey = normalizeRoleColumnKey_(candidates[j]);
    if (Object.prototype.hasOwnProperty.call(normalized, candidateKey)) {
      return normalized[candidateKey];
    }
  }

  return fallback;
}

function parseAccessFlag_(value) {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;

  var text = String(value).toUpperCase().trim();
  if (!text) return false;

  return parseBool_(value) || text === 'ACTIVE' || text === 'ENABLED' || text === 'ON';
}

function isActiveRoleRow_(row) {
  var activeValue = getRoleRowValue_(row, ['Active', 'IsActive'], 'Y');
  var active = String(activeValue === null || activeValue === undefined ? 'Y' : activeValue).toUpperCase().trim();
  return !(active === 'N' || active === 'NO' || active === 'FALSE' || active === '0' || active === 'INACTIVE' || active === 'DISABLED' || active === 'OFF');
}

function normalizeRoleText_(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[+\/&]+/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function roleFlagsFromText_(value) {
  var flags = {
    isAdmin: false,
    isTech: false,
    isApprover: false,
    isFinance: false
  };

  var text = normalizeRoleText_(value);
  if (!text) return flags;

  flags.isAdmin = /\b(ADMIN|MASTER ADMIN|MASTERADMIN|SUPER ADMIN|SUPERADMIN)\b/.test(text);
  flags.isTech = /\b(TECH|IT|TECH TEAM|IT TEAM|TECHNICIAN)\b/.test(text);
  flags.isApprover = /\b(APPROVER|APPROVAL)\b/.test(text);
  flags.isFinance = /\b(FINANCE|FINANCE VIEWER|FINANCE TEAM)\b/.test(text);

  return flags;
}

function userAccessFromRow_(row) {
  row = row || {};
  var legacyRoleFlags = roleFlagsFromText_(
    String(getRoleRowValue_(row, ['Role'], '')) + ',' + String(getRoleRowValue_(row, ['Roles'], ''))
  );

  return {
    isAdmin: parseAccessFlag_(getRoleRowValue_(row, ['IsAdmin', 'Admin'], '')) || legacyRoleFlags.isAdmin,
    isTech: parseAccessFlag_(getRoleRowValue_(row, ['IsTech', 'Tech'], '')) || legacyRoleFlags.isTech,
    isApprover: parseAccessFlag_(getRoleRowValue_(row, ['IsApprover', 'Approver'], '')) || legacyRoleFlags.isApprover,
    isFinance: parseAccessFlag_(getRoleRowValue_(row, ['IsFinance', 'Finance'], '')) || legacyRoleFlags.isFinance
  };
}

function mergeUserAccess_(target, source) {
  target.isAdmin = !!(target.isAdmin || source.isAdmin);
  target.isTech = !!(target.isTech || source.isTech);
  target.isApprover = !!(target.isApprover || source.isApprover);
  target.isFinance = !!(target.isFinance || source.isFinance);
  return target;
}

function primaryRoleFromAccess_(access) {
  access = access || {};
  if (access.isAdmin) return NLF.ROLE.ADMIN;
  if (access.isTech) return NLF.ROLE.TECH;
  if (access.isApprover) return NLF.ROLE.APPROVER;
  if (access.isFinance) return NLF.ROLE.FINANCE_VIEWER;
  return NLF.ROLE.REQUESTER;
}

function getUserAccessProfile_(email) {
  var normalized = normalizeEmail_(email);
  var memo = runtimeMemo_();
  memo.users.accessByEmail = memo.users.accessByEmail || {};
  if (Object.prototype.hasOwnProperty.call(memo.users.accessByEmail, normalized)) {
    return memo.users.accessByEmail[normalized];
  }

  var access = {
    email: normalized,
    isAdmin: false,
    isTech: false,
    isApprover: false,
    isFinance: false
  };
  if (!normalized) {
    access.primaryRole = NLF.ROLE.REQUESTER;
    access.roles = [];
    memo.users.accessByEmail[normalized] = access;
    return access;
  }

  var admins = getAdminEmails_();
  if (admins.indexOf(normalized) >= 0) {
    access.isAdmin = true;
  }

  var rows = getRoleRowsByEmail_(normalized);
  if (rows.length) {
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i].obj;
      var rowEmail = normalizeEmail_(getRoleRowValue_(row, ['Email', 'EmailAddress', 'UserEmail'], ''));
      if (rowEmail !== normalized) continue;
      if (!isActiveRoleRow_(row)) continue;

      mergeUserAccess_(access, userAccessFromRow_(row));
    }
  }

  access.primaryRole = primaryRoleFromAccess_(access);
  access.roles = []
    .concat(access.isAdmin ? [NLF.ROLE.ADMIN] : [])
    .concat(access.isTech ? [NLF.ROLE.TECH] : [])
    .concat(access.isApprover ? [NLF.ROLE.APPROVER] : [])
    .concat(access.isFinance ? [NLF.ROLE.FINANCE_VIEWER] : []);
  memo.users.accessByEmail[normalized] = access;
  return access;
}

function getRoleRowsByEmail_(email) {
  var normalized = normalizeEmail_(email);
  if (!normalized) return [];

  var memo = runtimeMemo_();
  memo.roles.byEmail = memo.roles.byEmail || {};
  if (Object.prototype.hasOwnProperty.call(memo.roles.byEmail, normalized)) {
    return memo.roles.byEmail[normalized];
  }

  var sh = rolesSheet_();
  if (!sh) {
    memo.roles.byEmail[normalized] = [];
    return memo.roles.byEmail[normalized];
  }

  var rowNumbers = findRowNumbersByExactValue_(sh, ['Email', 'EmailAddress', 'UserEmail'], normalized);
  var matches = rowNumbers.map(function (rowNumber) {
    return rowObjectFromSheet_(sh, rowNumber);
  });
  if (!matches.length) {
    var data = rowsToObjects_(sh);
    matches = data.rows.filter(function (row) {
      return normalizeEmail_(getRoleRowValue_(row.obj, ['Email', 'EmailAddress', 'UserEmail'], '')) === normalized;
    }).map(function (row) {
      return {
        rowNumber: row.rowNumber,
        headers: data.headers,
        obj: row.obj
      };
    });
  }

  memo.roles.byEmail[normalized] = matches;
  return memo.roles.byEmail[normalized];
}

function getWorkflowRowsByRequestId_(requestId) {
  var target = cleanText_(requestId);
  if (!target) return [];

  var memo = runtimeMemo_();
  memo.workflow.byRequestId = memo.workflow.byRequestId || {};
  if (Object.prototype.hasOwnProperty.call(memo.workflow.byRequestId, target)) {
    return memo.workflow.byRequestId[target];
  }

  var sh = workflowSheet_();
  var rowNumbers = findRowNumbersByExactValue_(sh, ['RequestID', 'RequestId', 'requestId'], target);
  var rows = rowNumbers.map(function (rowNumber) {
    return rowObjectFromSheet_(sh, rowNumber);
  });
  if (!rows.length) {
    var data = rowsToObjects_(sh);
    rows = data.rows.filter(function (row) {
      var id = cleanText_(row.obj.RequestID || row.obj.RequestId || row.obj.requestId || '');
      return id === target;
    }).map(function (row) {
      return {
        rowNumber: row.rowNumber,
        headers: data.headers,
        obj: row.obj
      };
    });
  }

  memo.workflow.byRequestId[target] = rows;
  return memo.workflow.byRequestId[target];
}

function userHasAnyRole_(email, roles) {
  var access = getUserAccessProfile_(email);
  if (access.isAdmin) return true;

  roles = roles || [];
  if (roles.indexOf(NLF.ROLE.TECH) >= 0 && access.isTech) return true;
  if (roles.indexOf(NLF.ROLE.APPROVER) >= 0 && access.isApprover) return true;
  if (roles.indexOf(NLF.ROLE.FINANCE_VIEWER) >= 0 && access.isFinance) return true;
  if (roles.indexOf(NLF.ROLE.ADMIN) >= 0 && access.isAdmin) return true;
  return false;
}

function hasAdminAccess_(email) {
  return getUserAccessProfile_(email).isAdmin;
}

function hasTechAccess_(email) {
  var access = getUserAccessProfile_(email);
  return !!(access.isAdmin || access.isTech);
}

function hasApprovalAccess_(email) {
  var access = getUserAccessProfile_(email);
  return !!(access.isAdmin || access.isApprover);
}

function hasFinanceAccess_(email) {
  var access = getUserAccessProfile_(email);
  return !!(access.isAdmin || access.isFinance);
}
