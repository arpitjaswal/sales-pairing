import Queue, { Job, JobOptions, Queue as BullQueue, ProcessCallbackFunction } from 'bull';
import { createClient } from 'redis';
import { logger } from '../logger';
import { config } from '../../config';

type JobData = Record<string, any>;

export class QueueService {
  private static instance: QueueService;
  private queues: Map<string, BullQueue> = new Map();
  private redisClient: ReturnType<typeof createClient>;
  private isInitialized = false;

  private constructor() {
    this.redisClient = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('Too many reconnection attempts on Redis. Killing the process.');
            return new Error('Too many reconnection attempts on Redis');
          }
          // Reconnect after 2 seconds, then 4, 8, 16, 32 seconds
          return Math.min(retries * 2000, 32000);
        },
      },
    });
  }

  /**
   * Get the singleton instance of QueueService
   */
  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  /**
   * Initialize the queue service and Redis connection
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.redisClient.connect();
      this.isInitialized = true;
      logger.info('Queue service initialized with Redis connection');
    } catch (error) {
      logger.error('Failed to initialize queue service:', error);
      throw new Error('Failed to initialize queue service');
    }
  }

  /**
   * Create a new queue or return an existing one
   */
  public createQueue(name: string): BullQueue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, {
      redis: config.redis.url,
      defaultJobOptions: {
        removeOnComplete: 1000, // Keep only the last 1000 completed jobs
        removeOnFail: 5000, // Keep only the last 5000 failed jobs
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Initial delay of 5s, then 10s, 20s, etc.
        },
      },
    });

    // Log queue events
    queue.on('error', (error) => {
      logger.error(`Queue ${name} error:`, error);
    });

    queue.on('waiting', (jobId) => {
      logger.debug(`Job ${jobId} is waiting in queue ${name}`);
    });

    queue.on('active', (job) => {
      logger.debug(`Job ${job.id} in queue ${name} is now active`);
    });

    queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} in queue ${name} completed`, {
        queue: name,
        jobId: job.id,
        result,
      });
    });

    queue.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} in queue ${name} failed:`, error, {
        queue: name,
        jobId: job?.id,
        error: error.message,
        stack: error.stack,
      });
    });

    this.queues.set(name, queue);
    return queue;
  }

  /**
   * Add a job to a queue
   */
  public async addJob<T = JobData>(
    queueName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const queue = this.createQueue(queueName);
    return queue.add(data, options);
  }

  /**
   * Process jobs in a queue
   */
  public processQueue<T = JobData>(
    queueName: string,
    concurrency: number,
    callback: ProcessCallbackFunction<T>
  ): void {
    if (!this.isInitialized) {
      throw new Error('Queue service not initialized');
    }

    const queue = this.createQueue(queueName);
    queue.process(concurrency, callback);
  }

  /**
   * Get a job by ID
   */
  public async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return queue.getJob(jobId);
  }

  /**
   * Get all jobs in a queue
   */
  public async getJobs(
    queueName: string,
    types: ('waiting' | 'active' | 'completed' | 'failed' | 'delayed')[] = ['waiting', 'active', 'delayed'],
    start = 0,
    end = -1,
    asc = false
  ): Promise<Job[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const jobs = await Promise.all(
      types.map((type) => queue.getJobs([type], start, end, asc))
    );
    return jobs.flat();
  }

  /**
   * Get job counts by type
   */
  public async getJobCounts(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJobCounts();
  }

  /**
   * Pause a queue
   */
  public async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  /**
   * Resume a paused queue
   */
  public async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  /**
   * Clean completed/failed jobs from a queue
   */
  public async cleanQueue(
    queueName: string,
    gracePeriodMs: number = 1000 * 60 * 60 * 24, // 24 hours
    limit: number = 1000
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    // Clean completed jobs
    await queue.clean(gracePeriodMs, limit, 'completed');
    
    // Clean failed jobs (keep more history)
    await queue.clean(gracePeriodMs * 7, limit * 5, 'failed');
    
    logger.info(`Cleaned old jobs from queue ${queueName}`);
  }

  /**
   * Close all queues and Redis connection
   */
  public async close(): Promise<void> {
    // Close all queues
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close())
    );
    
    // Close Redis connection
    await this.redisClient.quit();
    
    this.queues.clear();
    this.isInitialized = false;
    logger.info('Queue service closed');
  }

  /**
   * Get the Redis client instance
   */
  public getRedisClient(): ReturnType<typeof createClient> {
    return this.redisClient;
  }
}

// Export a singleton instance
export const queueService = QueueService.getInstance();

// Common job types and interfaces
export enum JobType {
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  REPORT = 'report',
  DATA_EXPORT = 'data-export',
  DATA_IMPORT = 'data-import',
  MAINTENANCE = 'maintenance',
  CLEANUP = 'cleanup',
  SCHEDULED = 'scheduled',
}

// Example job processors that can be imported and used in other modules
export const jobProcessors = {
  [JobType.EMAIL]: async (job: Job) => {
    // Process email job
    logger.info(`Processing email job: ${job.id}`, job.data);
    // Add your email sending logic here
  },
  
  [JobType.NOTIFICATION]: async (job: Job) => {
    // Process notification job
    logger.info(`Processing notification job: ${job.id}`, job.data);
    // Add your notification logic here
  },
  
  [JobType.REPORT]: async (job: Job) => {
    // Process report generation job
    logger.info(`Processing report job: ${job.id}`, job.data);
    // Add your report generation logic here
  },
  
  [JobType.DATA_EXPORT]: async (job: Job) => {
    // Process data export job
    logger.info(`Processing data export job: ${job.id}`, job.data);
    // Add your data export logic here
  },
  
  [JobType.DATA_IMPORT]: async (job: Job) => {
    // Process data import job
    logger.info(`Processing data import job: ${job.id}`, job.data);
    // Add your data import logic here
  },
  
  [JobType.MAINTENANCE]: async (job: Job) => {
    // Process maintenance job
    logger.info(`Processing maintenance job: ${job.id}`, job.data);
    // Add your maintenance logic here
  },
  
  [JobType.CLEANUP]: async (job: Job) => {
    // Process cleanup job
    logger.info(`Processing cleanup job: ${job.id}`, job.data);
    // Add your cleanup logic here
  },
  
  [JobType.SCHEDULED]: async (job: Job) => {
    // Process scheduled job
    logger.info(`Processing scheduled job: ${job.id}`, job.data);
    // Add your scheduled task logic here
  },
};

export default queueService;
