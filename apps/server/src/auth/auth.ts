import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { prisma } from '../db/prisma.js';
import { env } from '../env.js';

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: env.CORS_ORIGIN,
	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
		minPasswordLength: 12,
	},
	advanced: {
		useSecureCookies: env.NODE_ENV === 'production',
		defaultCookieAttributes: {
			httpOnly: true,
			sameSite: 'lax',
			secure: env.NODE_ENV === 'production',
		},
	},
});

export type Session = typeof auth.$Infer.Session;
