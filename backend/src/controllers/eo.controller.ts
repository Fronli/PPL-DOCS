import type { Request, Response } from 'express';
import prisma from '../db/primsa.js';

export const getEOEvent = async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            where: {
                organizerId: (req as any).user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                ticketTypes: {
                    orderBy: { price: 'asc' },
                    take: 1
                }
            }
        });
        res.json(events);
    } catch (error) {
        console.error('Error fetching EO events:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, description, category, eventDate, location, totalSeats } = req.body;

        let posterUrl = null;
        if (req.file) {
            // Path yang bisa diakses via static route backend
            posterUrl = `/uploads/${req.file.filename}`;
        }

        if (!title || !description || !eventDate || !location) {
            return res.status(400).json({ message: 'Mohon isi semua field wajib (Title, Description, Date, Location).' });
        }

        // Pecah location menjadi venue dan city
        let venue = location;
        let city = "Unknown";
        if (location.includes(',')) {
            const parts = location.split(',');
            venue = parts[0].trim();
            city = parts[1].trim();
        } else {
            // Jika tidak ada koma, asumsikan itu city atau venue
            city = location;
        }

        const parsedDate = new Date(eventDate);
        const parsedSeats = parseInt(totalSeats) || 0;
        
        let ticketTypes = [];
        try {
            if (req.body.tickets) {
                ticketTypes = JSON.parse(req.body.tickets);
            }
        } catch (e) {
            console.error("Failed to parse tickets JSON payload:", e);
        }

        let parsedTicketTypes = [];
        if (ticketTypes) {
            try {
                parsedTicketTypes = JSON.parse(ticketTypes);
            } catch (e) {
                console.error("Gagal parse ticketTypes JSON", e);
            }
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                category: category || 'General',
                city,
                venue,
                eventDate: parsedDate,
                posterUrl,
                totalSeats: parsedSeats,
                isPublished: true, // asumsikan langsung publish
                organizerId: (req as any).user.id,
                ticketTypes: {
                    create: ticketTypes.map((t: any) => ({
                        name: t.name,
                        price: Number(t.price),
                        quota: Number(t.quota)
                    }))
                }
            }
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

export const getManageEventData = async (req: Request, res: Response) => {
    try {
        let { id } = req.params;
        const organizerId = (req as any).user.id;
        
        let numericId = Number(id);
        if (isNaN(numericId) && typeof id === 'string' && id.startsWith(':')) {
             numericId = Number(id.slice(1));
        }

        if (!numericId || isNaN(numericId)) {
            return res.status(400).json({ message: 'Invalid Event ID' });
        }

        // Fetch event with ticket quota and tickets to compute sales
        const event = await prisma.event.findFirst({
            where: {
                id: numericId,
                organizerId: organizerId
            },
            include: {
                ticketTypes: {
                    include: {
                        tickets: true
                    }
                },
                tickets: {
                    include: {
                        order: {
                            include: {
                                user: true
                            }
                        },
                        ticketType: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ message: 'Event not found or unauthorized' });
        }

        // Compute sales statistics
        let estimatedRevenue = 0;
        let totalTicketsSold = 0;

        event.tickets.forEach(ticket => {
            if (ticket.status !== 'CANCELLED' && ticket.order?.status === 'PAID') {
                totalTicketsSold++;
                estimatedRevenue += ticket.ticketType.price;
            }
        });

        // Compute quota left for each ticket type
        const ticketQuota = event.ticketTypes.map(tt => {
            const soldCount = event.tickets.filter(t => t.ticketTypeId === tt.id && t.status !== 'CANCELLED' && t.order?.status === 'PAID').length;
            return {
                id: tt.id,
                name: tt.name,
                price: tt.price,
                quota: tt.quota,
                sold: soldCount,
                left: tt.quota - soldCount
            };
        });

        // Transform transactions for the table (grouping by order)
        // Since we have tickets, multiple tickets can belong to one order. The wireframe shows "QTY" per order.
        const orderMap = new Map();

        event.tickets.forEach(ticket => {
            if (!ticket.order || ticket.order.status !== 'PAID') return;

            const orderIdStr = `#ORD-${ticket.order.id}`;
            const key = `${orderIdStr}-${ticket.ticketTypeId}`;

            if (orderMap.has(key)) {
                orderMap.get(key).qty += 1;
                orderMap.get(key).amount += ticket.ticketType.price;
            } else {
                orderMap.set(key, {
                    transaction: orderIdStr,
                    customer: ticket.order.user.name || ticket.order.user.email,
                    type: ticket.ticketType.name,
                    qty: 1,
                    amount: ticket.ticketType.price,
                    status: ticket.order.status === 'PAID' ? 'Completed' : ticket.order.status,
                    timestamp: ticket.order.createdAt
                });
            }
        });

        const transactions = Array.from(orderMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Return clean view model
        const viewData = {
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: event.eventDate,
            location: `${event.venue}, ${event.city}`,
            posterUrl: event.posterUrl,
            totalCapacity: event.totalSeats,
            totalTicketsSold,
            estimatedRevenue,
            ticketQuota,
            transactions
        };

        res.json(viewData);
    } catch (error) {
        console.error('Error fetching manage event data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const updateEventDetails = async (req: Request, res: Response) => {
    try {
        let { id } = req.params;
        const organizerId = (req as any).user.id;
        const { description } = req.body;
        
        const numericId = isNaN(Number(id)) && id.startsWith(':') ? Number(id.slice(1)) : Number(id);

        if (!numericId || typeof description !== 'string') {
            return res.status(400).json({ message: 'Invalid data' });
        }

        const event = await prisma.event.updateMany({
            where: { id: numericId, organizerId: organizerId },
            data: { description: description }
        });

        if (event.count === 0) {
            return res.status(404).json({ message: 'Event not found or unauthorized' });
        }

        res.json({ message: 'Description updated successfully' });
    } catch (error) {
        console.error('Error updating event details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const updateEventQuota = async (req: Request, res: Response) => {
    try {
        let { id } = req.params;
        const organizerId = (req as any).user.id;
        const { quotas } = req.body; // Array of { id: ticketTypeId, left: newLeftQuota }
        
        const numericId = isNaN(Number(id)) && id.startsWith(':') ? Number(id.slice(1)) : Number(id);

        if (!numericId || !Array.isArray(quotas)) {
            return res.status(400).json({ message: 'Invalid data' });
        }

        // Verify event ownership
        const event = await prisma.event.findFirst({
            where: { id: numericId, organizerId: organizerId },
            include: { tickets: true, ticketTypes: true } // Needed to compute sold
        });

        if (!event) {
            return res.status(404).json({ message: 'Event not found or unauthorized' });
        }

        let addedSeats = 0;

        // Process each ticket type
        for (const q of quotas) {
            const ticketType = event.ticketTypes.find(tt => tt.id === q.id);
            if(ticketType) {
                const soldCount = event.tickets.filter(t => t.ticketTypeId === ticketType.id && t.status !== 'CANCELLED' && t.order?.status === 'PAID').length;
                const newQuota = soldCount + Math.max(0, Number(q.left));
                
                addedSeats += (newQuota - ticketType.quota);

                await prisma.ticketType.update({
                    where: { id: ticketType.id },
                    data: { quota: newQuota }
                });
            }
        }
        
        // Optionally update the totalSeats of the event
        if (addedSeats !== 0) {
             await prisma.event.update({
                 where: { id: event.id },
                 data: { totalSeats: event.totalSeats + addedSeats }
             });
        }

        res.json({ message: 'Quotas updated successfully' });
    } catch (error) {
        console.error('Error updating event quotas:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}