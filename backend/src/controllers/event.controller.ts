import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../db/primsa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../../../');

export const getEvents = async (req: Request, res: Response) => {
    const { cursor, category, city } = req.query;
    const limit = 16;

    // Build where clause dynamically
    const where: any = {
        isPublished: true,
    };

    if (category && typeof category === 'string') {
        where.category = category;
    }

    if (city && typeof city === 'string') {
        where.city = city;
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
