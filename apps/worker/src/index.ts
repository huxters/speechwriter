import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

async function processJob(job: { id: string; data: unknown }): Promise<void> {
  console.log(`Processing job ${job.id} with data:`, job.data);
  // Job processing logic here
}

const worker = new Worker(
  'default',
  async (job) => {
    await processJob(job);
  },
  {
    connection,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('Worker started');
