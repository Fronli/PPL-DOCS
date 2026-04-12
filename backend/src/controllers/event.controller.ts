import type { Request, Response } from 'express';
import path from 'path';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import prisma from '../db/primsa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../../../');

// Create order to table "Order" with  "userId", "total"
export const createOrder = async (req: Request, res: Response) => {
    const { eventId, ticketTypeId, quantity } = req.body;
    const userId = req.user?.id;

    console.log("masuk create order");

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const ticketType = await prisma.ticketType.findUnique({ where: { id: Number(ticketTypeId) } });
        if (!ticketType) return res.status(404).json({ message: "Ticket type not found" });

        if (ticketType.quota < quantity) {
            return res.status(400).json({ message: "Insufficient ticket quota" });
        }

        const total = ticketType.price * quantity;

        // Create the order pending
        const newOrder = await prisma.order.create({
            data: {
                userId: userId,
                status: 'UNPAID',
                total: total
            }
        });

        res.json({ message: "Order created successfully", order: newOrder });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Failed to create order" });
    }
};


export const completePayment = async (req: Request, res: Response) => {
    const { orderId, eventId, ticketTypeId, quantity } = req.body;
    const userId = req.user?.id;

    console.log("masuk complete payment");

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const order = await prisma.order.findUnique({ 
            where: { id: Number(orderId) },
        });

        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.userId !== userId) return res.status(403).json({ message: "Forbidden" });



        if (order.status === 'PAID') {
            return res.status(400).json({ message: "This order is already paid." });
        }

        // Validate payload against order total
        const ticketType = await prisma.ticketType.findUnique({ where: { id: Number(ticketTypeId) } });
        if (!ticketType) return res.status(404).json({ message: "Ticket type not found" });
        
        if (ticketType.price * Number(quantity) !== order.total) {
             return res.status(400).json({ message: "Invalid payment payload" });
        }

        if (ticketType.quota < Number(quantity)) {
             return res.status(400).json({ message: "Sorry, tickets sold out while you were paying." });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { status: 'PAID' }
        });

        // Also mock a payment record
        await prisma.payment.create({
            data: {
                orderId: order.id,
                method: "SIMULATION",
                status: "PAID"
            }
        });

        // Decrement quota permanently
        await prisma.ticketType.update({
            where: { id: ticketType.id },
            data: { quota: ticketType.quota - Number(quantity) }
        });

        // Generate tickets linked to this order
        const createdTickets = [];
        for (let i = 0; i < Number(quantity); i++) {
             // We can just use timestamp and random for unique string, then generate the base64 qr
             const qrString = `QR-${order.id}-${ticketType.id}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`;
             const qrBase64 = await QRCode.toDataURL(qrString);

             const ticket = await prisma.ticket.create({
                 data: {
                     qrCode: qrBase64,
                     eventId: Number(eventId),
                     ticketTypeId: ticketType.id,
                     orderId: order.id,
                     status: 'VALID'
                 }
             });
             createdTickets.push(ticket);
        }

        res.json({ message: "Payment completed successfully", order: { ...updatedOrder, tickets: createdTickets } });
    } catch (error) {
        console.error("Error completing payment:", error);
        res.status(500).json({ message: "Failed to process payment" });
    }
};


export const getOrderTickets = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { orderId } = req.params;

    console.log("masuk get order tickets");

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(orderId) },
            include: {
                tickets: {
                    include: {
                        event: true,
                        ticketType: true
                    }
                }
            }
        });

        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.userId !== userId) return res.status(403).json({ message: "Forbidden" });

        res.json({ order });
    } catch (error) {
        console.error("Error fetching order tickets:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

//Get All Users Ticket
export const getMyTicket = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    console.log(userId);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const orders = await prisma.order.findMany({
            where: { 
                userId,
                status: 'PAID'
            },
            include: {
                tickets: {
                    include: {
                        event: true,
                        ticketType: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ orders });
    } catch (error) {
        console.error("Error fetching user tickets:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getEvents = async (req: Request, res: Response) => {
    const { cursor, category, city, search } = req.query;
    // Limit buat ngasih berapa event yang mau di fetch ke frontend
    const limit = 8;
    const where: any = {
        isPublished: true,
    };

    if (category && typeof category === 'string') {
        where.category = category;
    }

    if (city && typeof city === 'string') {
        where.city = city;
    }

    if (search && typeof search === 'string') {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { organizer: { name: { contains: search, mode: 'insensitive' } } }
        ];
    }

    try {
        const events = await prisma.event.findMany({
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: { id: Number(cursor) },
            }),
            where,
            orderBy: {
                id: 'asc',
            },
            include: {
                ticketTypes: {
                    select: { price: true },
                    orderBy: { price: 'asc' },
                    take: 1,
                },
            },
        });

        const lastEvent = events[events.length - 1];
        const nextCursor = events.length === limit && lastEvent ? lastEvent.id : null;

        res.json({
            data: events,
            nextCursor,
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
}


export const getEventById = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: 'Valid Event ID is required' });
    }

    try {
        const event = await prisma.event.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                ticketTypes: {
                    orderBy: { price: 'asc' }
                },
                organizer: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        res.status(500).json({ message: 'Failed to fetch event details' });
    }
}
