var NLF = NLF || {};
var NLF_RUNTIME = NLF_RUNTIME || {};

NLF.APP_NAME = 'NETS Terminal Loan Workflow';
NLF.PUBLICATION_DEFAULTS = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  WEBAPP_URL: 'https://script.google.com/macros/s/YOUR_WEBAPP_DEPLOYMENT_ID/exec',
  DOMAIN: 'your-domain.example',
  ADMIN_EMAIL: 'admin@your-domain.example',
  TECH_LEAD_EMAIL: 'tech.lead@your-domain.example',
  TECH_BACKUP_EMAIL: 'tech.ops@your-domain.example',
  APPROVER_EMAIL: 'approver@your-domain.example',
  FINANCE_EMAIL: 'finance@your-domain.example',
  WAITLIST_EMAIL: 'waitlist@your-domain.example'
};
NLF.DEFAULT_DOMAIN = NLF.PUBLICATION_DEFAULTS.DOMAIN;
NLF.TIMEZONE = Session.getScriptTimeZone() || 'Asia/Singapore';
NLF.SS_ID = NLF.PUBLICATION_DEFAULTS.SPREADSHEET_ID;

NLF.SHEET_NAMES = {
  REQUESTS: ['Requests', 'REQUESTS'],
  TERMINALS: ['Terminals', 'TERMINALS', 'Inventory', 'INVENTORY'],
  WORKFLOW_LOG: ['Workflow_Log', 'WORKFLOW_LOG', 'Audit_Log', 'AUDIT_LOG'],
  CONFIG: ['Config', 'CONFIG'],
  EMAIL_LOG: ['Email_Log', 'EMAIL_LOG'],
  USER_ROLES: ['User_Roles', 'USER_ROLES']
};

NLF.STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PENDING_TECH_ASSIGNMENT: 'Pending Tech Assignment',
  ASSIGNED: 'Assigned',
  READY_FOR_COLLECTION: 'Ready for Collection',
  ON_LOAN: 'On Loan',
  COMPLETED: 'Completed',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled'
};

NLF.ROLE = {
  REQUESTER: 'REQUESTER',
  TECH: 'TECH',
  APPROVER: 'APPROVER',
  FINANCE_VIEWER: 'FINANCE_VIEWER',
  ADMIN: 'ADMIN'
};

NLF.FIELD = {
  ID: ['ID', 'RequestID'],
  STATUS: ['Status'],
  REQUEST_DATE_TIME: ['RequestDateTime', 'RequestDate', 'SubmittedAt', 'Submitted At'],
  REQUESTER_NAME: ['RequesterName', 'Requester Name'],
  REQUESTER_FIRST: ['RequesterFirst'],
  REQUESTER_LAST: ['RequesterLast'],
  REQUESTER_EMAIL: ['RequesterEmail', 'Requester Email'],
  EMPLOYEE_ID: ['EmployeeID'],
  DEPARTMENT: ['Department', 'Division'],
  PURPOSE: ['Purpose', 'Reason'],
  NEED_DATE: ['NeedDate', 'StartDate', 'Start Date'],
  RETURN_DATE: ['ReturnDate', 'EndDate', 'End Date'],
  PLANNED_DAYS: ['PlannedDays', 'Days', 'Planned Days'],
  FINANCE_REFERENCE: ['FinanceReference', 'GLCode', 'GL Code'],
  GL_CODE: ['GLCode', 'FinanceReference'],
  COST_CENTRE: ['CostCentre', 'Cost Centre'],
  SPECIAL_TRACKING_CODE: ['SpecialTrackingCode', 'Special Tracking Code'],
  BUDGET_CODES: ['BudgetCodes', 'Budget Codes'],
  REMARKS: ['Remarks', 'IssueNotes', 'Notes'],
  EVENT_NAME: ['EventName'],
  LOCATION: ['Location'],
  APPROVAL_REQUIRED: ['ApprovalRequired'],
  APPROVER_EMAIL: ['ApproverEmail'],
  ASSIGNED_TECH_EMAIL: ['AssignedTechEmail', 'ITBy'],
  ASSIGNED_TERMINAL_ID: ['AssignedTerminalID', 'TerminalNumber', 'Terminal'],
  COLLECTION_DATE_TIME: ['CollectionDateTime', 'ITAt'],
  RETURNED_DATE_TIME: ['ReturnedDateTime'],
  LAST_REMINDER_SENT: ['LastReminderSent'],
  FINANCE_NOTIFIED: ['FinanceNotified'],
  OWNER_EMAIL: ['OwnerEmail'],
  ON_BEHALF: ['OnBehalf'],
  BORROWER_FIRST: ['BorrowerFirst'],
  BORROWER_LAST: ['BorrowerLast'],
  BORROWER_EMAIL: ['BorrowerEmail'],
  RELATIONSHIP: ['Relationship'],
  STEP1_TOKEN: ['Step1Token'],
  STEP2_TOKEN: ['Step2Token'],
  STEP3_TOKEN: ['Step3Token'],
  CREATED_AT: ['CreatedAt'],
  UPDATED_AT: ['UpdatedAt', 'Last Updated'],
  CANCELLED_AT: ['CancelledAt'],
  CANCELLED_BY: ['CancelledBy'],
  APPROVAL_NOTE: ['ApprovalNote', 'FinanceNotesToRequester']
};

NLF.CFG = {
  DOMAIN: 'DOMAIN',
  IT_RECIPIENTS: 'IT_RECIPIENTS',
  TECH_EMAILS: 'TECH_EMAILS',
  DEFAULT_TECH_EMAIL: 'DEFAULT_TECH_EMAIL',
  FINANCE_RECIPIENTS: 'FINANCE_RECIPIENTS',
  FINANCE_EMAIL: 'FINANCE_EMAIL',
  FINANCE_EMAILS: 'FINANCE_EMAILS',
  APPROVER_EMAIL_TEST: 'APPROVER_EMAIL_TEST',
  APPROVER_EMAIL_LIVE: 'APPROVER_EMAIL_LIVE',
  APPROVER_MODE: 'APPROVER_MODE',
  REMINDER_COOLDOWN_HOURS: 'REMINDER_COOLDOWN_HOURS',
  APP_URL: 'APP_URL',
  WEB_APP_URL: 'WEB_APP_URL',
  REQUEST_URL: 'REQUEST_URL',
  TRACK_URL: 'TRACK_URL',
  TECH_URL: 'TECH_URL',
  APPROVAL_URL: 'APPROVAL_URL',
  FINANCE_URL: 'FINANCE_URL',
  REQUESTER_CC: 'REQUESTER_CC',
  ADMIN_EMAILS: 'ADMIN_EMAILS',
  SEND_FINANCE_ON_SUBMISSION: 'SEND_FINANCE_ON_SUBMISSION',
  WAITLIST_REMINDER_EMAIL: 'WAITLIST_REMINDER_EMAIL',
  ALLOW_REQUESTER_CANCEL: 'ALLOW_REQUESTER_CANCEL'
};

function runtimeMemo_() {
  NLF_RUNTIME.spreadsheet = NLF_RUNTIME.spreadsheet || null;
  NLF_RUNTIME.sheets = NLF_RUNTIME.sheets || {};
  NLF_RUNTIME.configSheet = NLF_RUNTIME.configSheet || null;
  NLF_RUNTIME.configMap = NLF_RUNTIME.configMap || null;
  NLF_RUNTIME.derived = NLF_RUNTIME.derived || {};
  NLF_RUNTIME.headers = NLF_RUNTIME.headers || {};
  NLF_RUNTIME.rows = NLF_RUNTIME.rows || {};
  NLF_RUNTIME.requests = NLF_RUNTIME.requests || {};
  NLF_RUNTIME.roles = NLF_RUNTIME.roles || {};
  NLF_RUNTIME.terminals = NLF_RUNTIME.terminals || {};
  NLF_RUNTIME.workflow = NLF_RUNTIME.workflow || {};
  NLF_RUNTIME.users = NLF_RUNTIME.users || {};
  NLF_RUNTIME.boot = NLF_RUNTIME.boot || {};
  NLF_RUNTIME.session = NLF_RUNTIME.session || {};
  return NLF_RUNTIME;
}

function clearConfigMemo_() {
  var memo = runtimeMemo_();
  memo.configMap = null;
  memo.derived = {};
}

function configAliasKeys_(key) {
  var map = {};
  map[NLF.CFG.IT_RECIPIENTS] = [NLF.CFG.TECH_EMAILS];
  map[NLF.CFG.TECH_EMAILS] = [NLF.CFG.IT_RECIPIENTS];
  map[NLF.CFG.FINANCE_RECIPIENTS] = [NLF.CFG.FINANCE_EMAILS, NLF.CFG.FINANCE_EMAIL];
  map[NLF.CFG.FINANCE_EMAILS] = [NLF.CFG.FINANCE_RECIPIENTS, NLF.CFG.FINANCE_EMAIL];
  map[NLF.CFG.FINANCE_EMAIL] = [NLF.CFG.FINANCE_RECIPIENTS, NLF.CFG.FINANCE_EMAILS];
  map[NLF.CFG.WEB_APP_URL] = [NLF.CFG.APP_URL];
  map[NLF.CFG.APP_URL] = [NLF.CFG.WEB_APP_URL];
  return map[key] || [];
}

function valueFromConfigMap_(map, key, defaultValue) {
  map = map || {};
  if (Object.prototype.hasOwnProperty.call(map, key)) {
    var direct = map[key];
    if (direct !== '' && direct !== null && direct !== undefined) return direct;
  }

  var aliases = configAliasKeys_(key);
  for (var i = 0; i < aliases.length; i++) {
    var alias = aliases[i];
    if (!Object.prototype.hasOwnProperty.call(map, alias)) continue;
    var aliasValue = map[alias];
    if (aliasValue !== '' && aliasValue !== null && aliasValue !== undefined) return aliasValue;
  }

  return defaultValue;
}

function spreadsheet_() {
  var memo = runtimeMemo_();
  if (!memo.spreadsheet) {
    var configuredId = cleanText_(NLF.SS_ID);
    if (configuredId && !isPlaceholderValue_(configuredId)) {
      memo.spreadsheet = SpreadsheetApp.openById(configuredId);
    } else {
      var active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) memo.spreadsheet = active;
    }
  }
  if (!memo.spreadsheet) {
    throw new Error('Spreadsheet not configured. Replace NLF.SS_ID in Config.gs or bind the project to a spreadsheet before setup/deployment.');
  }
  return memo.spreadsheet;
}

function getSheetByCandidates_(nameCandidates) {
  var memo = runtimeMemo_();
  var key = (nameCandidates || []).join('|');
  if (Object.prototype.hasOwnProperty.call(memo.sheets, key)) {
    return memo.sheets[key];
  }

  var ss = spreadsheet_();
  var found = null;
  for (var i = 0; i < nameCandidates.length; i++) {
    found = ss.getSheetByName(nameCandidates[i]);
    if (found) break;
  }

  memo.sheets[key] = found || null;
  return memo.sheets[key];
}

function getConfigSheet_() {
  var memo = runtimeMemo_();
  if (!memo.configSheet) {
    memo.configSheet = getSheetByCandidates_(NLF.SHEET_NAMES.CONFIG);
  }
  if (!memo.configSheet) throw new Error('Config sheet not found. Run setupNetsLoanForm().');
  return memo.configSheet;
}

function getCfgMap_() {
  var memo = runtimeMemo_();
  if (memo.configMap) return memo.configMap;

  var sh = getConfigSheet_();
  var values = sh.getDataRange().getValues();
  var map = {};
  for (var r = 1; r < values.length; r++) {
    var key = String(values[r][0] || '').trim();
    if (!key) continue;
    map[key] = values[r][1];
  }
  memo.configMap = map;
  return memo.configMap;
}

function getCfg_(key, defaultValue) {
  try {
    return valueFromConfigMap_(getCfgMap_(), key, defaultValue);
  } catch (err) {
    Logger.log('getCfg_ error for ' + key + ': ' + err.message);
  }
  return defaultValue;
}

function setCfg_(key, value, description) {
  var sh = getConfigSheet_();
  var values = sh.getDataRange().getValues();
  var hasDescriptionColumn = values.length > 0 && values[0].length >= 3;
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0] || '').trim() === key) {
      sh.getRange(r + 1, 2).setValue(value);
      if (hasDescriptionColumn && description !== undefined) {
        sh.getRange(r + 1, 3).setValue(description);
      }
      clearConfigMemo_();
      return true;
    }
  }
  sh.appendRow(hasDescriptionColumn ? [key, value, description || ''] : [key, value]);
  clearConfigMemo_();
  return true;
}

function parseEmailList_(value) {
  var raw = String(value || '');
  return raw
    .split(/[,\n;]+/)
    .map(function (item) { return normalizeEmail_(item); })
    .filter(function (item) { return !!item; });
}

function getAllowedDomain_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'allowedDomain')) {
    memo.derived.allowedDomain = String(getCfg_(NLF.CFG.DOMAIN, NLF.DEFAULT_DOMAIN)).toLowerCase().trim();
  }
  return memo.derived.allowedDomain;
}

function isAllowedDomainEmail_(email) {
  var normalized = normalizeEmail_(email);
  var domain = getAllowedDomain_();
  return !!normalized && normalized.slice(-domain.length - 1) === '@' + domain;
}

function getTechEmails_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'techEmails')) {
    var configured = parseEmailList_(getCfg_(NLF.CFG.TECH_EMAILS, ''));
    if (configured.length > 0) {
      memo.derived.techEmails = configured;
    } else {
      var fallback = normalizeEmail_(getCfg_(NLF.CFG.DEFAULT_TECH_EMAIL, defaultOperatorEmail_()));
      memo.derived.techEmails = fallback ? [fallback] : [];
    }
  }
  return memo.derived.techEmails.slice();
}

function getFinanceEmails_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'financeEmails')) {
    var primary = parseEmailList_(getCfg_(NLF.CFG.FINANCE_EMAILS, ''));
    if (primary.length > 0) {
      memo.derived.financeEmails = primary;
    } else {
      var single = normalizeEmail_(getCfg_(NLF.CFG.FINANCE_EMAIL, ''));
      memo.derived.financeEmails = single ? [single] : [];
    }
  }
  return memo.derived.financeEmails.slice();
}

function getApproverEmail_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'approverEmail')) {
    var mode = String(getCfg_(NLF.CFG.APPROVER_MODE, 'TEST')).toUpperCase().trim();
    if (mode === 'LIVE') {
      memo.derived.approverEmail = normalizeEmail_(getCfg_(NLF.CFG.APPROVER_EMAIL_LIVE, NLF.PUBLICATION_DEFAULTS.APPROVER_EMAIL));
    } else {
      memo.derived.approverEmail = normalizeEmail_(getCfg_(NLF.CFG.APPROVER_EMAIL_TEST, NLF.PUBLICATION_DEFAULTS.APPROVER_EMAIL));
    }
  }
  return memo.derived.approverEmail;
}

function getWaitlistReminderEmail_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'waitlistReminderEmail')) {
    var configured = normalizeEmail_(getCfg_(NLF.CFG.WAITLIST_REMINDER_EMAIL, ''));
    memo.derived.waitlistReminderEmail = configured || normalizeEmail_(getCfg_(NLF.CFG.APPROVER_EMAIL_LIVE, NLF.PUBLICATION_DEFAULTS.WAITLIST_EMAIL));
  }
  return memo.derived.waitlistReminderEmail;
}

function getAdminEmails_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'adminEmails')) {
    memo.derived.adminEmails = parseEmailList_(getCfg_(NLF.CFG.ADMIN_EMAILS, defaultOperatorEmail_()));
  }
  return memo.derived.adminEmails.slice();
}

function getRequesterCcEmails_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'requesterCcEmails')) {
    memo.derived.requesterCcEmails = parseEmailList_(getCfg_(NLF.CFG.REQUESTER_CC, ''));
  }
  return memo.derived.requesterCcEmails.slice();
}

function getAppUrl_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'appUrl')) {
    var configured = String(getCfg_(NLF.CFG.APP_URL, '') || '').trim();
    if (configured && !isPlaceholderValue_(configured)) {
      memo.derived.appUrl = configured;
    } else {
      memo.derived.appUrl = ScriptApp.getService().getUrl() || '';
    }
  }
  return memo.derived.appUrl;
}

function getReminderCooldownHours_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'reminderCooldownHours')) {
    var value = Number(getCfg_(NLF.CFG.REMINDER_COOLDOWN_HOURS, 12));
    memo.derived.reminderCooldownHours = !value || value < 1 ? 12 : value;
  }
  return memo.derived.reminderCooldownHours;
}

function shouldSendFinanceOnSubmission_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'sendFinanceOnSubmission')) {
    var value = String(getCfg_(NLF.CFG.SEND_FINANCE_ON_SUBMISSION, 'Y')).toUpperCase().trim();
    memo.derived.sendFinanceOnSubmission = value === 'Y' || value === 'TRUE' || value === '1';
  }
  return memo.derived.sendFinanceOnSubmission;
}

function isRequesterCancelEnabled_() {
  var memo = runtimeMemo_();
  if (!Object.prototype.hasOwnProperty.call(memo.derived, 'requesterCancelEnabled')) {
    var value = String(getCfg_(NLF.CFG.ALLOW_REQUESTER_CANCEL, 'Y')).toUpperCase().trim();
    memo.derived.requesterCancelEnabled = value === 'Y' || value === 'TRUE' || value === '1';
  }
  return memo.derived.requesterCancelEnabled;
}
