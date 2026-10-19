# TrustVault - Threat Modeling & Security Architecture

## Identified Threat Vectors & Mitigations

### 1. Insecure Direct Object References (IDOR) on Document Access
* **Threat Profile:** An authenticated attacker alters the document ID parameter in the API endpoint (`GET /api/documents/99`) to access files belonging to another user.
* **Mitigation:** The system completely ignores client-side validation logic. The database layer utilizes a strict relational check matching the user context directly to active grants.

### 2. Authorization State Stale-Out (Bypassing Immediate Revocation)
* **Threat Profile:** A user's access is revoked by the owner, but the user continues to download data using an unexpired, long-lived session token or cached state.
* **Mitigation:** The application rejects permission caching. Every document action hits the core database index live on every request, verifying structural authorization at the microsecond of execution.

### 3. Retroactive Audit Log Tampering (Log Wiping)
* **Threat Profile:** A compromised account or SQL injection exploit modifies or removes audit logs to hide a leak.
* **Mitigation:** The application operates on database-level separation of duties. The service account assigned to daily user transactions lacks structural `UPDATE` and `DELETE` privileges on the `audit_logs` table, making the ledger structurally append-only.
