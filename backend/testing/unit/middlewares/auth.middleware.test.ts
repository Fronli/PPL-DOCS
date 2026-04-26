import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { AuthRequest } from '../../../src/middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';

// Buat generate mocking jwt (jadinya gk beneran token kaya biasa gitu)
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
      verify: jest.fn(),
      sign: jest.fn()
  },
  __esModule: true
}));

const jwt = (await import('jsonwebtoken')).default;
const { verifyToken } = await import('../../../src/middleware/auth.middleware.js');

describe('Auth Middleware - verifyToken', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if authorization header is missing', () => {
        verifyToken(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "unauthorized" });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with bearer', () => {
        mockReq.headers = { authorization: 'Basic sometoken' };

        verifyToken(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "unauthorized" });
    });

    it('should return 401 if token is empty after removing bearer', () => {
        mockReq.headers = { authorization: 'Bearer ' };

        verifyToken(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "unauthorized" });
    });

    it('should return 500 if JWT_SECRET is not set', () => {
        delete process.env.JWT_SECRET;
        mockReq.headers = { authorization: 'Bearer validtoken' };

        verifyToken(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "server misconfiguration" });
    });

    it('should call next and set req.user if token is valid', () => {
        mockReq.headers = { authorization: 'Bearer validtoken' };
        const decodedPayload = { id: 1, role: 'USER' };
        (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

        verifyToken(mockReq as Request, mockRes as Response, mockNext);

        expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test-secret');
        expect(mockReq.user).toEqual(decodedPayload);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if token is invalid or expired', () => {
        mockReq.headers = { authorization: 'Bearer invalidtoken' };
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('jwt expired');
        });

        verifyToken(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "invalid token" });
    });
});
