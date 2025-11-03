import Fastify from 'fastify';
import cors from '@fastify/cors';
import env from '@fastify/env';

const fastify = Fastify({
  logger: true,
});

interface EnvSchema {
  PORT: number;
  NODE_ENV: string;
}

const envSchema = {
  type: 'object',
  required: ['PORT', 'NODE_ENV'],
  properties: {
    PORT: {
      type: 'number',
      default: 3001,
    },
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
  },
};

async function build(): Promise<void> {
  await fastify.register(env, {
    schema: envSchema,
    dotenv: true,
  });

  await fastify.register(cors, {
    origin: true,
  });

  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  fastify.get('/', async () => {
    return { message: 'SpeechWriter API' };
  });
}

async function start(): Promise<void> {
  try {
    await build();
    const port = (fastify.config as EnvSchema).PORT;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

