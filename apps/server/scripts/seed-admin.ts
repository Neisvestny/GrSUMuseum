import { config } from 'dotenv';
import { hashPassword } from 'better-auth/crypto';
import envVar from 'env-var';
import { envFilePath } from '../src/lib/paths.js';

config({ path: envFilePath });

const { get } = envVar;

const email = get('ADMIN_EMAIL').required().asString();
const password = get('ADMIN_PASSWORD').required().asString();
const name = get('ADMIN_NAME').default('Администратор').asString();

async function main(): Promise<void> {
	const { prisma } = await import('../src/db/prisma.js');

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		console.log(`Admin user already exists (${email}), skipping.`);
		return;
	}

	const userId = crypto.randomUUID();
	const hashedPassword = await hashPassword(password);

	await prisma.$transaction(async (tx) => {
		await tx.user.create({
			data: {
				id: userId,
				name,
				email,
				emailVerified: true,
			},
		});

		await tx.account.create({
			data: {
				id: crypto.randomUUID(),
				accountId: email,
				providerId: 'credential',
				userId,
				password: hashedPassword,
			},
		});
	});

	console.log(`Admin user created: ${email}`);
	await prisma.$disconnect();
}

main().catch((err: unknown) => {
	console.error('seed-admin failed:', err);
	process.exit(1);
});
