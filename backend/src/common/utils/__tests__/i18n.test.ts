import i18n from 'i18n';
import { Request, Response, NextFunction } from 'express';
import { i18nMiddleware, t, tn } from '../i18n';

// Mock i18n
jest.mock('i18n', () => ({
  configure: jest.fn(),
  setLocale: jest.fn(),
  getLocale: jest.fn().mockReturnValue('en'),
  __: jest.fn().mockImplementation((key) => `translated:${key}`),
  __n: jest.fn().mockImplementation((key, count) => `translated:${key}:${count}`),
}));

describe('i18n Utility', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      query: {},
      headers: {},
    };
    res = {};
    next = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('i18nMiddleware', () => {
    it('should set default language if no language specified', () => {
      i18nMiddleware(req as Request, res as Response, next);
      
      expect(i18n.setLocale).toHaveBeenCalledWith('en');
      expect(next).toHaveBeenCalled();
    });

    it('should set language from query parameter', () => {
      req.query = { lang: 'es' };
      
      i18nMiddleware(req as Request, res as Response, next);
      
      expect(i18n.setLocale).toHaveBeenCalledWith('es');
    });

    it('should set language from accept-language header', () => {
      req.headers = { 'accept-language': 'fr,en;q=0.9' };
      
      i18nMiddleware(req as Request, res as Response, next);
      
      expect(i18n.setLocale).toHaveBeenCalledWith('fr');
    });

    it('should add t and tn functions to request and response', () => {
      i18nMiddleware(req as Request, res as Response, next);
      
      expect(req.t).toBeDefined();
      expect(req.tn).toBeDefined();
      expect(res.t).toBeDefined();
      expect(res.tn).toBeDefined();
      
      // Test the added functions
      expect(req.t!('test.key')).toBe('translated:test.key');
      expect(req.tn!('test.key', 5)).toBe('translated:test.key:5');
    });
  });

  describe('t function', () => {
    it('should translate a key', () => {
      const result = t('welcome');
      expect(result).toBe('translated:welcome');
    });

    it('should handle replacements', () => {
      (i18n.__ as jest.Mock).mockImplementationOnce((key, replacements) => 
        `Hello ${replacements.name}`
      );
      
      const result = t('greeting', { name: 'John' });
      expect(result).toBe('Hello John');
    });
  });

  describe('tn function', () => {
    it('should handle pluralization', () => {
      const result = tn('message', 5);
      expect(result).toBe('translated:message:5');
    });

    it('should handle replacements with pluralization', () => {
      (i18n.__n as jest.Mock).mockImplementationOnce((key, count, replacements) => 
        `You have ${count} ${replacements.item}${count !== 1 ? 's' : ''}`
      );
      
      const result = tn('item.count', 5, { item: 'message' });
      expect(result).toBe('You have 5 messages');
    });
  });
});
