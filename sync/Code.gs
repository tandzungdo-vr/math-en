/* =====================================================================
   Math English — sync backend (Google Apps Script web app).
   Keeps one JSON file (math-en-sync.json) in the Drive of the account
   that deploys it. The page sends { key, action, rev, data } as a
   text/plain POST; requests without the right key get "forbidden".

   Setup (see README.md → Sync):
     Project Settings → Script properties → SYNC_KEY = same value as .env
     Deploy → New deployment → Web app → Execute as: Me, Access: Anyone
   No secrets in this file: the key lives in the script properties.
===================================================================== */
var FILE_NAME = 'math-en-sync.json';

function doGet() {
  return reply({ ok: true });   // lets you check the deployment URL in a browser
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return reply({ error: 'bad-request' }); }
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('SYNC_KEY');
  if (!key || !req || req.key !== key) return reply({ error: 'forbidden' });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var file = syncFile(props);
    var stored = JSON.parse(file.getBlob().getDataAsString() || '{}');
    var rev = stored.rev || 0;
    if (req.action === 'get') return reply({ rev: rev, data: stored.data || null });
    if (req.action === 'put') {
      // compare-and-swap: the page must have seen the latest revision
      if (req.rev !== rev) return reply({ conflict: true, rev: rev, data: stored.data || null });
      if (!req.data || typeof req.data !== 'object') return reply({ error: 'bad-request' });
      rev += 1;
      file.setContent(JSON.stringify({ rev: rev, saved: new Date().toISOString(), data: req.data }));
      return reply({ rev: rev });
    }
    return reply({ error: 'bad-request' });
  } finally {
    lock.releaseLock();
  }
}

function syncFile(props) {
  var id = props.getProperty('FILE_ID');
  if (id) {
    try { var f = DriveApp.getFileById(id); if (!f.isTrashed()) return f; } catch (err) {}
  }
  var file = DriveApp.createFile(FILE_NAME, '{}', 'application/json');
  props.setProperty('FILE_ID', file.getId());
  return file;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
