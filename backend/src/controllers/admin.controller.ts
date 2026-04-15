import type {Request, Response} from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../db/primsa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../../../');


export const getAdminDashboard_Apply = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        
        // Include user details to show applicant's email and name
        const accounts = await prisma.eOApplication.findMany({
            where: { status: 'PENDING' },
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        
        const total = await prisma.eOApplication.count({
            where: { status: 'PENDING' }
        });
        
        res.json({ accounts, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching Apply accounts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const approveApply = async (req: Request, res: Response) => {
    try {
        const applyId = parseInt(req.params.id as string);
        const application = await prisma.eOApplication.findUnique({where: {id: applyId}});
        if(!application) return res.status(404).json({message: "Not found"});
        
        await prisma.eOApplication.update({
            where: { id: applyId },
            data: { status: 'APPROVED' }
        });
        
        await prisma.user.update({
            where: { id: application.userId },
            data: { role: 'EO' }
        });
        
        res.json({ message: 'Application approved successfully' });
    } catch (error) {
        console.error('Error approving application:', error);
        res.status(500).json({ message: 'Internal server error while approving' });
    }
}

export const rejectApply = async (req: Request, res: Response) => {
    try {
        const applyId = parseInt(req.params.id as string);
        
        await prisma.eOApplication.update({
            where: { id: applyId },
            data: { status: 'REJECTED' }
        });
        
        res.json({ message: 'Application rejected successfully' });
    } catch (error) {
        console.error('Error rejecting application:', error);
        res.status(500).json({ message: 'Internal server error while rejecting' });
    }
}


export const getAdminDashboard_EO = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        
        const accounts = await prisma.user.findMany({
            where: { role: 'EO' },
            skip: skip,
            take: limit,
            include: { _count: { select: { events: true } } },
            orderBy: { createdAt: 'asc' }
        });
        
        const total = await prisma.user.count({ where: { role: 'EO' } });
        
        res.json({ accounts, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching EO accounts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getAdminDashboard_User = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        
        const accounts = await prisma.user.findMany({
            where: { role: 'USER' },
            skip: skip,
            take: limit,
            include: { _count: { select: { events: true } } },
            orderBy: { createdAt: 'asc' }
        });

        const total = await prisma.user.count({ where: { role: 'USER' } });
        
        res.json({ accounts, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching User accounts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getAdminDashboard_Events = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        
        const events = await prisma.event.findMany({
            skip: skip,
            take: limit,
            orderBy: { eventDate: 'asc' },
            select:{
                id: true,
                title: true,
                ticketTypes: {
                    select:{
                        quota: true
                    }
                }
                
            }
        });

        const total = await prisma.event.count();
        
        res.json({ events, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const accountId = parseInt(req.params.id as string);
        
        // Prevent deleting oneself
        if ((req as any).user.id === accountId) {
            return res.status(400).json({ message: 'Cannot delete your own admin account.' });
        }

        await prisma.user.delete({
            where: { id: accountId }
        });

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const deactivateEvent = async (req: Request, res: Response) => {
    try {
        const eventId = parseInt(req.params.id as string);
        
        await prisma.event.update({
            where: { id: eventId },
            data: { isPublished: false }
        });
        
        res.json({ message: 'Event deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating event:', error);
        res.status(500).json({ message: 'Internal server error while deactivating event' });
    }
}