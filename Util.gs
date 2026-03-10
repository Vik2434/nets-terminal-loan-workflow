function now_() {
  return new Date();
}

function toDate_(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (value === null || value === undefined || value === '') return null;
  var dt = new Date(value);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function toIso_(value) {
  var dt = toDate_(value);
  if (!dt) return '';
  return Utilities.formatDate(dt, NLF.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function toYmd_(value) {
  var dt = toDate_(value);
  if (!dt) return '';
  return Utilities.formatDate(dt, NLF.TIMEZONE, 'yyyy-MM-dd');
}

function formatDateDisplay_(value) {
  var dt = toDate_(value);
  if (!dt) return '';
  return Utilities.formatDate(dt, NLF.TIMEZONE, 'dd MMM yyyy');
}

function formatDateTimeDisplay_(value) {
  var dt = toDate_(value);
  if (!dt) return '';
  return Utilities.formatDate(dt, NLF.TIMEZONE, 'dd MMM yyyy HH:mm');
}

function isPlaceholderValue_(value) {
  var text = String(value === null || value === undefined ? '' : value).trim();
  if (!text) return false;
  if (/YOUR_[A-Z0-9_]+/i.test(text)) return true;
  if (/YOUR_WEBAPP_DEPLOYMENT_ID/i.test(text)) return true;
  if (/@your-domain\.example$/i.test(text)) return true;
  if (/^your-domain\.example$/i.test(text)) return true;
  return false;
}

function normalizeEmail_(value) {
  var text = String(value === null || value === undefined ? '' : value)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
  if (!text) return '';
  if (isPlaceholderValue_(text)) return '';

  text = text.replace(/^mailto:/i, '').trim();

  var bracketMatch = text.match(/<\s*([^>]+)\s*>/);
  if (bracketMatch && bracketMatch[1]) {
    text = bracketMatch[1];
  }

  var emailMatch = text.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  if (emailMatch && emailMatch[0]) {
    text = emailMatch[0];
  }

  return text.trim().toLowerCase();
}

function cleanText_(value) {
  return String(value || '').trim();
}

function deriveNameFromEmail_(email) {
  var local = cleanText_(String(email || '').split('@')[0] || '');
  if (!local) return '';

  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, function (ch) { return ch.toUpperCase(); })
    .trim();
}

function ensure_(condition, message) {
  if (!condition) throw new Error(message);
}

function uuidShort_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase();
}

function generateRequestId_() {
  var stamp = Utilities.formatDate(now_(), NLF.TIMEZONE, 'yyyyMMdd');
  return 'REQ-' + stamp + '-' + uuidShort_().slice(0, 5);
}

function makeToken_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 18);
}

function parseNameParts_(fullName) {
  var cleaned = cleanText_(fullName);
  if (!cleaned) return { first: '', last: '' };
  var parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return {
    first: parts[0],
    last: parts.slice(1).join(' ')
  };
}

function dateRangesOverlap_(startA, endA, startB, endB) {
  var a1 = toDate_(startA);
  var a2 = toDate_(endA);
  var b1 = toDate_(startB);
  var b2 = toDate_(endB);
  if (!a1 || !a2 || !b1 || !b2) return false;
  return a1.getTime() <= b2.getTime() && b1.getTime() <= a2.getTime();
}

function buildUrl_(page, params) {
  var base = getAppUrl_();
  if (!base) return '';

  var query = ['page=' + encodeURIComponent(page)];
  var keys = Object.keys(params || {});
  for (var i = 0; i < keys.length; i++) {
    if (params[keys[i]] === '' || params[keys[i]] === null || params[keys[i]] === undefined) continue;
    query.push(encodeURIComponent(keys[i]) + '=' + encodeURIComponent(String(params[keys[i]])));
  }

  return base + (base.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
}

function appendUrlParams_(baseUrl, params) {
  var base = cleanText_(baseUrl);
  if (!base) return '';

  var query = [];
  var keys = Object.keys(params || {});
  for (var i = 0; i < keys.length; i++) {
    if (params[keys[i]] === '' || params[keys[i]] === null || params[keys[i]] === undefined) continue;
    query.push(encodeURIComponent(keys[i]) + '=' + encodeURIComponent(String(params[keys[i]])));
  }

  if (!query.length) return base;
  return base + (base.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
}

function getPageUrl_(page, params) {
  var key = '';
  var normalizedPage = cleanText_(page).toLowerCase();
  if (normalizedPage === 'track') key = NLF.CFG.TRACK_URL;
  if (normalizedPage === 'tech') key = NLF.CFG.TECH_URL;
  if (normalizedPage === 'approval') key = NLF.CFG.APPROVAL_URL;
  if (normalizedPage === 'finance') key = NLF.CFG.FINANCE_URL;
  if (normalizedPage === 'request') key = NLF.CFG.REQUEST_URL;

  var configured = key ? cleanText_(getCfg_(key, '')) : '';
  if (configured && !isPlaceholderValue_(configured)) {
    return appendUrlParams_(configured, params);
  }

  return buildUrl_(page, params);
}

function currentUserEmail_() {
  var memo = runtimeMemo_();
  if (Object.prototype.hasOwnProperty.call(memo.session, 'currentUserEmail')) {
    return memo.session.currentUserEmail;
  }

  try {
    memo.session.currentUserEmail = normalizeEmail_(Session.getActiveUser().getEmail());
    return memo.session.currentUserEmail;
  } catch (err) {
    Logger.log('currentUserEmail_ error: ' + err.message);
    memo.session.currentUserEmail = '';
    return memo.session.currentUserEmail;
  }
}

function defaultOperatorEmail_() {
  var memo = runtimeMemo_();
  if (Object.prototype.hasOwnProperty.call(memo.session, 'defaultOperatorEmail')) {
    return memo.session.defaultOperatorEmail;
  }

  try {
    var effective = normalizeEmail_(Session.getEffectiveUser().getEmail());
    if (effective) {
      memo.session.defaultOperatorEmail = effective;
      return memo.session.defaultOperatorEmail;
    }
  } catch (err) {
    Logger.log('defaultOperatorEmail_ error: ' + err.message);
  }

  memo.session.defaultOperatorEmail = currentUserEmail_();
  return memo.session.defaultOperatorEmail;
}

function parseBool_(value) {
  var text = String(value || '').toUpperCase().trim();
  return text === 'Y' || text === 'YES' || text === 'TRUE' || text === '1';
}
