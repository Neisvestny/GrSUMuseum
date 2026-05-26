import { createAuthClient } from 'better-auth/react';

const baseURL = (import.meta.env.VITE_BETTER_AUTH_URL as string | undefined)?.trim();

export const authClient = createAuthClient(
	baseURL ? { baseURL } : {},
);

export const { signIn, signOut, useSession } = authClient;
