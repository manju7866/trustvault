const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let currentHash = '0000000000000000000000000000000000000000000000000000000000000000';
let activeUserSession = null;

const usersDb = {
  'admin@trustvault.com': { password: 'password123', name: '👑 Management Administrator', role: 'ADMIN' },
  'viewer@trustvault.com': { password: 'password123', name: '👤 External Auditor Guest', role: 'VIEWER' }
};

const documents = [
  { id: 'doc-101', name: 'Q4_Salary_Letters.pdf', category: 'HR Payroll', owner: 'owner@trustvault.com', accessGrants: ['viewer@trustvault.com'] },
  { id: 'doc-202', name: 'Corporate_Merger_Contract.docx', category: 'Legal Frameworks', owner: 'owner@trustvault.com', accessGrants: [] }
];
const auditLedger = [];

function logToLedger(actor, action, target, result) {
  const timestamp = new Date().toLocaleTimeString();
  const logString = `${actor}-${action}-${target}-${currentHash}`;
  currentHash = crypto.createHash('sha256').update(logString).digest('hex');
  auditLedger.unshift({ timestamp, actor, action, target, result, chainBlock: currentHash.substring(0, 8).toUpperCase() });
}

// 🏢 FORCE RENDER THE AUTHENTICATION PORTAL FIRST
app.get('/', (req, res) => {
  activeUserSession = null; // Forces session reset on landing page
  res.send(`
    <html>
    <head>
      <title>TrustVault - Secure Authentication Portal</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 40px; border-radius: 16px; border: 1px solid #334155; width: 100%; max-width: 420px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        .title { color: #38bdf8; font-size: 32px; font-weight: 800; margin: 0; text-align: center; }
        .subtitle { color: #94a3b8; font-size: 14px; text-align: center; margin: 5px 0 30px 0; }
        .input-group { margin-bottom: 20px; }
        label { display: block; font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; letter-spacing: 0.5px; }
        input { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: white; font-size: 14px; box-sizing: border-box; }
        .btn { background: #0284c7; color: white; border: none; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; width: 100%; margin-top: 10px; }
        .demo-box { margin-top: 30px; padding: 15px; background: #0f172a; border-radius: 8px; border: 1px solid #334155; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="title">🛡️ TrustVault</div>
        <div class="subtitle">Secure Multi-Role Access Control Portal</div>
        
        <form action="/api/login" method="POST">
          <div class="input-group">
            <label>ENTERPRISE USER EMAIL</label>
            <input type="email" name="email" required placeholder="Type admin@trustvault.com or viewer@trustvault.com">
          </div>
          <div class="input-group">
            <label>DECRYPTION PASSWORD</label>
            <input type="password" name="password" required value="password123">
          </div>
          <button type="submit" class="btn">SECURE LOG IN</button>
        </form>

        <div class="demo-box">
          <div style="color: #38bdf8; font-weight: bold; margin-bottom: 8px;">💡 ROLES TESTING MATRIX (Password: password123):</div>
          <div>👤 Viewer Role: <strong>viewer@trustvault.com</strong></div>
          <div style="margin-top:4px;">👑 Admin Role: <strong>admin@trustvault.com</strong></div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const matchedUser = usersDb[email];
  if (matchedUser && matchedUser.password === password) {
    activeUserSession = { email, ...matchedUser };
    logToLedger(email, 'LOGIN', 'Opened Active Dashboard Session', 'ALLOWED');
    res.redirect('/dashboard');
  } else {
    res.send('<body style="background:#0f172a;color:white;padding:50px;text-align:center;"><h2>❌ Access Denied</h2><a href="/" style="color:#38bdf8">Try Again</a></body>');
  }
});

app.get('/dashboard', (req, res) => {
  if (!activeUserSession) return res.redirect('/');
  const { name, role, email } = activeUserSession;
  
  let docHtml = '';
  for (let i = 0; i < documents.length; i++) {
    let d = documents[i];
    let grants = d.accessGrants.length ? d.accessGrants.join(', ') : 'Strict Isolation Mode';
    docHtml += `
      <div style="background: #0f172a; border: 1px solid #334155; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 6px 0; color: #f1f5f9;">📄 ${d.name}</h3>
        <p style="margin: 0 0 15px 0; font-size: 13px; color: #94a3b8;"><strong>Grants:</strong> ${grants}</p>
        <a href="/api/view?doc=${d.id}" style="background: #0284c7; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block;">👁️ Request Access Check</a>
      </div>
    `;
  }

  let ledgerHtml = '';
  if (role !== 'ADMIN') {
    ledgerHtml = '<div style="color:#64748b; padding:20px; font-style:italic;">🔒 Access Denied: Real-time logs ledger restricted to Platform Administrators.</div>';
  } else {
    for (let i = 0; i < auditLedger.length; i++) {
      let l = auditLedger[i];
      ledgerHtml += `
        <div style="background:#1e293b; padding:10px; border-radius:8px; margin-bottom:10px; font-size:12px; border:1px solid #334155;">
          <span style="color:#10b981;">[${l.result}]</span> <strong>${l.actor}</strong> triggered ${l.action}<br/>
          <span style="color:#64748b; font-size:10px;">⛓️ Crypto Chain ID: #${l.chainBlock}</span>
        </div>
      `;
    }
  }

  res.send(`
    <html>
    <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0;">
      <div style="max-width: 1100px; margin: 0 auto; background: #1e293b; padding: 25px; border-radius: 16px; border:1px solid #334155;">
        <div style="display:flex; justify-content:space-between; margin-bottom:30px; border-bottom:1px solid #334155; padding-bottom:20px;">
          <div><h2>🛡️ Control Panel</h2><p>Logged in: <strong>${name}</strong> (${email})</p></div>
          <div><a href="/" style="background:#f43f5e; color:white; text-decoration:none; padding:8px 16px; border-radius:6px; font-size:12px; font-weight:bold;">🚪 LOG OUT</a></div>
        </div>
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px;">
          <div><h3>📂 System Documents</h3>${docHtml}</div>
          <div><h3>⛓️ Admin Security Audit Ledger</h3>${ledgerHtml}</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/view', (req, res) => {
  if (!activeUserSession) return res.redirect('/');
  const { email, role } = activeUserSession;
  const { doc } = req.query;
  const targetDoc = documents.find(d => d.id === doc);

  const isOwner = targetDoc.owner === email;
  const hasAccess = targetDoc.accessGrants.includes(email);
  const isAdmin = role === 'ADMIN';

  if (isOwner || hasAccess || isAdmin) {
    logToLedger(email, 'DOWNLOAD', targetDoc.name, 'GRANTED');
    res.send(`<body style="background:#0f172a;color:white;font-family:sans-serif;text-align:center;padding:50px;"><h1 style="color:#10b981">🔓 Access Approved</h1><p>File Payload Streamed: ${targetDoc.name}</p><a href="/dashboard" style="color:#38bdf8">Return to Panel</a></body>`);
  } else {
    logToLedger(email, 'IDOR_BREACH_ATTEMPT', targetDoc.name, 'BLOCKED');
    res.send(`<body style="background:#0f172a;color:white;font-family:sans-serif;text-align:center;padding:50px;"><h1 style="color:#f43f5e">🚫 403 Access Denied</h1><p>Firewall Blocked unauthorized IDOR request by user ${email}</p><a href="/dashboard" style="color:#38bdf8">Return to Panel</a></body>`);
  }
});

app.listen(4000, () => {
  console.log("\n[⚡] Fresh Isolated Testing Server Booted Successfully!");
  console.log("[🛰️] Launch Interface Workspace at: http://localhost:4000\n");
});
