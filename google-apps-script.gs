/*
 * Creek View — Google Sheets datastore
 * --------------------------------------------------------------------
 * SETUP
 * 1. Create a new Google Sheet.
 * 2. Extensions -> Apps Script. Delete the default code, paste this file.
 * 3. Deploy -> New deployment -> type "Web app".
 *      - Execute as:  Me
 *      - Who has access:  Anyone
 * 4. Copy the Web app URL.
 * 5. In Vercel: Project -> Settings -> Environment Variables, add
 *      SHEETS_WEBHOOK_URL = <the Web app URL>
 *    then redeploy.
 *
 * Three tabs are created automatically on first write:
 *   visits(rid, ip, user_agent, referer, country, ts)
 *   events(rid, event_type, ts)
 *   leads(rid, full_name, email, phone, whatsapp, unit_type, purpose, contact_time, ts)
 */

var SCHEMA = {
  visit: { sheet: 'visits', columns: ['rid', 'ip', 'user_agent', 'referer', 'country', 'ts'] },
  event: { sheet: 'events', columns: ['rid', 'event_type', 'ts'] },
  lead:  { sheet: 'leads',  columns: ['rid', 'full_name', 'email', 'phone', 'whatsapp', 'unit_type', 'purpose', 'contact_time', 'ts'] }
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var cfg = SCHEMA[data.type];
    if (!cfg) {
      return json({ ok: false, error: 'unknown type' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(cfg.sheet);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.sheet);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(cfg.columns);
    }

    sheet.appendRow(cfg.columns.map(function (key) {
      return data[key] != null ? data[key] : '';
    }));

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, service: 'creek-view-datastore' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
