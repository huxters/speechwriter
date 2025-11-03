export interface AppConfig {
  env: string;
  api: {
    port: number;
    host: string;
  };
  redis: {
    host: string;
    port: number;
  };
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export function getConfig(): AppConfig {
  return {
    env: process.env.NODE_ENV || 'development',
    api: {
      port: parseInt(process.env.API_PORT || '3001', 10),
      host: process.env.API_HOST || 'localhost',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'speechwriter',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
    },
  };
}

