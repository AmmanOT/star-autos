export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || undefined,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'starautos',
    password: process.env.DATABASE_PASSWORD || 'starautos',
    name: process.env.DATABASE_NAME || 'star_autos',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production-use-long-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  seedOnStart: process.env.SEED_ON_START === 'true',
  seedReset: process.env.SEED_RESET === 'true',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  typeormSync: process.env.TYPEORM_SYNC === 'true',
});
