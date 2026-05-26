import envVar from 'env-var';

export const { get } = envVar;

const dbHost = get('DB_HOST').required().asString();
const dbPort = get('DB_PORT').required().asPortNumber();
const dbUser = get('DB_USER').required().asString();
const dbPassword = get('DB_PASSWORD').required().asString();
const dbName = get('DB_NAME').required().asString();

const defaultDatabaseUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

export const env = {
	NODE_ENV: get('NODE_ENV').default('development').asEnum(['development', 'production', 'test']),

	HOST: get('HOST').default('localhost').asString(),
	PORT: get('PORT').default('3000').asPortNumber(),
	CORS_ORIGIN: get('CORS_ORIGIN')
		.default('http://localhost:5173,http://localhost:5174,http://localhost:5175')
		.asString()
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean),

	DB_HOST: dbHost,
	DB_PORT: dbPort,
	DB_USER: dbUser,
	DB_PASSWORD: dbPassword,
	DB_NAME: dbName,
	DATABASE_URL: get('DATABASE_URL').default(defaultDatabaseUrl).asString(),

	LOG_LEVEL: get('LOG_LEVEL').default('info').asString(),
	LOG_PRETTY: get('LOG_PRETTY').default('false').asBool(),
};
