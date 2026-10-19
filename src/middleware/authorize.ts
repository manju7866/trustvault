import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import * as crypto from 'crypto';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

interface AuthenticatedRequest extends Request {
    user?: { id: string; role: string; email: string };
}

export const verifyDocumentAccess = (requiredAccess: 'read' | 'edit') => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { docId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required. Access denied.' });
        }

        try {
            if (userRole === 'administrator') {
                await logAuditEvent(userId, 'ADMIN_ACCESS', docId, { requiredAccess, status: 'SUCCESS' });
                return next();
            }

            const permissionCheck = await db.query(
                `SELECT d.owner_id, p.user_id 
                 FROM documents d
                 LEFT JOIN permissions p ON d.id = p.document_id AND p.user_id = $1 AND p.access_type = $2
                 WHERE d.id = $3`,
                [userId, requiredAccess, docId]
            );

            if (permissionCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Document not found or unavailable.' });
            }

            const doc = permissionCheck.rows[0];
            const isOwner = doc.owner_id === userId;
            const hasExplicitPermission = doc.user_id !== null;

            if (isOwner || hasExplicitPermission) {
                await logAuditEvent(userId, `${requiredAccess.toUpperCase()}_SUCCESS`, docId, { status: 'GRANTED' });
                return next();
            }

            await logAuditEvent(userId, `${requiredAccess.toUpperCase()}_VIOLATION`, docId, { 
                status: 'REFUSED',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(403).json({ error: 'Access Denied. Insufficient permissions.' });

        } catch (error) {
            console.error('Critical authorization check failure:', error);
            return res.status(500).json({ error: 'Internal Security Guard Engine Failure.' });
        }
    };
};

async function logAuditEvent(actorId: string, action: string, docId: string | null, details: object) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const lastLogQuery = await client.query('SELECT current_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
        const previousHash = lastLogQuery.rows.length > 0 ? lastLogQuery.rows[0].current_hash : '0000000000000000000000000000000000000000000000000000000000000000';

        const logDataString = `${actorId}-${action}-${docId}-${JSON.stringify(details)}-${previousHash}`;
        const currentHash = crypto.createHmac('sha256', process.env.LEDGER_SECRET || 'vault-key')
                                  .update(logDataString)
                                  .digest('hex');

        await client.query(
            `INSERT INTO audit_logs (actor_id, action, document_id, details, current_hash, previous_hash) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [actorId, action, docId, details, currentHash, previousHash]
        );
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('CRITICAL ERROR: Audit logging engine failed!', err);
    } finally {
        client.release();
    }
}
