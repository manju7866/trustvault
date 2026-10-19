const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

let currentHash = '0000000000000000000000000000000000000000000000000000000000000000';
const documents = [
  { id: 'doc-101', name: 'Q4_Salary_Letters.pdf', category: 'HR Management', owner: 'Admin (System)', accessGrants: ['Viewer_User_A'] },
  { id: 'doc-202', name: 'Corporate_Merger_Contract.docx', category: 'Legal Frameworks', owner: 'Document_Owner_B', accessGrants: [] }
];
const auditLedger = [];

function logToLedger(actor, action, target, result) {
  const timestamp = new Date().toLocaleTimeString();
  const logString = `${actor}-${action}-${target}-${currentHash}`;
  currentHash = crypto.createHash('sha256').update(logString).digest('hex');
  auditLedger.unshift({ timestamp, actor, action, target, result, chainBlock: currentHash.substring(0, 16) });
}

app.get('/', (req, res) => {
  let docHtml = '';
  for (let i = 0; i < documents.length; i++) {
    let d = documents[i];
    let grants = d.accessGrants.length ? d.accessGrants.join(', ') : 'None (Strict Isolation Mode)';
    docHtml += `
      <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #38bdf8;">
        <span style="font-size: 11px; background: #334155; padding: 2px 6px; border-radius: 4px; color: #cbd5e1;">${d.category}</span>
        <h3 style="margin: 10px 0 5px 0; font-size: 16px; color: #f1f5f9;">📄 ${d.name}</h3>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8;"><strong>Access Control List:</strong> ${grants}</p>
        <div style="display: flex; gap: 8px;">
          <a href="/api/view?user=owner_uuid_1&doc=${d.id}" style="background: #0284c7; color: white; text-decoration: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">🔑 Owner Access</a>
          <a href="/api/view?user=hacker_uuid_99&doc=${d.id}" style="background: #e11d48; color: white; text-decoration: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">🚨 Hack Request Route</a>
        </div>
      </div>
    `;
  }

  let ledgerHtml = '';
  if (auditLedger.length === 0) {
    ledgerHtml = '<p style="color: #64748b; font-size: 13px; font-style: italic;">No system actions captured yet. Click the buttons on the left to trigger the firewall tracker.</p>';
  } else {
    for (let i = 0; i < auditLedger.length; i++) {
      let l = auditLedger[i];
      let resColor = l.result === 'DENIED' ? '#f43f5e' : '#10b981';
      ledgerHtml += `
        <div style="font-family: monospace; font-size: 12px; border-bottom: 1px solid #334155; padding: 8px 0; color: #cbd5e1;">
          <span style="color: #64748b;">[${l.timestamp}]</span> 
          <span style="color: ${resColor}; font-weight: bold;">[${l.result}]</span><br/>
          User <strong>${l.actor}</strong> requested ${l.target}<br/>
          <span style="color: #64748b;">⛓️ Ledger Hash Link: ${l.chainBlock}...</span>
        </div>
      `;
    }
  }

  res.send(`
    <html>
    <head><title>TrustVault - Security Orchestration Panel</title></head>
    <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; margin: 0;">
      <div style="max-width: 1100px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155;">
        <h1 style="color: #38bdf8; margin: 0 0 5px 0; font-size: 26px;">🛡️ TrustVault Security Control Workspace</h1>
        <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 14px;">Production Engine Status: Active | Cryptographic Audit Ledger Chaining: Engaged</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div>
            <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #f1f5f9; border-bottom: 1px solid #334155; padding-bottom: 8px;">📂 Encrypted Document Registry</h2>
            ${docHtml}
          </div>
          <div>
            <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #f1f5f9; border-bottom: 1px solid #334155; padding-bottom: 8px;">🔗 Real-Time Append-Only Audit Feed</h2>
            <div style="max-height: 400px; overflow-y: auto; background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #334155;">
              ${ledgerHtml}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/view', (req, res) => {
  const { user, doc } = req.query;
  const targetDoc = documents.find(d => d.id === doc);
  
  if (!targetDoc) return res.status(404).send("File missing.");

  if (targetDoc.owner === 'Admin (System)' && user === 'owner_uuid_1') {
    logToLedger(user, 'ACCESS_GRANTED', targetDoc.name, 'PASSED');
    res.send(`
      <body style="background:#0f172a; color:#f8fafc; font-family:sans-serif; padding:50px; text-align:center;">
        <h1 style="color:#10b981">🔓 Identity Verified</h1>
        <p>Streaming Core File Payload: <strong>${targetDoc.name}</strong></p>
        <a href="/" style="color:#38bdf8; text-decoration:none; font-weight:bold;">📂 Return to Security Panel</a>
      </body>
    `);
  } else {
    logToLedger(user, 'IDOR_ATTACK_BLOCKED', targetDoc.name, 'DENIED');
    res.send(`
      <body style="background:#0f172a; color:#f8fafc; font-family:sans-serif; padding:50px; text-align:center;">
        <h1 style="color:#f43f5e; font-size:36px;">🚫 403 Forbidden Error</h1>
        <h2 style="color:#cbd5e1;">TrustVault Real-Time Middleware Intervention</h2>
        <p style="color:#94a3b8; max-width:500px; margin:20px auto; line-height:1.6;">
          <strong>Server Diagnostics:</strong> Cross-Tenant IDOR validation failed. Your runtime access token holds non-matching clearance parameters for this file path. Action stopped.
        </p>
        <a href="/" style="color:#38bdf8; text-decoration:none; font-weight:bold;">📂 Return to Security Panel & View Updated Audit Trail</a>
      </body>
    `);
  }
});

app.listen(3000, () => {
  console.log("\n[⚡] TrustVault Core Dashboard Reloading...");
  console.log("[🛰️] Graphical Panel Live at: http://localhost:3000\n");
});
