import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const prismaMock = mockDeep<PrismaClient>();

jest.unstable_mockModule('../../../src/db/primsa.js', () => ({
    default: prismaMock,
    __esModule: true,
}));

const { getTicketByQR, checkinTicket, submitEOApplication } = await import('../../../src/controllers/eo.controller.js');

describe('EO Controller - Event Organizer & Ticket Validation', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { id: 1 } as any
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

    describe('getTicketByQR', () => {
        it('should return 404 if ticket is not found', async () => {
            mockReq.params = { qrcode: 'invalid-code' };
            prismaMock.ticket.findUnique.mockResolvedValue(null);

            await getTicketByQR(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Ticket not found' });
        });

        it('should return 403 if ticket belongs to a different organizer', async () => {
            mockReq.params = { qrcode: 'valid-code' };
            mockReq.user = { id: 1 } as any; // Current organizer is 1
            
            const mockTicket = {
                code: 'valid-code',
                event: { organizerId: 99 } // Belongs to organizer 99
            } as any;
            prismaMock.ticket.findUnique.mockResolvedValue(mockTicket);

            await getTicketByQR(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized. This ticket belongs to a different organizer.' });
        });

        it('should return 200 with ticket info if valid and belongs to the organizer', async () => {
            mockReq.params = { qrcode: 'valid-code' };
            mockReq.user = { id: 1 } as any;
            
            const mockTicket = {
                code: 'valid-code',
                status: 'VALID',
                event: { organizerId: 1 },
                ticketType: { name: 'VIP' },
                order: { user: { name: 'Fronli', email: 'fronli@test.com' } }
            } as any;
            prismaMock.ticket.findUnique.mockResolvedValue(mockTicket);

            await getTicketByQR(mockReq as Request, mockRes as Response);

            expect(mockRes.json).toHaveBeenCalledWith({
                code: 'valid-code',
                status: 'VALID',
                attendeeName: 'Fronli',
                typeName: 'VIP'
            });
        });
    });

    describe('checkinTicket', () => {
        it('should return 404 if ticket is not found', async () => {
            mockReq.params = { qrcode: 'invalid-code' };
            prismaMock.ticket.findUnique.mockResolvedValue(null);

            await checkinTicket(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Ticket not found' });
        });

        it('should return 403 if ticket belongs to a different organizer', async () => {
            mockReq.params = { qrcode: 'valid-code' };
            prismaMock.ticket.findUnique.mockResolvedValue({ event: { organizerId: 99 } } as any);

            await checkinTicket(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });

        it('should return 400 if ticket status is not VALID (e.g., USED or CANCELLED)', async () => {
            mockReq.params = { qrcode: 'valid-code' };
            prismaMock.ticket.findUnique.mockResolvedValue({
                status: 'USED',
                event: { organizerId: 1 }
            } as any);

            await checkinTicket(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cannot check in ticket. Current status is USED' });
        });

        it('should return 200 and update ticket status to USED if valid', async () => {
            mockReq.params = { qrcode: 'valid-code' };
            const mockTicket = { id: 10, status: 'VALID', event: { organizerId: 1 } } as any;
            prismaMock.ticket.findUnique.mockResolvedValue(mockTicket);
            
            const updatedTicket = { id: 10, status: 'USED' } as any;
            prismaMock.ticket.update.mockResolvedValue(updatedTicket);

            await checkinTicket(mockReq as Request, mockRes as Response);

            expect(prismaMock.ticket.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { status: 'USED' }
            });
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Ticket checked in successfully',
                ticket: updatedTicket
            });
        });
    });

    describe('submitEOApplication', () => {
        beforeEach(() => {
            mockReq.body = {
                organizationName: 'Fronli EO',
                description: 'We organize great events',
                contactInfo: '08123456789'
            };
        });

        it('should return 400 if required fields are missing', async () => {
            mockReq.body = { description: 'Only description' }; // Missing name & contact
            await submitEOApplication(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if user already has a PENDING application', async () => {
            prismaMock.eOApplication.findUnique.mockResolvedValue({ status: 'PENDING' } as any);
            await submitEOApplication(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'You already have a pending application.' });
        });

        it('should return 400 if user is already an APPROVED organizer', async () => {
            prismaMock.eOApplication.findUnique.mockResolvedValue({ status: 'APPROVED' } as any);
            await submitEOApplication(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'You are already an approved Event Organizer.' });
        });

        it('should update existing application if it was previously REJECTED', async () => {
            prismaMock.eOApplication.findUnique.mockResolvedValue({ status: 'REJECTED' } as any);
            
            const updatedApp = { status: 'PENDING' } as any;
            prismaMock.eOApplication.update.mockResolvedValue(updatedApp);

            await submitEOApplication(mockReq as Request, mockRes as Response);

            expect(prismaMock.eOApplication.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: expect.objectContaining({
                    organizationName: 'Fronli EO',
                    status: 'PENDING'
                })
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Application re-submitted successfully', application: updatedApp });
        });

        it('should create new application if no existing application found', async () => {
            prismaMock.eOApplication.findUnique.mockResolvedValue(null);
            
            const newApp = { id: 5, status: 'PENDING' } as any;
            prismaMock.eOApplication.create.mockResolvedValue(newApp);

            await submitEOApplication(mockReq as Request, mockRes as Response);

            expect(prismaMock.eOApplication.create).toHaveBeenCalledWith({
                data: {
                    userId: 1,
                    organizationName: 'Fronli EO',
                    description: 'We organize great events',
                    contactInfo: '08123456789'
                }
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Application submitted successfully', application: newApp });
        });
    });
});
