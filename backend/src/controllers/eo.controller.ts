import type { Request, Response } from 'express';
import prisma from '../db/primsa.js';

export const getEOEvent = async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            where: {
                organizerId: req.user.id
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
        const { title, description, category, eventDate, location, totalSeats, ticketTypes } = req.body;
        
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
                    create: parsedTicketTypes.map((t: any) => ({
                        name: t.name,
                        price: t.price,
                        quota: t.quota
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