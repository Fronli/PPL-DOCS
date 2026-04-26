import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const prismaMock = mockDeep<PrismaClient>();

jest.unstable_mockModule('../../../src/db/primsa.js', () => ({
    default: prismaMock,
    __esModule: true,
}));

jest.unstable_mockModule('qrcode', () => ({
    default: {
        toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mocked-qr-code')
    },
    __esModule: true
}));

jest.unstable_mockModule('crypto', () => ({
    randomUUID: jest.fn().mockReturnValue('mocked-uuid'),
    __esModule: true
}));

const { createOrder, completePayment, getOrderTickets, getMyTicket } = await import('../../../src/controllers/event.controller.js');
const QRCode = (await import('qrcode')).default;

describe('Event Controller - Order & Payment', () => {
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

        // Mock $transaction to execute the callback synchronously
        prismaMock.$transaction.mockImplementation(async (callback: any) => {
            return await callback(prismaMock);
        });

        // Supress console.error during tests to avoid confusing the user
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        mockReset(prismaMock);
    });

    describe('createOrder', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockReq.user = {} as any;
            await createOrder(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        });

        it('should return 404 if ticket type not found', async () => {
            mockReq.body = { ticketTypeId: 99, quantity: 2 };
            prismaMock.ticketType.findUnique.mockResolvedValue(null);

            await createOrder(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Ticket type not found" });
        });

        it('should return 400 if quantity exceeds quota', async () => {
            mockReq.body = { ticketTypeId: 1, quantity: 5 };
            const mockTicketType = { id: 1, quota: 2, price: 100000 } as any;
            prismaMock.ticketType.findUnique.mockResolvedValue(mockTicketType);

            await createOrder(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Insufficient ticket quota" });
        });

        it('should create order successfully if valid', async () => {
            mockReq.body = { ticketTypeId: 1, quantity: 2, eventId: 1 };
            const mockTicketType = { id: 1, quota: 10, price: 100000 } as any;
            prismaMock.ticketType.findUnique.mockResolvedValue(mockTicketType);

            const mockCreatedOrder = { id: 100, userId: 1, status: 'UNPAID', total: 200000 } as any;
            prismaMock.order.create.mockResolvedValue(mockCreatedOrder);

            await createOrder(mockReq as Request, mockRes as Response);

            expect(prismaMock.order.create).toHaveBeenCalledWith({
                data: {
                    userId: 1,
                    status: 'UNPAID',
                    total: 200000
                }
            });
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Order created successfully", order: mockCreatedOrder });
        });
    });

    describe('completePayment', () => {
        beforeEach(() => {
            mockReq.body = { orderId: 100, eventId: 1, ticketTypeId: 1, quantity: 2 };
        });

        it('should return 404 if order not found', async () => {
            prismaMock.order.findUnique.mockResolvedValue(null);
            await completePayment(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Order not found" });
        });

        it('should return 400 if order belongs to another user', async () => {
            prismaMock.order.findUnique.mockResolvedValue({ id: 100, userId: 99 } as any);
            await completePayment(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Forbidden" });
        });

        it('should return 400 if order is already PAID', async () => {
            prismaMock.order.findUnique.mockResolvedValue({ id: 100, userId: 1, status: 'PAID' } as any);
            await completePayment(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "This order is already paid." });
        });

        it('should return 400 if payload total does not match ticket price', async () => {
            prismaMock.order.findUnique.mockResolvedValue({ id: 100, userId: 1, status: 'UNPAID', total: 50000 } as any);
            prismaMock.ticketType.findUnique.mockResolvedValue({ id: 1, price: 100000, quota: 10 } as any);

            await completePayment(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid payment payload" });
        });

        it('should return 400 if ticket quota is sold out during payment', async () => {
            prismaMock.order.findUnique.mockResolvedValue({ id: 100, userId: 1, status: 'UNPAID', total: 200000 } as any);
            prismaMock.ticketType.findUnique.mockResolvedValue({ id: 1, price: 100000, quota: 1 } as any);

            await completePayment(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Sorry, tickets sold out while you were paying." });
        });

        it('should complete payment, update quota, and generate tickets successfully', async () => {
            const mockOrder = { id: 100, userId: 1, status: 'UNPAID', total: 200000 } as any;
            const mockTicketType = { id: 1, price: 100000, quota: 10 } as any;
            
            prismaMock.order.findUnique.mockResolvedValue(mockOrder);
            prismaMock.ticketType.findUnique.mockResolvedValue(mockTicketType);
            
            const updatedOrder = { ...mockOrder, status: 'PAID' };
            prismaMock.order.update.mockResolvedValue(updatedOrder);

            await completePayment(mockReq as Request, mockRes as Response);

            expect(prismaMock.order.update).toHaveBeenCalledWith({
                where: { id: 100 },
                data: { status: 'PAID' }
            });
            expect(prismaMock.ticketType.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { quota: 8 }
            });
            expect(prismaMock.payment.create).toHaveBeenCalledWith({
                data: { orderId: 100, method: "SIMULATION", status: "PAID" }
            });
            expect(prismaMock.ticket.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({ orderId: 100, ticketTypeId: 1, status: 'VALID', code: 'mocked-uuid' })
                ])
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Payment completed successfully",
                order: updatedOrder,
                ticketsCount: 2
            });
        });
    });

    describe('getOrderTickets', () => {
        it('should return 404 if order not found', async () => {
            mockReq.params = { orderId: '99' };
            prismaMock.order.findUnique.mockResolvedValue(null);

            await getOrderTickets(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return order with generated QR codes successfully', async () => {
            mockReq.params = { orderId: '100' };
            const mockOrder = {
                id: 100, userId: 1, 
                tickets: [
                    { id: 1, code: 'uuid-1', event: {}, ticketType: {} }
                ]
            } as any;
            prismaMock.order.findUnique.mockResolvedValue(mockOrder);

            await getOrderTickets(mockReq as Request, mockRes as Response);

            expect(QRCode.toDataURL).toHaveBeenCalledWith('uuid-1');
            expect(mockRes.json).toHaveBeenCalledWith({
                order: expect.objectContaining({
                    tickets: expect.arrayContaining([
                        expect.objectContaining({ code: 'uuid-1', qrCode: 'data:image/png;base64,mocked-qr-code' })
                    ])
                })
            });
        });
    });
});
