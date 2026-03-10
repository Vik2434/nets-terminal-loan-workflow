function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(NLF.APP_NAME)
    .addItem('Setup / Repair Sheets', 'setupNetsLoanForm')
    .addItem('Check Headers', 'checkNetsHeaders')
    .addSeparator()
    .addItem('Show Web App URL', 'showWebAppUrl_')
    .addToUi();
}

function showWebAppUrl_() {
  var url = ScriptApp.getService().getUrl() || '(Deploy web app first)';
  SpreadsheetApp.getUi().alert(NLF.APP_NAME + ' URL:\n\n' + url);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function buildBoot_(page, params, templateName) {
  var email = currentUserEmail_();
  var requesterName = { name: '', source: 'none' };
  var template = templateName || pageToTemplate_(page);

  if (template === 'Index') {
    requesterName = getRequesterNameBootstrap_(email, { allowHistory: false });
  }

  return {
    page: page,
    params: params || {},
    appUrl: getAppUrl_(),
    navUrls: {
      request: getPageUrl_('request'),
      track: getPageUrl_('track'),
      trackview: getPageUrl_('trackView'),
      tech: getPageUrl_('tech'),
      approval: getPageUrl_('approval'),
      finance: getPageUrl_('finance'),
      confirmation: getPageUrl_('confirmation')
    },
    userEmail: email,
    userName: requesterName.name || '',
    userNameSource: requesterName.source || 'none',
    role: '',
    allowedDomain: getAllowedDomain_(),
    approverEmail: template === 'ApprovalDashboard' ? getApproverEmail_() : '',
    now: toIso_(now_())
  };
}

function pageToTemplate_(page) {
  var key = String(page || '').toLowerCase().trim();

  if (key === '' || key === 'request' || key === 'index') return 'Index';
  if (key === 'track' || key === 'tracking') return 'Track';
  if (key === 'trackview' || key === 'trackingview' || key === 'track-view') return 'TrackView';
  if (key === 'tech' || key === 'it') return 'TechDashboard';
  if (key === 'approval' || key === 'approve') return 'ApprovalDashboard';
  if (key === 'finance') return 'FinancePortal';
  if (key === 'confirm' || key === 'confirmation') return 'ConfirmationPage';

  return 'Index';
}

function hasPageAccess_(page, email) {
  if (!isAllowedDomainEmail_(email)) return false;

  if (page === 'Track' || page === 'TrackView') {
    return true;
  }

  if (page === 'TechDashboard') {
    return hasTechAccess_(email);
  }

  if (page === 'ApprovalDashboard') {
    return hasApprovalAccess_(email);
  }

  if (page === 'FinancePortal') {
    return hasFinanceAccess_(email);
  }

  return true;
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var requestedPage = cleanText_(params.page || 'request');
    var templateName = pageToTemplate_(requestedPage);

    var boot = buildBoot_(requestedPage, params, templateName);

    if (!hasPageAccess_(templateName, boot.userEmail)) {
      var deniedTemplate = HtmlService.createTemplateFromFile('AccessDenied');
      deniedTemplate.boot = boot;
      return deniedTemplate.evaluate().setTitle('Access Denied');
    }

    var template = HtmlService.createTemplateFromFile(templateName);
    template.boot = boot;

    return template.evaluate()
      .setTitle(NLF.APP_NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    var t = HtmlService.createTemplateFromFile('ErrorPage');
    t.errorMessage = err.message;
    return t.evaluate().setTitle('NETS Loan Form - Error');
  }
}
