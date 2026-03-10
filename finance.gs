function requireFinanceAccess_() {
  var email = currentUserEmail_();
  ensure_(isAllowedDomainEmail_(email), 'Internal access only.');

  ensure_(hasFinanceAccess_(email), 'Finance access required.');

  return email;
}

function parseBudgetCodesForFinance_(budgetCodesText) {
  var text = cleanText_(budgetCodesText || '');
  var out = { glCode: '', costCentre: '' };
  if (!text) return out;

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
  }

  return out;
}

function apiGetFinancePortalData() {
  try {
    var email = requireFinanceAccess_();
    var relevant = getNormalizedRequestsByStatuses_([
      NLF.STATUS.SUBMITTED,
      NLF.STATUS.ASSIGNED,
      NLF.STATUS.PENDING_APPROVAL,
      NLF.STATUS.PENDING_TECH_ASSIGNMENT,
      NLF.STATUS.READY_FOR_COLLECTION,
      NLF.STATUS.ON_LOAN,
      NLF.STATUS.COMPLETED,
      NLF.STATUS.RETURNED,
      NLF.STATUS.REJECTED,
      NLF.STATUS.CANCELLED
    ]);

    relevant.sort(function (a, b) {
      return (toDate_(b.submittedAt || b.requestDateTime) || 0) - (toDate_(a.submittedAt || a.requestDateTime) || 0);
    });

    var rows = relevant.slice(0, 300).map(function (req) {
      var parsedBudget = parseBudgetCodesForFinance_(req.budgetCodes);
      var division = cleanText_(req.department || '');
      var terminal = cleanText_(req.assignedTerminalId || '');
      var submittedAt = req.submittedAt || req.requestDateTime || '';
      var lastUpdated = req.lastUpdated || req.requestDateTime || '';

      return {
        requestId: req.requestId,
        status: req.status,
        requesterName: req.requesterName || '-',
        division: division || '-',
        glCode: cleanText_(req.glCode || req.financeReference || parsedBudget.glCode || ''),
        costCentre: cleanText_(req.costCentre || parsedBudget.costCentre || ''),
        specialTrackingCode: cleanText_(req.specialTrackingCode || ''),
        terminal: terminal || '-',
        startDate: req.needDate || '',
        endDate: req.returnDate || '',
        submittedAt: submittedAt,
        lastUpdated: lastUpdated
      };
    });

    var divisions = {};
    var terminals = {};
    rows.forEach(function (item) {
      if (item.division && item.division !== '-') divisions[item.division] = true;
      if (item.terminal && item.terminal !== '-') terminals[item.terminal] = true;
    });

    var divisionList = Object.keys(divisions).sort();
    var terminalList = Object.keys(terminals).sort();

    return {
      ok: true,
      userEmail: email,
      rows: rows,
      requests: rows,
      filters: {
        divisions: divisionList,
        terminals: terminalList
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
