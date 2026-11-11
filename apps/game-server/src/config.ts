export const config = {
  port: Number(process.env.PORT ?? 8787),
  databaseUrl: process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5433/eidolith",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-in-production",
  accessTokenTtlSeconds: 900, // API Part 6 §3.2: expiresIn 900
  refreshTokenTtlDays: 30,
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173").split(","),
};
