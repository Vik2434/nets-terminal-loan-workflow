function setupNetsLoanForm() {
  var ss = setupSpreadsheet_();

  var requestsHeaders = uniqueList_([
    'ID', 'Status', 'RequestDateTime', 'RequesterName', 'RequesterFirst', 'RequesterLast', 'RequesterEmail',
    'EmployeeID', 'Department', 'Division', 'Purpose', 'Reason', 'NeedDate', 'StartDate', 'ReturnDate', 'EndDate',
    'GLCode', 'FinanceReference', 'CostCentre', 'SpecialTrackingCode', 'BudgetCodes',
    'Remarks', 'IssueNotes', 'Notes', 'EventName', 'Location',
    'ApprovalRequired', 'ApproverEmail', 'AssignedTechEmail', 'AssignedTerminalID', 'TerminalNumber',
    'CollectionDateTime', 'ReturnedDateTime', 'LastReminderSent', 'FinanceNotified', 'OwnerEmail',
    'OnBehalf', 'BorrowerFirst', 'BorrowerLast', 'BorrowerEmail', 'Relationship',
    'ApprovalNote', 'FinanceNotesToRequester',
    'Step1Token', 'Step2Token', 'Step3Token',
    'CancelledAt', 'CancelledBy', 'CreatedAt', 'UpdatedAt', 'SubmittedAt'
  ]);

  var terminalsHeaders = uniqueList_([
    'TerminalNumber',
    'Status',
    'LastUsedBy',
    'LastUsedDate',
    'Notes',
    'Location',
    'Serial Number',
    'Terminal ID'
  ]);

  var workflowHeaders = ['LogID', 'RequestID', 'ActionDateTime', 'ActionBy', 'ActionType', 'OldStatus', 'NewStatus', 'Notes'];
  var configHeaders = ['Key', 'Value', 'Description'];
  var emailHeaders = ['EmailID', 'RequestID', 'Recipient', 'Subject', 'SentDateTime', 'Type', 'Status'];
  var roleHeaders = canonicalUserRoleHeaders_();

  var requestsSheet = ensureSheetWithHeaders_(ss, 'Requests', requestsHeaders);
  ensureSheetWithHeaders_(ss, 'Terminals', terminalsHeaders);
  ensureSheetWithHeaders_(ss, 'Workflow_Log', workflowHeaders);
  var configSheet = ensureSheetWithHeaders_(ss, 'Config', configHeaders);
  ensureSheetWithHeaders_(ss, 'Email_Log', emailHeaders);
  var rolesSheet = ensureSheetWithHeaders_(ss, 'User_Roles', roleHeaders);

  cleanupTerminalsSheet_();
  seedConfig_(configSheet);
  seedRoles_(rolesSheet);
  seedTerminals_();

  SpreadsheetApp.flush();

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    requestsColumns: requestsSheet.getLastColumn(),
    message: 'Setup completed.'
  };
}

function setupSpreadsheet_() {
  if (typeof spreadsheet_ === 'function') {
    return spreadsheet_();
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  if (typeof NLF !== 'undefined' && NLF.SS_ID) {
    return SpreadsheetApp.openById(NLF.SS_ID);
  }

  throw new Error('Spreadsheet helper not found. Save Config.gs and try again.');
}

function ensureSheetWithHeaders_(ss, targetName, expectedHeaders) {
  var existing = ss.getSheetByName(targetName);
  if (!existing) {
    var aliases = [];
    if (targetName === 'Terminals') aliases = ['Inventory'];
    if (targetName === 'Workflow_Log') aliases = ['Audit_Log'];

    for (var i = 0; i < aliases.length; i++) {
      existing = ss.getSheetByName(aliases[i]);
      if (existing) break;
    }
  }

  if (!existing) {
    existing = ss.insertSheet(targetName);
  } else if (existing.getName() !== targetName && ss.getSheetByName(targetName) === null) {
    existing.setName(targetName);
  }

  if (existing.getLastRow() === 0) {
    existing.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    return existing;
  }

  var currentHeaders = headersForSheet_(existing);
  var missing = expectedHeaders.filter(function (header) {
    return currentHeaders.indexOf(header) < 0;
  });

  if (missing.length) {
    if (targetName === 'Terminals') {
      return existing;
    }
    var startCol = currentHeaders.length + 1;
    existing.getRange(1, startCol, 1, missing.length).setValues([missing]);
  }

  return existing;
}

function terminalDefaults_() {
  return [
    {
      terminalNumber: 'NETS-001',
      status: 'Available',
      lastUsedBy: '',
      lastUsedDate: '',
      notes: 'Primary terminal',
      location: 'IT01',
      serialNumber: '141221146609',
      terminalId: '23043266'
    },
    {
      terminalNumber: 'NETS-002',
      status: 'Available',
      lastUsedBy: '',
      lastUsedDate: '',
      notes: 'Secondary terminal',
      location: 'IT02',
      serialNumber: '141183401711',
      terminalId: '23043267'
    }
  ];
}

function canonicalUserRoleHeaders_() {
  return ['Email', 'Name', 'IsAdmin', 'IsTech', 'IsApprover', 'IsFinance', 'Active', 'Notes'];
}

function knownProductionBaseUrl_() {
  return NLF.PUBLICATION_DEFAULTS.WEBAPP_URL;
}

function knownProductionPageUrl_(page) {
  return knownProductionBaseUrl_() + '?page=' + encodeURIComponent(page);
}

function configSeedDefaults_() {
  var techRecipients = [
    NLF.PUBLICATION_DEFAULTS.TECH_LEAD_EMAIL,
    NLF.PUBLICATION_DEFAULTS.TECH_BACKUP_EMAIL
  ].join(',');
  var financeRecipients = NLF.PUBLICATION_DEFAULTS.FINANCE_EMAIL;

  return [
    { key: NLF.CFG.DOMAIN, value: NLF.PUBLICATION_DEFAULTS.DOMAIN, description: 'Allowed email domain for organization users.' },
    { key: NLF.CFG.WEB_APP_URL, value: knownProductionBaseUrl_(), description: 'Base deployed web app URL. Replace with your Apps Script deployment URL after publishing the web app.' },
    { key: NLF.CFG.APP_URL, value: knownProductionBaseUrl_(), description: 'Legacy runtime base URL used when generating internal links. Keep aligned with WEB_APP_URL.' },
    { key: NLF.CFG.REQUEST_URL, value: knownProductionPageUrl_('request'), description: 'Direct link to the request form for end users.' },
    { key: NLF.CFG.TRACK_URL, value: knownProductionPageUrl_('track'), description: 'Direct link to the tracking search page.' },
    { key: NLF.CFG.TECH_URL, value: knownProductionPageUrl_('tech'), description: 'Direct link to the tech assignment dashboard.' },
    { key: NLF.CFG.APPROVAL_URL, value: knownProductionPageUrl_('approval'), description: 'Direct link to the approval dashboard.' },
    { key: NLF.CFG.FINANCE_URL, value: knownProductionPageUrl_('finance'), description: 'Direct link to the finance dashboard.' },
    { key: NLF.CFG.IT_RECIPIENTS, value: techRecipients, description: 'Primary comma-separated IT / tech notification recipients.' },
    { key: NLF.CFG.TECH_EMAILS, value: techRecipients, description: 'Legacy tech-recipient key retained for backward compatibility with older scripts.' },
    { key: NLF.CFG.DEFAULT_TECH_EMAIL, value: NLF.PUBLICATION_DEFAULTS.TECH_LEAD_EMAIL, description: 'Fallback primary tech owner used when no tech recipient list is configured.' },
    { key: NLF.CFG.FINANCE_RECIPIENTS, value: financeRecipients, description: 'Primary comma-separated finance notification recipients.' },
    { key: NLF.CFG.FINANCE_EMAILS, value: financeRecipients, description: 'Legacy finance-recipient key retained for backward compatibility with older scripts.' },
    { key: NLF.CFG.FINANCE_EMAIL, value: financeRecipients, description: 'Single finance fallback email for older logic that expects one recipient.' },
    { key: NLF.CFG.APPROVER_EMAIL_TEST, value: NLF.PUBLICATION_DEFAULTS.APPROVER_EMAIL, description: 'Approver inbox used while APPROVER_MODE is TEST.' },
    { key: NLF.CFG.APPROVER_EMAIL_LIVE, value: NLF.PUBLICATION_DEFAULTS.APPROVER_EMAIL, description: 'Approver inbox used when APPROVER_MODE is LIVE.' },
    { key: NLF.CFG.APPROVER_MODE, value: 'TEST', description: 'Approval routing mode. TEST sends to APPROVER_EMAIL_TEST; LIVE sends to APPROVER_EMAIL_LIVE.' },
    { key: NLF.CFG.REMINDER_COOLDOWN_HOURS, value: 12, description: 'Minimum hours between reminder emails for the same request.' },
    { key: NLF.CFG.REQUESTER_CC, value: '', description: 'Optional comma-separated CC recipients for requester-facing notifications.' },
    { key: NLF.CFG.ADMIN_EMAILS, value: NLF.PUBLICATION_DEFAULTS.ADMIN_EMAIL, description: 'Comma-separated admin emails with full dashboard access.' },
    { key: NLF.CFG.SEND_FINANCE_ON_SUBMISSION, value: 'Y', description: 'Legacy notification flag retained for backward compatibility. The current production-safe flow notifies finance after assignment.' },
    { key: NLF.CFG.WAITLIST_REMINDER_EMAIL, value: NLF.PUBLICATION_DEFAULTS.WAITLIST_EMAIL, description: 'Recipient used for waitlist reminder notifications.' },
    { key: NLF.CFG.ALLOW_REQUESTER_CANCEL, value: 'Y', description: 'Allow requesters to cancel eligible requests from tracking.' }
  ];
}

function seedConfig_(configSheet) {
  var defaults = configSeedDefaults_();
  var existing = rowsToObjects_(configSheet).rows;
  var byKey = {};
  var valueMap = {};

  existing.forEach(function (row) {
    var key = String(row.obj.Key || '').trim();
    if (!key) return;
    byKey[key] = row;
    valueMap[key] = row.obj.Value;
  });

  defaults.forEach(function (item) {
    var resolvedValue = valueFromConfigMap_(valueMap, item.key, item.value);
    var existingRow = byKey[item.key];
    if (!existingRow) {
      configSheet.appendRow([item.key, resolvedValue, item.description]);
      valueMap[item.key] = resolvedValue;
      return;
    }

    configSheet.getRange(existingRow.rowNumber, 2).setValue(resolvedValue);
    configSheet.getRange(existingRow.rowNumber, 3).setValue(item.description);
    valueMap[item.key] = resolvedValue;
  });
}

function defaultProductionRoleRows_() {
  return [
    {
      email: NLF.PUBLICATION_DEFAULTS.ADMIN_EMAIL,
      name: 'Master Admin',
      isAdmin: true,
      isTech: true,
      isApprover: true,
      isFinance: true,
      active: 'Y',
      notes: 'Master admin; full access'
    },
    {
      email: NLF.PUBLICATION_DEFAULTS.TECH_LEAD_EMAIL,
      name: 'Operations Lead',
      isAdmin: false,
      isTech: true,
      isApprover: true,
      isFinance: true,
      active: 'Y',
      notes: 'Tech, approver, finance'
    },
    {
      email: NLF.PUBLICATION_DEFAULTS.TECH_BACKUP_EMAIL,
      name: 'Technician',
      isAdmin: false,
      isTech: true,
      isApprover: false,
      isFinance: false,
      active: 'Y',
      notes: 'Tech'
    },
    {
      email: NLF.PUBLICATION_DEFAULTS.APPROVER_EMAIL,
      name: 'Approver',
      isAdmin: false,
      isTech: false,
      isApprover: true,
      isFinance: false,
      active: 'Y',
      notes: 'Approver'
    },
    {
      email: NLF.PUBLICATION_DEFAULTS.FINANCE_EMAIL,
      name: 'Finance Reviewer',
      isAdmin: false,
      isTech: false,
      isApprover: false,
      isFinance: true,
      active: 'Y',
      notes: 'Finance'
    }
  ];
}

function normalizeActiveCell_(value) {
  var text = String(value || '').toUpperCase().trim();
  if (!text) return 'Y';
  if (text === 'N' || text === 'NO' || text === 'FALSE' || text === '0' || text === 'INACTIVE') return 'N';
  if (text === 'Y' || text === 'YES' || text === 'TRUE' || text === '1' || text === 'ACTIVE') return 'Y';
  return 'Y';
}

function mergeRoleNotes_(current, incoming) {
  var left = cleanText_(current);
  var right = cleanText_(incoming);
  if (!left) return right;
  if (!right || left === right) return left;
  return left + ' | ' + right;
}

function roleLabelsFromRecord_(record) {
  var labels = [];
  if (record.isAdmin) labels.push('Admin');
  if (record.isTech) labels.push('Tech');
  if (record.isApprover) labels.push('Approver');
  if (record.isFinance) labels.push('Finance');
  return labels;
}

function roleFlagsFromTextForSetup_(value) {
  if (typeof roleFlagsFromText_ === 'function') {
    return roleFlagsFromText_(value);
  }

  var text = String(value || '')
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[+\/&]+/g, ',')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    isAdmin: /\b(ADMIN|MASTER ADMIN|MASTERADMIN|SUPER ADMIN|SUPERADMIN)\b/.test(text),
    isTech: /\b(TECH|IT|TECH TEAM|IT TEAM|TECHNICIAN)\b/.test(text),
    isApprover: /\b(APPROVER|APPROVAL)\b/.test(text),
    isFinance: /\b(FINANCE|FINANCE VIEWER|FINANCE TEAM)\b/.test(text)
  };
}

function defaultRoleNotesForRecord_(record) {
  var labels = roleLabelsFromRecord_(record);
  if (record.isAdmin && record.isTech && record.isApprover && record.isFinance) {
    return 'Master admin; full access';
  }
  return labels.join(', ');
}

function buildRoleRecordFromRow_(row) {
  row = row || {};
  var email = normalizeEmail_(row.Email || '');
  if (!email) return null;

  var legacyFlags = roleFlagsFromTextForSetup_(String(row.Roles || row.Role || ''));
  var notes = cleanText_(row.Notes || '');
  var legacyRole = cleanText_(row.Role || row.Roles || '');
  if (!notes && /MASTER[_ ]ADMIN/i.test(legacyRole)) {
    notes = 'Master admin; full access';
  }

  return {
    email: email,
    name: cleanText_(row.Name || '') || deriveNameFromEmail_(email),
    isAdmin: parseBool_(row.IsAdmin) || legacyFlags.isAdmin,
    isTech: parseBool_(row.IsTech) || legacyFlags.isTech,
    isApprover: parseBool_(row.IsApprover) || legacyFlags.isApprover,
    isFinance: parseBool_(row.IsFinance) || legacyFlags.isFinance,
    active: normalizeActiveCell_(row.Active),
    notes: notes
  };
}

function mergeRoleRecord_(current, incoming) {
  if (!current) {
    return {
      email: incoming.email,
      name: incoming.name,
      isAdmin: !!incoming.isAdmin,
      isTech: !!incoming.isTech,
      isApprover: !!incoming.isApprover,
      isFinance: !!incoming.isFinance,
      active: incoming.active || 'Y',
      notes: incoming.notes || ''
    };
  }

  current.name = incoming.name || current.name;
  current.isAdmin = !!(current.isAdmin || incoming.isAdmin);
  current.isTech = !!(current.isTech || incoming.isTech);
  current.isApprover = !!(current.isApprover || incoming.isApprover);
  current.isFinance = !!(current.isFinance || incoming.isFinance);
  current.active = (current.active === 'Y' || incoming.active === 'Y') ? 'Y' : 'N';
  current.notes = mergeRoleNotes_(current.notes, incoming.notes);
  if (!current.notes) current.notes = defaultRoleNotesForRecord_(current);
  return current;
}

function applySeedRoleRecord_(current, seed) {
  var preservedNotes = current ? current.notes : '';
  return {
    email: seed.email,
    name: seed.name,
    isAdmin: !!seed.isAdmin,
    isTech: !!seed.isTech,
    isApprover: !!seed.isApprover,
    isFinance: !!seed.isFinance,
    active: 'Y',
    notes: seed.notes || preservedNotes || defaultRoleNotesForRecord_(seed)
  };
}

function seedRoles_(rolesSheet) {
  var canonicalHeaders = canonicalUserRoleHeaders_();
  var rows = rowsToObjects_(rolesSheet).rows;
  var byEmail = {};

  rows.forEach(function (row) {
    var record = buildRoleRecordFromRow_(row.obj);
    if (!record) return;
    if (!record.notes) record.notes = defaultRoleNotesForRecord_(record);
    byEmail[record.email] = mergeRoleRecord_(byEmail[record.email], record);
  });

  var seededRows = defaultProductionRoleRows_();
  seededRows.forEach(function (seed) {
    byEmail[seed.email] = applySeedRoleRecord_(byEmail[seed.email], seed);
  });

  var orderedEmails = seededRows.map(function (seed) { return seed.email; });
  Object.keys(byEmail)
    .filter(function (email) {
      return orderedEmails.indexOf(email) < 0;
    })
    .sort()
    .forEach(function (email) {
      orderedEmails.push(email);
    });

  var outputRows = orderedEmails
    .map(function (email) { return byEmail[email]; })
    .filter(function (record) { return !!record; })
    .map(function (record) {
      return [
        record.email,
        record.name,
        record.isAdmin ? 'Y' : 'N',
        record.isTech ? 'Y' : 'N',
        record.isApprover ? 'Y' : 'N',
        record.isFinance ? 'Y' : 'N',
        record.active || 'Y',
        record.notes || ''
      ];
    });

  rolesSheet.clearContents();
  rolesSheet.getRange(1, 1, 1, canonicalHeaders.length).setValues([canonicalHeaders]);
  if (outputRows.length) {
    rolesSheet.getRange(2, 1, outputRows.length, canonicalHeaders.length).setValues(outputRows);
  }

  var maxColumns = rolesSheet.getMaxColumns();
  if (maxColumns > canonicalHeaders.length) {
    rolesSheet.deleteColumns(canonicalHeaders.length + 1, maxColumns - canonicalHeaders.length);
  }
}

function seedTerminals_() {
  var sh = terminalsSheet_();
  var rows = rowsToObjects_(sh).rows;
  if (rows.length >= 2) return;
  cleanupTerminalsSheet_();
}

function cleanupTerminalsSheet_() {
  var sh = terminalsSheet_();
  var values = sh.getDataRange().getValues();
  var headers = values.length ? values[0].map(function (x) { return cleanText_(x); }) : [];
  var rows = values.length > 1 ? values.slice(1) : [];

  var canonical = ['TerminalNumber', 'Status', 'LastUsedBy', 'LastUsedDate', 'Notes', 'Location', 'Serial Number', 'Terminal ID'];
  var defaults = terminalDefaults_();
  var headerExact = headers.length === canonical.length && canonical.every(function (h, i) { return headers[i] === h; });
  var noExtraColumns = sh.getMaxColumns() === canonical.length;
  var extraDataRows = rows.slice(2).some(function (row) {
    return row.some(function (cell) { return String(cell || '').trim() !== ''; });
  });
  var row1ok = rows[0] && cleanText_(rows[0][0]) === 'NETS-001' && cleanText_(rows[0][6]) === '141221146609' && cleanText_(rows[0][7]) === '23043266';
  var row2ok = rows[1] && cleanText_(rows[1][0]) === 'NETS-002' && cleanText_(rows[1][6]) === '141183401711' && cleanText_(rows[1][7]) === '23043267';
  if (headerExact && noExtraColumns && row1ok && row2ok && !extraDataRows) return;

  var byTerminal = {};
  defaults.forEach(function (item) {
    byTerminal[item.terminalNumber] = {
      terminalNumber: item.terminalNumber,
      status: item.status,
      lastUsedBy: item.lastUsedBy,
      lastUsedDate: item.lastUsedDate,
      notes: item.notes,
      location: item.location,
      serialNumber: item.serialNumber,
      terminalId: item.terminalId
    };
  });

  function valueByAliases_(row, aliases) {
    for (var i = 0; i < aliases.length; i++) {
      var idx = headers.indexOf(aliases[i]);
      if (idx < 0) continue;
      var value = row[idx];
      if (value !== '' && value !== null && value !== undefined) return value;
    }
    return '';
  }

  function resolveTerminalNumber_(rowObj) {
    var number = cleanText_(rowObj.terminalNumber);
    var id = cleanText_(rowObj.terminalId);
    var serial = cleanText_(rowObj.serialNumber);

    if (number === 'NETS-001' || id === '23043266' || serial === '141221146609' || /001$/.test(number) || /001$/.test(id)) return 'NETS-001';
    if (number === 'NETS-002' || id === '23043267' || serial === '141183401711' || /002$/.test(number) || /002$/.test(id)) return 'NETS-002';
    return '';
  }

  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var rowObj = {
      terminalNumber: cleanText_(valueByAliases_(row, ['TerminalNumber', 'TerminalName', 'Terminal Name'])),
      status: cleanText_(valueByAliases_(row, ['Status', 'AvailabilityStatus'])),
      lastUsedBy: cleanText_(valueByAliases_(row, ['LastUsedBy', 'CurrentHolder'])),
      lastUsedDate: valueByAliases_(row, ['LastUsedDate', 'LastAssignedDate']),
      notes: cleanText_(valueByAliases_(row, ['Notes', 'Remarks'])),
      location: cleanText_(valueByAliases_(row, ['Location'])),
      serialNumber: cleanText_(valueByAliases_(row, ['Serial Number', 'SerialNumber'])),
      terminalId: cleanText_(valueByAliases_(row, ['Terminal ID', 'TerminalID']))
    };

    var mappedNumber = resolveTerminalNumber_(rowObj);
    if (!mappedNumber) continue;
    var target = byTerminal[mappedNumber];
    if (!target) continue;

    var normalizedStatus = normalizeTerminalStatus_(rowObj.status || target.status);
    if (['Available', 'In Use', 'Under maintenance'].indexOf(normalizedStatus) >= 0) target.status = normalizedStatus;
    if (rowObj.lastUsedBy) target.lastUsedBy = rowObj.lastUsedBy;
    if (rowObj.lastUsedDate) target.lastUsedDate = rowObj.lastUsedDate;
    if (rowObj.notes) target.notes = rowObj.notes;
    if (rowObj.location) target.location = rowObj.location;
    if (rowObj.serialNumber) target.serialNumber = rowObj.serialNumber;
    if (rowObj.terminalId) target.terminalId = rowObj.terminalId;
  }

  var outputRows = defaults.map(function (item) {
    var merged = byTerminal[item.terminalNumber];
    return [
      item.terminalNumber,
      merged.status || item.status,
      merged.lastUsedBy || '',
      merged.lastUsedDate || '',
      merged.notes || item.notes,
      merged.location || item.location,
      merged.serialNumber || item.serialNumber,
      merged.terminalId || item.terminalId
    ];
  });

  sh.clearContents();
  sh.getRange(1, 1, 1, canonical.length).setValues([canonical]);
  sh.getRange(2, 1, outputRows.length, canonical.length).setValues(outputRows);

  var maxColumns = sh.getMaxColumns();
  if (maxColumns > canonical.length) {
    sh.deleteColumns(canonical.length + 1, maxColumns - canonical.length);
  }
}

function checkNetsHeaders() {
  var req = headersForSheet_(requestsSheet_());
  var term = headersForSheet_(terminalsSheet_());
  var log = headersForSheet_(workflowSheet_());

  Logger.log('Requests headers (' + req.length + '): ' + JSON.stringify(req));
  Logger.log('Terminals headers (' + term.length + '): ' + JSON.stringify(term));
  Logger.log('Workflow headers (' + log.length + '): ' + JSON.stringify(log));
}

// Backward-compatible alias used in earlier script versions.
function checkHeaders() {
  checkNetsHeaders();
}

function uniqueList_(arr) {
  var seen = {};
  var out = [];
  arr.forEach(function (item) {
    if (!item || seen[item]) return;
    seen[item] = true;
    out.push(item);
  });
  return out;
}
