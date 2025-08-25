import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env.test' });

// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  })),
}));

// Mock Bull Queue
jest.mock('bull', () => {
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    getJob: jest.fn(),
    getJobs: jest.fn().mockResolvedValue([]),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    clean: jest.fn().mockResolvedValue([]),
  };
  return jest.fn(() => mockQueue);
});

// Mock Socket.IO
jest.mock('socket.io', () => {
  return jest.fn().mockImplementation(() => ({
    use: jest.fn(),
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    close: jest.fn(),
  }));
});

// Mock Winston logger
jest.mock('winston', () => {
  const format = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
    prettyPrint: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
    printf: jest.fn(),
  };

  const transports = {
    Console: jest.fn(),
    File: jest.fn(),
  };

  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
  };

  return {
    format,
    transports,
    createLogger: jest.fn(() => logger),
    addColors: jest.fn(),
  };
});
