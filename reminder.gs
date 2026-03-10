function sendOverdueLoanReminders() {
  var today = toDate_(toYmd_(now_()));
  var all = getAllRequests_();

  all.forEach(function (req) {
    if (req.status !== NLF.STATUS.ON_LOAN) return;
    var returnDate = toDate_(req.returnDate);
    if (!returnDate) return;

    if (returnDate.getTime() < today.getTime()) {
      var recipients = overdueRecipientsForNotification_(req);
      if (!recipients.length) return;

      sendWorkflowEmail_({
        to: recipients.join(','),
        subject: '[NETS] Overdue Return Reminder - ' + req.requestId,
        title: 'Overdue Return Reminder',
        preheader: 'This NETS terminal loan is overdue and requires return action.',
        intro: 'This NETS terminal loan is overdue and requires return action.',
        summary: summaryItemsForEmail_(req),
        details: detailItemsForEmail_(req, { includeBudgetText: true }).concat([
          { label: 'Return Date', value: formatDateDisplay_(req.returnDate) || '-' }
        ]),
        actions: [
          { label: 'Open IT Dashboard', url: getPageUrl_('tech', { requestId: req.requestId }), kind: 'primary' },
          { label: 'Track Request', url: trackRequestUrl_(req), kind: 'secondary' }
        ],
        requestId: req.requestId,
        type: 'OVERDUE'
      });
    }
  });
}
