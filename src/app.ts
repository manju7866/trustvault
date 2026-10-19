import express from 'express';
import * as crypto from 'crypto';

const app = express();
app.use(express.json());

// Mock database storage in memory
const mockAuditLogs: any[] = [];
let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

console.log("\n[⚡] TrustVault Core Security Engine Booting up...");
console.log("[⚙️] Environment loaded: development (Isolated Mock Mode)");
console.log("[🔒] Cryptographic Ledger Service: Activated (SHA-256 Chaining Engaged)");
console.log("[📂] Isolated File Storage Service: Mounted at D:\\trustvault\\storage");
console.log("[🛰️] Server state: Securely listening on Port 3000\n");
console.log("--- 📺 LIVE TRANSCRIPT TRANSACTION FEED ---");

// Mock Endpoint to simulate a live hacker attack vs defense
app.get('/api/simulate-attack', (req, res) => {
    const timestamp = new Date().toISOString();
    const action = 'IDOR_VIOLATION_ATTEMPT';
    const docId = 'c8b6a12b-4235-4db9-a866-2679234547aa';
    const actorId = 'attacker_user_uuid_99';
    
    // Calculate cryptographic blockchain ledger signature link
    const logString = `${actorId}-${action}-${docId}-${lastHash}`;
    const currentHash = crypto.createHash('sha256').update(logString).digest('hex');
    
    console.log(`\n🚨 [${timestamp}] SECURITY ALERT: Cross-Tenant IDOR Attack Detected!`);
    console.log(`   👉 Actor ID: ${actorId} tried accessing Document ID: ${docId}`);
    console.log(`   🛡️ Result: ACCESS REFUSED (403 Forbidden Error Sent)`);
    console.log(`   🔗 Ledger Chain Updated! New Hash Block: ${currentHash.substring(0, 16)}...`);
    
    lastHash = currentHash;
    res.status(403).json({ error: "Access Denied. Your profile holds insufficient permissions." });
});

app.listen(3000);
