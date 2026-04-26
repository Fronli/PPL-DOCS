import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const prismaMock = mockDeep<PrismaClient>();

jest.unstable_mockModule('../../../src/db/primsa.js', () => ({
    default: prismaMock,
    __esModule: true,
}));

const { approveApply, rejectApply, deleteAccount, deactivateEvent } = await import('../../../src/controllers/admin.controller.js');

describe('Admin Controller - Moderation Dashboard', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockReq = {
            params: {},
            user: { id: 1 } as any // Admin User ID is 1
        } as unknown as Partial<Request>;

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Partial<Response>;

        // Supress console.error during tests to keep terminal clean
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        mockReset(prismaMock);
    });

    describe('approveApply', () => {
        it('should return 404 if application is not found', async () => {
            mockReq.params = { id: '99' };
            prismaMock.eOApplication.findUnique.mockResolvedValue(null);

            await approveApply(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Not found" });
        });

        it('should approve application and update user role to EO', async () => {
            mockReq.params = { id: '10' };
            const mockApplication = { id: 10, userId: 5 } as any;
            
            prismaMock.eOApplication.findUnique.mockResolvedValue(mockApplication);
            prismaMock.eOApplication.update.mockResolvedValue({} as any);
            prismaMock.user.update.mockResolvedValue({} as any);

            await approveApply(mockReq as Request, mockRes as Response);

            expect(prismaMock.eOApplication.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { status: 'APPROVED' }
            });
            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: 5 }, // The userId from the application
                data: { role: 'EO' }
            });
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Application approved successfully' });
        });
    });

    describe('rejectApply', () => {
        it('should reject application successfully', async () => {
            mockReq.params = { id: '10' };
            prismaMock.eOApplication.update.mockResolvedValue({} as any);

            await rejectApply(mockReq as Request, mockRes as Response);

            expect(prismaMock.eOApplication.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { status: 'REJECTED' }
            });
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Application rejected successfully' });
        });
    });

    describe('deleteAccount', () => {
        it('should return 400 if admin tries to delete their own account', async () => {
            mockReq.params = { id: '1' }; // Same as mockReq.user.id
            
            await deleteAccount(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cannot delete your own admin account.' });
            expect(prismaMock.user.delete).not.toHaveBeenCalled();
        });

        it('should delete other user accounts successfully', async () => {
            mockReq.params = { id: '5' }; // Different from mockReq.user.id (1)
            prismaMock.user.delete.mockResolvedValue({} as any);

            await deleteAccount(mockReq as Request, mockRes as Response);

            expect(prismaMock.user.delete).toHaveBeenCalledWith({
                where: { id: 5 }
            });
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Account deleted successfully' });
        });
    });

    describe('deactivateEvent', () => {
        it('should deactivate event (unpublish) successfully', async () => {
            mockReq.params = { id: '20' };
            prismaMock.event.update.mockResolvedValue({} as any);

            await deactivateEvent(mockReq as Request, mockRes as Response);

            expect(prismaMock.event.update).toHaveBeenCalledWith({
                where: { id: 20 },
                data: { isPublished: false }
            });
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Event deactivated successfully' });
        });
    });
});
