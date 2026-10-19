# TrustVault 🛡️ - Enterprise Secure Audit Chaining Platform

A high-performance, Zero-Trust document access security layer built with Node.js, Express, TypeScript, and PostgreSQL. Engineered to prevent IDOR attacks and provide real-time authorization status checks with an immutable, cryptographically chained audit log ledger.

## 🚀 Key Architectural Features
* **Cryptographic Ledger Chaining:** Every access attempt (granted or denied) generates a log row containing an HMAC SHA-256 hash of the row data cryptographically linked to the hash of the previous record.
* **Zero Scope Caching:** Rejects brittle token scope parsing or session caching. Every endpoint hit evaluates structural user permission scopes natively against relational database constraints down to the microsecond of execution.
* **Automated Honeypots:** Every unauthorized access violation immediately flags the caller's system signature metadata (IP and User-Agent) and writes it into the append-only ledger before serving a strict `403 Forbidden` wall.

## 📁 System Requirements
* **Node.js** (v18.x or higher)
* **Docker Desktop** (For zero-configuration database isolation)

## 🛠️ Rapid Local Deployment
1. **Clone the Repository:**
   ```bash
   git clone https://github.com
   cd trustvault
   ```

2. **Initialize Isolated Database Environment:**
   ```bash
   docker-compose up -d
   ```

3. **Install Localized Safety Dependencies:**
   ```bash
   npm install
   ```

4. **Boot the Security Engine Workspace:**
   ```bash
   npm run dev
   ```

## 🧪 Security Test Suite Execution
To validate security boundaries against active IDOR vectors and session tempering anomalies:
```bash
npm run test
```
