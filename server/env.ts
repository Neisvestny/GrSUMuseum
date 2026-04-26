import envVar from 'env-var';

export const { get } = envVar;

export const env = {
	NODE_ENV: get('NODE_ENV').default('development').asEnum(['development', 'production', 'test']),

	HOST: get('HOST').default('localhost').asString(),
	PORT: get('PORT').default('3000').asPortNumber(),
	CORS_ORIGIN: get('CORS_ORIGIN')
		.default('http://localhost:5173')
		.asString()
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean),

	// DB
	DB_HOST: get('DB_HOST').required().asString(),
	DB_PORT: get('DB_PORT').required().asPortNumber(),
	DB_USER: get('DB_USER').required().asString(),
	DB_PASSWORD: get('DB_PASSWORD').required().asString(),
	DB_NAME: get('DB_NAME').required().asString(),

	// LOGS
	LOG_LEVEL: get('LOG_LEVEL').default('info').asString(),
	LOG_PRETTY: get('LOG_PRETTY').default('false').asBool(),
};
