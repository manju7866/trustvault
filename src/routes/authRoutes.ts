import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const db = new Pool({ connectionString: process.env.DATABASE_URL });

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid security credentials.' });
        }
        const user = userQuery.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid security credentials.' });
        }
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'fallback',
            { expiresIn: '5m' }
        );
        return res.json({
            message: 'Authentication successful.',
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Error.' });
    }
});

export default router;
