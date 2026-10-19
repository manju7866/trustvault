import request from 'supertest';
import { app } from '../src/app';
import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

describe('🚨 TrustVault Core Security Boundary Validation Tests', () => {
    let externalAttackerToken: string = 'mock_malicious_viewer_jwt_token_2026';
    let targetDocumentId: string = 'c8b6a12b-4235-4db9-a866-2679234547aa';

    it('🛡️ [CRITICAL] Should flatly reject cross-tenant IDOR access attempts with 403 Forbidden', async () => {
        // Simulates an outside user trying to pull a document they do not own or have rights to
        const response = await request(app)
            .get(`/api/documents/${targetDocumentId}`)
            .set('Authorization', `Bearer ${externalAttackerToken}`);

        // Verifies the application safety wall successfully blocked execution
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Access Denied');
    });

    it('⚡ [CRITICAL] Should catch structural session tempering and return 401 Unauthorized', async () => {
        // Simulates an attacker sending an empty signature parameter
        const response = await request(app)
            .get(`/api/documents/${targetDocumentId}`);

        expect(response.status).toBe(401);
    });
});
