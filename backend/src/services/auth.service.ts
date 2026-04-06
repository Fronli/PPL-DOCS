import prisma from '../db/primsa.js';
import brcypt from "bcrypt"
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);


export const AuthServices = {
   async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("invalid");

        const valid = await brcypt.compare(password, user.password!);
        if (!valid) throw new Error("invalid");

        const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET!,
        { expiresIn: "1h" }
        );

        return {
        token,
        user: {
            name: user.name,
            email: user.email,
            role: user.role,
        },
        };
    },

    async createUser(email: string, password: string, name: string){
        const hashedPassword = await brcypt.hash(password, 10); 
        return prisma.user.create({
            data: {
                email: email, 
                password: hashedPassword,
                name: name,
            }
        })
    },

    async googleLogin(idToken: string) {
        // 1. Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID as string,
        }); 

        const payload = ticket.getPayload();
        if (!payload) throw new Error("Invalid Google token");

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || null;

        if (!email) throw new Error("Google account has no email");

        // 2. Find user by googleId first
        let user = await prisma.user.findUnique({ where: { googleId } });

        if (!user) {
            // 3. Check if user exists by email (link accounts)
            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
                // Link Google account to existing user
                user = await prisma.user.update({
                    where: { email },
                    data: { googleId },
                });
            } else {
                // 4. Create new user (no password needed for Google OAuth)
                user = await prisma.user.create({
                    data: {
                        email,
                        name,
                        googleId,
                        // password is null for Google-only users
                    },
                });
            }
        }

        // 5. Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET!,
            { expiresIn: "1h" }
        );

        return {
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }
}