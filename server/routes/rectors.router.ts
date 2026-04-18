import { Request, Response, Router } from 'express';
import { pool } from './../db';

export const rectorsRouter = Router();

// GET ALL
rectorsRouter.get('/', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM rectors ORDER BY position ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// GET ONE (для RectorDetails)
rectorsRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM rectors WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST (Создание с учетом позиции)
rectorsRouter.post('/', async (req: Request, res: Response) => {
    const { name, years, description, full_text, img, images, files, position } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const countRes = await client.query('SELECT COUNT(*) FROM rectors');
        const count = Number(countRes.rows[0].count);
        let insertPos = position ? Math.max(1, Math.min(Number(position), count + 1)) : count + 1;

        await client.query('UPDATE rectors SET position = position + 1 WHERE position >= $1', [insertPos]);
        const result = await client.query(
            `INSERT INTO rectors (name, years, description, full_text, img, images, files, position) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, years, description, full_text, img, images || [], JSON.stringify(files || []), insertPos]
        );
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err });
    } finally { client.release(); }
});