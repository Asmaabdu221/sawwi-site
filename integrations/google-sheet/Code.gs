/**
 * سوّي · استقبال تسجيلات الموقع في جدول Google.
 * يُلصق في Apps Script من داخل الجدول نفسه (Extensions ← Apps Script)،
 * ويُنشر Web app: Execute as = Me، Who has access = Anyone.
 *
 * كل تسجيل يصير صف: التاريخ، الاسم، البريد، المهمة، المصدر، الحالة.
 * عمود «الحالة» يبدأ «جديد»، وn8n يغيّره لما يرسل إيميل الترحيب.
 */

const SHEET_NAME = 'التسجيلات';
const HEADERS = ['التاريخ', 'الاسم', 'البريد', 'المهمة', 'المصدر', 'الحالة'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  const p = (e && e.parameter) || {};

  // حقل مخفي: البشر ما يعبّونه، والبوتات تعبّيه. نرد بنجاح ونتجاهله.
  if (p.website) return json_({ ok: true });

  const name = clean_(p.name, 80);
  const email = clean_(p.email, 120).toLowerCase();
  const task = clean_(p.task, 300);
  const source = clean_(p.source, 40) || 'الموقع';

  if (!name) return json_({ ok: false, error: 'name' });
  if (!EMAIL_RE.test(email)) return json_({ ok: false, error: 'email' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sheet_();
    const last = sheet.getLastRow();
    if (last > 1) {
      const emails = sheet.getRange(2, 3, last - 1, 1).getValues().flat();
      if (emails.indexOf(email) !== -1) return json_({ ok: true, duplicate: true });
    }
    sheet.appendRow([new Date(), name, email, task, source, 'جديد']);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

// فتح الرابط في المتصفح يقول إنه شغّال، بدون ما يكشف أي بيانات.
function doGet() {
  return json_({ ok: true, service: 'sawwi-signup' });
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
  }
  return sheet;
}

// يقص الطول، ويمنع النص اللي يبدأ بـ = + - @ من إنه يشتغل كمعادلة في الجدول.
function clean_(value, max) {
  let v = String(value || '').replace(/[\u0000-\u001F]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
