function sendEmailSafe_(opts) {
  var to = joinEmails_(parseEmailList_(opts.to || ''));
  if (!to) return;

  var cc = joinEmails_(parseEmailList_(opts.cc || ''));
  var email = {
    to: to,
    subject: opts.subject || NLF.APP_NAME,
    body: opts.body || '',
    name: NLF.APP_NAME
  };

  if (cc) email.cc = cc;
  if (opts.replyTo) email.replyTo = opts.replyTo;
  if (opts.htmlBody) email.htmlBody = opts.htmlBody;

  var loggedRecipients = cc ? (to + ' | CC: ' + cc) : to;

  try {
    MailApp.sendEmail(email);
    writeEmailLog_(opts.requestId || '', loggedRecipients, email.subject, opts.type || 'GENERAL', 'SENT');
  } catch (err) {
    writeEmailLog_(opts.requestId || '', loggedRecipients, email.subject, opts.type || 'GENERAL', 'FAILED: ' + err.message);
    throw err;
  }
}

function joinEmails_(emails) {
  return (emails || []).filter(function (x) { return !!x; }).join(',');
}

function uniqueEmails_(items) {
  var seen = {};
  var out = [];
  (items || []).forEach(function (item) {
    var email = normalizeEmail_(item);
    if (!email || seen[email]) return;
    seen[email] = true;
    out.push(email);
  });
  return out;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractRequestMetaFromRemarks_(remarks) {
  var meta = {
    notes: '',
    timeOption: '',
    halfDaySlot: '',
    specificTime: '',
    device: ''
  };

  var freeform = [];
  String(remarks || '')
    .split('|')
    .map(function (part) { return cleanText_(part); })
    .forEach(function (part) {
      if (!part) return;

      if (/^Time Option\s*:/i.test(part)) {
        meta.timeOption = cleanText_(part.split(':').slice(1).join(':'));
        return;
      }
      if (/^Half Day Slot\s*:/i.test(part)) {
        meta.halfDaySlot = cleanText_(part.split(':').slice(1).join(':'));
        return;
      }
      if (/^Specific Time\s*:/i.test(part)) {
        meta.specificTime = cleanText_(part.split(':').slice(1).join(':'));
        return;
      }
      if (/^Device\s*:/i.test(part)) {
        meta.device = cleanText_(part.split(':').slice(1).join(':'));
        return;
      }

      freeform.push(part);
    });

  meta.notes = freeform.join(' | ');
  return meta;
}

function requestEmailView_(req) {
  var meta = extractRequestMetaFromRemarks_(req.remarks || '');
  var budgetText = [
    req.glCode ? ('GL: ' + req.glCode) : '',
    req.costCentre ? ('Cost Centre: ' + req.costCentre) : '',
    req.specialTrackingCode ? ('Special Tracking Code: ' + req.specialTrackingCode) : ''
  ].filter(function (item) { return !!item; }).join(' | ');

  return {
    requestId: cleanText_(req.requestId || ''),
    status: cleanText_(req.status || ''),
    requesterName: cleanText_(req.requesterName || '-'),
    requesterEmail: cleanText_(req.requesterEmail || '-'),
    division: cleanText_(req.department || '-'),
    reason: cleanText_(req.purpose || '-'),
    eventName: cleanText_(req.eventName || '-'),
    location: cleanText_(req.location || '-'),
    startDate: formatDateDisplay_(req.needDate) || '-',
    endDate: formatDateDisplay_(req.returnDate) || '-',
    glCode: cleanText_(req.glCode || req.financeReference || '-'),
    costCentre: cleanText_(req.costCentre || '-'),
    specialTrackingCode: cleanText_(req.specialTrackingCode || '-'),
    budgetText: budgetText || '-',
    timeOption: cleanText_(meta.timeOption || '') || '-',
    halfDayTiming: [meta.halfDaySlot, meta.specificTime].filter(function (item) { return !!item; }).join(' | ') || '-',
    terminalAssigned: cleanText_(req.assignedTerminalId || '-') || '-',
    collectionDateTime: formatDateTimeDisplay_(req.collectionDateTime) || '-',
    returnedDateTime: formatDateTimeDisplay_(req.returnedDateTime) || '-',
    notes: cleanText_(meta.notes || req.remarks || '-') || '-',
    borrowingType: req.onBehalf ? 'On behalf of another user' : 'For myself',
    borrowerName: req.onBehalf ? (cleanText_(([req.borrowerFirst, req.borrowerLast].join(' '))) || '-') : '-',
    borrowerEmail: req.onBehalf ? (cleanText_(req.borrowerEmail || '-') || '-') : '-',
    relationship: req.onBehalf ? (cleanText_(req.relationship || '-') || '-') : '-'
  };
}

function requestSummaryLines_(req) {
  var view = requestEmailView_(req);
  return [
    'Request ID: ' + view.requestId,
    'Requester: ' + view.requesterName + ' (' + view.requesterEmail + ')',
    'Status: ' + view.status,
    'Division: ' + view.division,
    'Start Date: ' + view.startDate,
    'End Date: ' + view.endDate,
    'Terminal: ' + view.terminalAssigned
  ];
}

function requestSubmissionDetailsLines_(req) {
  var view = requestEmailView_(req);
  var lines = [
    'Requester Name: ' + view.requesterName,
    'Requester Email: ' + view.requesterEmail,
    'Division / Department: ' + view.division,
    'Reason: ' + view.reason,
    'Event Name: ' + view.eventName,
    'Deployment Location: ' + view.location,
    'Start Date: ' + view.startDate,
    'End Date: ' + view.endDate,
    'GL Code: ' + view.glCode,
    'Cost Centre: ' + view.costCentre,
    'Special Tracking Code: ' + view.specialTrackingCode,
    'Time Option: ' + view.timeOption,
    'Half Day Timing: ' + view.halfDayTiming,
    'Terminal Assigned: ' + view.terminalAssigned,
    'Collection Date / Time: ' + view.collectionDateTime,
    'Notes / Remarks: ' + view.notes,
    'Borrowing Type: ' + view.borrowingType
  ];

  if (req.onBehalf) {
    lines.push('Borrower Name: ' + view.borrowerName);
    lines.push('Borrower Email: ' + view.borrowerEmail);
    lines.push('Relationship: ' + view.relationship);
  }

  return lines;
}

function summaryItemsForEmail_(req) {
  var view = requestEmailView_(req);
  return [
    { label: 'Request ID', value: view.requestId },
    { label: 'Requester', value: view.requesterName },
    { label: 'Status', value: view.status },
    { label: 'Division', value: view.division },
    { label: 'Dates', value: view.startDate + ' to ' + view.endDate },
    { label: 'Terminal', value: view.terminalAssigned }
  ];
}

function detailItemsForEmail_(req, opts) {
  var view = requestEmailView_(req);
  var options = opts || {};
  var rows = [
    { label: 'Requester Name', value: view.requesterName },
    { label: 'Requester Email', value: view.requesterEmail },
    { label: 'Division / Department', value: view.division },
    { label: 'Reason', value: view.reason },
    { label: 'Event Name', value: view.eventName },
    { label: 'Deployment Location', value: view.location },
    { label: 'Start Date', value: view.startDate },
    { label: 'End Date', value: view.endDate },
    { label: 'GL Code', value: view.glCode },
    { label: 'Cost Centre', value: view.costCentre },
    { label: 'Special Tracking Code', value: view.specialTrackingCode },
    { label: 'Time Option', value: view.timeOption },
    { label: 'Half Day Timing', value: view.halfDayTiming },
    { label: 'Terminal Assigned', value: view.terminalAssigned },
    { label: 'Collection Date / Time', value: view.collectionDateTime },
    { label: 'Returned Date / Time', value: view.returnedDateTime },
    { label: 'Notes / Remarks', value: view.notes }
  ];

  if (options.includeBudgetText) {
    rows.splice(11, 0, { label: 'Budget Summary', value: view.budgetText });
  }

  if (req.onBehalf) {
    rows.push({ label: 'Borrowing Type', value: view.borrowingType });
    rows.push({ label: 'Borrower Name', value: view.borrowerName });
    rows.push({ label: 'Borrower Email', value: view.borrowerEmail });
    rows.push({ label: 'Relationship', value: view.relationship });
  }

  return rows.filter(function (row) {
    return !!cleanText_(row.label);
  });
}

function actionButton_(label, url, kind) {
  if (!cleanText_(url)) return '';
  var isPrimary = kind !== 'secondary';
  var bg = isPrimary ? '#8b1e1e' : '#fdf7f7';
  var color = isPrimary ? '#ffffff' : '#8b1e1e';
  var border = isPrimary ? '#8b1e1e' : '#d7b4b4';

  return '' +
    '<tr>' +
      '<td style="padding:0 0 12px 0;">' +
      '<a href="' + escapeHtml_(url) + '" ' +
        'style="display:block;width:100%;max-width:280px;box-sizing:border-box;padding:14px 18px;border-radius:10px;border:1px solid ' + border + ';' +
        'background:' + bg + ';color:' + color + ';font-family:Arial,sans-serif;font-size:15px;line-height:1.3;' +
        'font-weight:700;text-align:center;text-decoration:none;">' + escapeHtml_(label) + '</a>' +
      '</td>' +
    '</tr>';
}

function renderFieldTable_(rows) {
  var html = '';
  (rows || []).forEach(function (row) {
    html += '' +
      '<tr>' +
        '<td valign="top" style="padding:8px 10px;border-bottom:1px solid #ececec;color:#6b7280;font-family:Arial,sans-serif;font-size:13px;font-weight:700;line-height:1.4;width:36%;">' + escapeHtml_(row.label) + '</td>' +
        '<td valign="top" style="padding:8px 10px;border-bottom:1px solid #ececec;color:#1f2937;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">' + escapeHtml_(row.value || '-') + '</td>' +
      '</tr>';
    });
  return html;
}

function renderTextEmail_(model) {
  var lines = [
    NLF.APP_NAME,
    model.title,
    '',
    model.intro
  ];

  if (model.summary && model.summary.length) {
    lines.push('', 'Summary');
    model.summary.forEach(function (item) {
      lines.push(item.label + ': ' + (item.value || '-'));
    });
  }

  if (model.details && model.details.length) {
    lines.push('', 'Request Details');
    model.details.forEach(function (item) {
      lines.push(item.label + ': ' + (item.value || '-'));
    });
  }

  if (model.actions && model.actions.length) {
    lines.push('', 'Actions');
    model.actions.forEach(function (action) {
      if (!cleanText_(action.url)) return;
      lines.push(action.label + ': ' + action.url);
    });
  }

  lines.push(
    '',
    '© 2026 ' + NLF.APP_NAME,
    'This is an automated notification. Please do not reply.'
  );

  return lines.join('\n');
}

function renderTransactionalEmail_(model) {
  var actionsHtml = '';
  (model.actions || []).forEach(function (action) {
    actionsHtml += actionButton_(action.label, action.url, action.kind);
  });

  var html = '' +
    '<!DOCTYPE html>' +
    '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
    '<body style="margin:0;padding:0;background:#f3f4f6;">' +
      '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' + escapeHtml_(model.preheader || model.title) + '</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;margin:0;padding:16px 0;">' +
        '<tr>' +
          '<td align="center" style="padding:0 10px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;border-collapse:separate;border-spacing:0;border-radius:16px;overflow:hidden;">' +
              '<tr><td style="height:6px;background:#8b1e1e;font-size:0;line-height:0;">&nbsp;</td></tr>' +
              '<tr>' +
                '<td style="padding:22px 20px 10px 20px;font-family:Arial,sans-serif;">' +
                  '<div style="color:#8b1e1e;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">' + escapeHtml_(NLF.APP_NAME) + '</div>' +
                  '<h1 style="margin:12px 0 8px 0;color:#111827;font-size:24px;line-height:1.25;font-weight:700;">' + escapeHtml_(model.title) + '</h1>' +
                  '<p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">' + escapeHtml_(model.intro) + '</p>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                '<td style="padding:10px 20px 0 20px;">' +
                  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf7f7;border:1px solid #ead6d6;border-radius:12px;">' +
                    '<tr>' +
                      '<td style="padding:14px 16px 4px 16px;color:#6b7280;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Summary</td>' +
                    '</tr>' +
                    '<tr>' +
                      '<td style="padding:0 16px 14px 16px;">' +
                        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + renderFieldTable_(model.summary || []) + '</table>' +
                      '</td>' +
                    '</tr>' +
                  '</table>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                '<td style="padding:16px 20px 0 20px;font-family:Arial,sans-serif;">' +
                  '<div style="color:#111827;font-size:16px;font-weight:700;margin:0 0 10px 0;">Request Details</div>' +
                  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ececec;border-radius:12px;overflow:hidden;background:#ffffff;">' + renderFieldTable_(model.details || []) + '</table>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                '<td style="padding:18px 20px 0 20px;">' +
                  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:280px;">' + actionsHtml + '</table>' +
                '</td>' +
              '</tr>' +
              '<tr>' +
                '<td style="padding:18px 20px 24px 20px;">' +
                  '<div style="border-top:1px solid #ececec;padding-top:14px;color:#6b7280;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;">' +
                    '© 2026 ' + escapeHtml_(NLF.APP_NAME) + '<br>' +
                    'This is an automated notification. Please do not reply.' +
                  '</div>' +
                '</td>' +
              '</tr>' +
            '</table>' +
          '</td>' +
        '</tr>' +
      '</table>' +
    '</body></html>';

  return {
    html: html,
    text: renderTextEmail_(model)
  };
}

function sendWorkflowEmail_(opts) {
  var rendered = renderTransactionalEmail_({
    title: opts.title,
    preheader: opts.preheader,
    intro: opts.intro,
    summary: opts.summary || [],
    details: opts.details || [],
    actions: opts.actions || []
  });

  sendEmailSafe_({
    to: opts.to,
    cc: opts.cc,
    subject: opts.subject,
    body: rendered.text,
    htmlBody: rendered.html,
    requestId: opts.requestId,
    type: opts.type,
    replyTo: opts.replyTo
  });
}

// Centralized recipient routing so notification targets are easy to audit.
function requesterCcFor_(req) {
  return uniqueEmails_(getRequesterCcEmails_().filter(function (email) {
    return email !== normalizeEmail_(req.requesterEmail);
  }));
}

function requesterEnvelope_(req) {
  return {
    to: cleanText_(req.requesterEmail || ''),
    cc: joinEmails_(requesterCcFor_(req))
  };
}

function techRecipientsForNotification_() {
  return uniqueEmails_(getTechEmails_());
}

function financeRecipientsForNotification_() {
  return uniqueEmails_(getFinanceEmails_());
}

function approverRecipientForNotification_(req) {
  return normalizeEmail_(req.approverEmail || getApproverEmail_());
}

function internalReturnRecipientsForNotification_(req) {
  return uniqueEmails_([req.assignedTechEmail].concat(financeRecipientsForNotification_()));
}

function cancellationRecipientsForNotification_(req) {
  return uniqueEmails_([req.requesterEmail].concat(techRecipientsForNotification_(), [req.approverEmail]));
}

function overdueRecipientsForNotification_(req) {
  return uniqueEmails_([req.requesterEmail, req.assignedTechEmail].concat(techRecipientsForNotification_()));
}

function trackRequestUrl_(req) {
  return getPageUrl_('track', { requestId: req.requestId });
}

function requestActions_(req) {
  return [
    { label: 'Track Request', url: trackRequestUrl_(req), kind: 'primary' }
  ];
}

function techDashboardActions_(req) {
  return [
    { label: 'Open IT Dashboard', url: getPageUrl_('tech', { requestId: req.requestId }), kind: 'primary' }
  ];
}

function financeActions_(req) {
  return [
    { label: 'Open Finance Portal', url: getPageUrl_('finance', { requestId: req.requestId }), kind: 'primary' }
  ];
}

function approvalActions_(req) {
  return [
    { label: 'Open Approval Page', url: getPageUrl_('approval', { requestId: req.requestId }), kind: 'primary' }
  ];
}

function notifySubmission_(req) {
  var requester = requesterEnvelope_(req);
  sendWorkflowEmail_({
    to: requester.to,
    cc: requester.cc,
    subject: '[NETS] Request Submitted - ' + req.requestId,
    title: 'Request Submitted',
    preheader: 'Your NETS request has been submitted.',
    intro: 'Your NETS terminal request has been submitted and is waiting for IT assignment.',
    summary: summaryItemsForEmail_(req),
    details: detailItemsForEmail_(req, { includeBudgetText: true }),
    actions: requestActions_(req),
    requestId: req.requestId,
    type: 'SUBMISSION_REQUESTER'
  });

  var techRecipients = techRecipientsForNotification_();
  if (techRecipients.length) {
    sendWorkflowEmail_({
      to: joinEmails_(techRecipients),
      subject: '[NETS] New Request Waiting for Assignment - ' + req.requestId,
      title: 'New Request Waiting for Assignment',
      preheader: 'A new NETS request is waiting in the assignment queue.',
      intro: 'A new NETS terminal request has been submitted and is waiting in the assignment queue.',
      summary: summaryItemsForEmail_(req),
      details: detailItemsForEmail_(req, { includeBudgetText: true }),
      actions: techDashboardActions_(req),
      requestId: req.requestId,
      type: 'SUBMISSION_TECH'
    });
  }
}

function notifyApprovalRequired_(req) {
  var approver = approverRecipientForNotification_(req);
  if (!approver) return;

  sendWorkflowEmail_({
    to: approver,
    subject: '[NETS] Approval Required - ' + req.requestId,
    title: 'Approval Required',
    preheader: 'Both terminals are unavailable for the requested dates.',
    intro: 'Both terminals are unavailable for the requested dates. Please review this request for waitlist approval.',
    summary: summaryItemsForEmail_(req),
    details: detailItemsForEmail_(req, { includeBudgetText: true }),
    actions: approvalActions_(req),
    requestId: req.requestId,
    type: 'APPROVAL_REQUIRED'
  });
}

function notifyFinanceAssignment_(req) {
  var financeRecipients = financeRecipientsForNotification_();
  if (!financeRecipients.length) return;

  sendWorkflowEmail_({
    to: joinEmails_(financeRecipients),
    subject: '[NETS] Finance Notification - ' + req.requestId,
    title: 'Finance Notification',
    preheader: 'A terminal has been assigned and finance visibility is now available.',
    intro: 'A NETS terminal has been assigned. Finance can now review the request, budget, and terminal details.',
    summary: summaryItemsForEmail_(req),
    details: detailItemsForEmail_(req, { includeBudgetText: true }),
    actions: financeActions_(req),
    requestId: req.requestId,
    type: 'ASSIGNED_FINANCE'
  });
}

function notifyAssignment_(req) {
  var requester = requesterEnvelope_(req);
  sendWorkflowEmail_({
    to: requester.to,
    cc: requester.cc,
    subject: '[NETS] Terminal Assigned - ' + req.requestId,
    title: 'Terminal Assigned',
    preheader: 'A NETS terminal has been assigned to your request.',
    intro: 'A NETS terminal has been assigned to your request. Collection details are shown below.',
    summary: summaryItemsForEmail_(req),
    details: detailItemsForEmail_(req, { includeBudgetText: true }),
    actions: requestActions_(req),
    requestId: req.requestId,
    type: 'ASSIGNED_REQUESTER'
  });

  notifyFinanceAssignment_(req);
}

function notifyApprovalDecision_(req, approved, note) {
  sendWorkflowEmail_({
    to: req.requesterEmail,
    cc: joinEmails_(requesterCcFor_(req)),
    subject: approved ? '[NETS] Request Approved for Queue - ' + req.requestId : '[NETS] Request Rejected - ' + req.requestId,
    title: approved ? 'Request Approved' : 'Request Rejected',
    preheader: approved ? 'Your request has been approved and moved to the tech queue.' : 'Your request has been rejected.',
    intro: approved
      ? 'Your request has been approved and moved to the tech assignment queue.'
      : 'Your request has been rejected.',
    summary: summaryItemsForEmail_(req),
    details: detailItemsForEmail_(req, { includeBudgetText: true }).concat(note ? [{ label: 'Decision Note', value: note }] : []),
    actions: requestActions_(req),
    requestId: req.requestId,
    type: approved ? 'APPROVED' : 'REJECTED'
  });
}

function notifyReminder_(req, recipient, requestedBy) {
  sendWorkflowEmail_({
    to: recipient,
    subject: '[NETS] Reminder - ' + req.requestId,
    title: 'Request Reminder',
    preheader: 'A reminder was issued for this NETS terminal request.',
    intro: 'A reminder was issued for this NETS terminal request.',
    summary: summaryItemsForEmail_(req),
    details: detailItemsForEmail_(req, { includeBudgetText: true }).concat(requestedBy ? [{ label: 'Requested By', value: requestedBy }] : []),
    actions: requestActions_(req),
    requestId: req.requestId,
    type: 'REMINDER'
  });
}

function notifyReturned_(req) {
  var requester = requesterEnvelope_(req);
  sendWorkflowEmail_({
    to: requester.to,
    cc: requester.cc,
    subject: '[NETS] Request Completed - ' + req.requestId,
    title: 'Request Completed',
    preheader: 'The terminal has been returned and your request is complete.',
    intro: 'The terminal has been returned and your request is now complete.',
    summary: summaryItemsForEmail_(req),
    details: detailItemsForEmail_(req, { includeBudgetText: true }),
    actions: requestActions_(req),
    requestId: req.requestId,
    type: 'COMPLETED_REQUESTER'
  });

  var internalRecipients = internalReturnRecipientsForNotification_(req);
  if (internalRecipients.length) {
    sendWorkflowEmail_({
      to: joinEmails_(internalRecipients),
      subject: '[NETS] Request Returned - ' + req.requestId,
      title: 'Request Returned',
      preheader: 'The terminal has been returned and the request has been closed.',
      intro: 'The terminal has been returned and the request has been closed.',
      summary: summaryItemsForEmail_(req),
      details: detailItemsForEmail_(req, { includeBudgetText: true }),
      actions: [
        { label: 'Open IT Dashboard', url: getPageUrl_('tech', { requestId: req.requestId }), kind: 'primary' },
        { label: 'Open Finance Portal', url: getPageUrl_('finance', { requestId: req.requestId }), kind: 'secondary' }
      ],
      requestId: req.requestId,
      type: 'RETURNED_INTERNAL'
    });
  }
}

function notifyCancellation_(req, reason) {
  var recipients = cancellationRecipientsForNotification_(req);
  sendWorkflowEmail_({
    to: joinEmails_(recipients),
    subject: '[NETS] Request Cancelled - ' + req.requestId,
    title: 'Request Cancelled',
    preheader: 'This NETS terminal request has been cancelled.',
    intro: 'This NETS terminal request has been cancelled by the requester.',
    summary: summaryItemsForEmail_(req),
    details: detailItemsForEmail_(req, { includeBudgetText: true }).concat(reason ? [{ label: 'Cancellation Reason', value: reason }] : []),
    actions: requestActions_(req),
    requestId: req.requestId,
    type: 'CANCELLED'
  });
}
