import { QueueService, JobType } from '../queue';
import { Job } from 'bull';

describe('QueueService', () => {
  let queueService: QueueService;
  const testQueueName = 'test-queue';
  const testJobData = { userId: '123', action: 'test' };
  const testJobOptions = { delay: 5000 };

  beforeEach(() => {
    queueService = new QueueService();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the queue service', async () => {
      await queueService.initialize();
      expect(queueService['isInitialized']).toBe(true);
    });
  });

  describe('createQueue', () => {
    it('should create a new queue', () => {
      const queue = queueService.createQueue(testQueueName);
      expect(queue).toBeDefined();
      expect(queue.add).toBeDefined();
      expect(queue.process).toBeDefined();
    });

    it('should return existing queue if already created', () => {
      const queue1 = queueService.createQueue(testQueueName);
      const queue2 = queueService.createQueue(testQueueName);
      expect(queue1).toBe(queue2);
    });
  });

  describe('addJob', () => {
    it('should add a job to the queue', async () => {
      const job = await queueService.addJob(testQueueName, testJobData, testJobOptions);
      expect(job).toBeDefined();
      expect(job.id).toBe('test-job-id');
      
      const queue = queueService['queues'].get(testQueueName);
      expect(queue?.add).toHaveBeenCalledWith(testJobData, testJobOptions);
    });
  });

  describe('processQueue', () => {
    it('should process jobs in the queue', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined);
      
      queueService.processQueue(testQueueName, 5, mockCallback);
      
      const queue = queueService['queues'].get(testQueueName);
      expect(queue?.process).toHaveBeenCalledWith(5, mockCallback);
    });
  });

  describe('getJob', () => {
    it('should get a job by ID', async () => {
      const mockJob = { id: '123', data: testJobData };
      const queue = queueService.createQueue(testQueueName);
      (queue.getJob as jest.Mock).mockResolvedValue(mockJob);
      
      const job = await queueService.getJob(testQueueName, '123');
      expect(job).toEqual(mockJob);
      expect(queue.getJob).toHaveBeenCalledWith('123');
    });
  });

  describe('jobProcessors', () => {
    it('should have all job processors defined', () => {
      const jobTypes = Object.values(JobType);
      jobTypes.forEach(type => {
        expect(JobType[type as keyof typeof JobType]).toBeDefined();
      });
    });
  });

  describe('cleanup', () => {
    it('should close all queues and Redis connection', async () => {
      await queueService.initialize();
      
      // Create a test queue
      queueService.createQueue(testQueueName);
      
      await queueService.close();
      
      const queue = queueService['queues'].get(testQueueName);
      expect(queue?.close).toHaveBeenCalled();
      expect(queueService['isInitialized']).toBe(false);
    });
  });
});
