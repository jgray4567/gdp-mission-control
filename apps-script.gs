/**
 * GDP Mission Control Sync Endpoint (Google Apps Script)
 * Deploy as Web App:
 *  - Execute as: Me
 *  - Who has access: Anyone with the link
 */

const SHARED_SYNC_TOKEN = 'CHANGE_ME_STRONG_TOKEN';

function doPost(e) {
  try {
    const headers = e && e.parameter ? e.parameter : {};
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    const sheetId = body.sheetId;
    const actions = body.actions || [];
    const incomingToken = body.token || body.syncToken || '';
    if (!incomingToken || incomingToken !== SHARED_SYNC_TOKEN) {
      throw new Error('Unauthorized: invalid sync token');
    }
    if (!sheetId) throw new Error('Missing sheetId');

    const ss = SpreadsheetApp.openById(sheetId);
    const shJobs = ss.getSheetByName('Jobs');
    const shTime = ss.getSheetByName('Time Log');
    const shInvoices = ss.getSheetByName('Invoices');
    const shClients = ss.getSheetByName('Clients');

    let applied = 0;

    actions.forEach(a => {
      const p = a.payload || {};
      switch (a.type) {
        case 'new_job':
          shJobs.appendRow([
            p.jobNumber || '',
            p.client || '',
            p.project || '',
            p.owner || '',
            'Lead',
            new Date(),
            p.due || '',
            '',
            '',
            p.notes || ''
          ]);
          applied++;
          break;

        case 'log_time':
          shTime.appendRow([
            p.date || new Date(),
            p.client || '',
            p.project || '',
            p.person || '',
            p.hours || '',
            p.billable || 'Yes',
            p.description || '',
            ''
          ]);
          applied++;
          break;

        case 'bill_it':
          const amount = Number(p.amount || (Number(p.hours || 0) * Number(p.rate || 0)));
          shInvoices.appendRow([
            '',
            p.client || '',
            p.issue || new Date(),
            p.due || '',
            p.hours || '',
            p.rate || 100,
            amount,
            'Draft',
            '',
            p.description || p.project || ''
          ]);
          applied++;
          break;

        case 'add_client':
          shClients.appendRow([
            p.client || '',
            p.contact || '',
            p.email || '',
            p.phone || '',
            p.rate || 100,
            'Net 15',
            p.status || 'Active',
            'Added from Mission Control'
          ]);
          applied++;
          break;

        case 'set_client_status':
          // Find client in Clients sheet column A and update status in column G
          const data = shClients.getRange(2,1, Math.max(0, shClients.getLastRow()-1), 7).getValues();
          for (let i = 0; i < data.length; i++) {
            if (String(data[i][0]).trim().toLowerCase() === String(p.client || '').trim().toLowerCase()) {
              shClients.getRange(i + 2, 7).setValue(p.status || 'Active');
              applied++;
              break;
            }
          }
          break;
      }
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, applied }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
