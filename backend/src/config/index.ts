import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}.local`),
});

// Ensure required environment variables are set
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'REDIS_HOST',
  'REDIS_PORT',
  'FRONTEND_URL',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Application configuration
export const config = {
  // Node environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  
  // Server configuration
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', // 15 minutes
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // 7 days
    issuer: process.env.JWT_ISSUER || 'roleplay-platform',
    audience: process.env.JWT_AUDIENCE || 'roleplay-platform-users',
  },
  
  // Database configuration
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: process.env.DB_SSL === 'true',
    logging: process.env.DB_LOGGING === 'true',
    synchronize: process.env.DB_SYNC === 'true',
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL || '86400', 10), // 1 day in seconds
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
  },
  
  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'smtp',
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'no-reply@roleplay-platform.com',
    templatesDir: path.join(__dirname, '../emails/templates'),
  },
  
  // OAuth configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackUrl: process.env.MICROSOFT_CALLBACK_URL,
      tenant: process.env.MICROSOFT_TENANT || 'common',
    },
  },
  
  // File upload configuration
  uploads: {
    maxFileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '5242880', 10), // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    storagePath: process.env.UPLOAD_STORAGE_PATH || 'uploads',
    tempPath: process.env.UPLOAD_TEMP_PATH || 'temp',
  },
  
  // WebSocket configuration
  websocket: {
    path: process.env.WS_PATH || '/socket.io',
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000', 10), // 5 seconds
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000', 10), // 25 seconds
    maxHttpBufferSize: parseInt(process.env.WS_MAX_BUFFER_SIZE || '1e8', 10), // 100MB
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    name: 'roleplay.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax' as const,
    },
  },
  
  // Feature flags
  features: {
    enableVideoCalls: process.env.FEATURE_VIDEO_CALLS === 'true',
    enableEmailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
    enableGoogleAuth: process.env.FEATURE_GOOGLE_AUTH === 'true',
    enableMicrosoftAuth: process.env.FEATURE_MICROSOFT_AUTH === 'true',
    enableRateLimiting: process.env.FEATURE_RATE_LIMITING !== 'false',
  },
  
  // External services
  services: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      s3: {
        bucketName: process.env.AWS_S3_BUCKET_NAME || 'roleplay-platform-uploads',
        publicUrl: process.env.AWS_S3_PUBLIC_URL,
      },
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
    },
  },
};

export type Config = typeof config;
