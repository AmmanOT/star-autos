export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv = String(config.NODE_ENV || 'development');
  const jwtSecret = String(config.JWT_SECRET || '');

  if (nodeEnv === 'production' && (!jwtSecret || jwtSecret.includes('change-me'))) {
    throw new Error('JWT_SECRET must be set to a strong value in production');
  }

  const port = Number(config.PORT || 3000);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  const dbPort = Number(config.DATABASE_PORT || 5432);
  if (Number.isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error('DATABASE_PORT must be a valid number between 1 and 65535');
  }

  return config;
}
