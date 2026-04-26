import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { requireAdmin, requireEO } from '../../../src/middleware/role.middleware.js';
import type { AuthRequest } from '../../../src/middleware/auth.middleware.js';
import type { Response, NextFunction } from 'express';

describe('Role Middleware', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    describe('requireAdmin', () => {
        it('should return 401 if user is not set in request', () => {
            requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "unauthorized" });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 if user role is not ADMIN', () => {
            mockReq.user = { id: 1, role: 'USER' };

            requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "admin only" });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call next if user role is ADMIN', () => {
            mockReq.user = { id: 1, role: 'ADMIN' };

            requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('requireEO', () => {
        it('should return 401 if user is not set in request', () => {
            requireEO(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "unauthorized" });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 if user role is not EO', () => {
            mockReq.user = { id: 1, role: 'USER' };

            requireEO(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "eo only" });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call next if user role is EO', () => {
            mockReq.user = { id: 1, role: 'EO' };

            requireEO(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });
});
