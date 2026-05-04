import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '../env';
import { PrismaClient } from '../generated/prisma/client.js';

export const pool = new Pool({
	host: env.DB_HOST,
	port: env.DB_PORT,
	database: env.DB_NAME,
	user: env.DB_USER,
	password: env.DB_PASSWORD,
});

pool.on('error', (err) => {
	console.error('PostgreSQL pool error:', err);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
