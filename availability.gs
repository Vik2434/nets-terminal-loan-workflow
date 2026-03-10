function isClosedStatus_(status) {
  var closed = [
    NLF.STATUS.REJECTED,
    NLF.STATUS.COMPLETED,
    NLF.STATUS.RETURNED,
    NLF.STATUS.CLOSED,
    NLF.STATUS.CANCELLED
  ];
  return closed.indexOf(status) >= 0;
}

function getTerminalBlockingRequests_(terminalId, needDate, returnDate, excludeRequestId) {
  var target = cleanText_(terminalId);
  var requests = getAllRequests_();

  return requests.filter(function (req) {
    if (!req.assignedTerminalId) return false;
    if (cleanText_(req.assignedTerminalId) !== target) return false;
    if (excludeRequestId && req.requestId === excludeRequestId) return false;
    if (isClosedStatus_(req.status)) return false;
    return dateRangesOverlap_(req.needDate, req.returnDate, needDate, returnDate);
  });
}

function isTerminalAvailableForRange_(terminalId, needDate, returnDate, excludeRequestId) {
  var blocks = getTerminalBlockingRequests_(terminalId, needDate, returnDate, excludeRequestId);
  return blocks.length === 0;
}

function getAvailableTerminalsForRange_(needDate, returnDate, excludeRequestId) {
  var terminals = listTerminals_();
  return terminals.filter(function (terminal) {
    var status = String(terminal.status || '').toLowerCase();
    if (status && status !== 'available') {
      return false;
    }
    return isTerminalAvailableForRange_(terminal.terminalId, needDate, returnDate, excludeRequestId);
  });
}

function hasAnyTerminalAvailability_(needDate, returnDate) {
  return getAvailableTerminalsForRange_(needDate, returnDate, '').length > 0;
}
