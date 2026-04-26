import { jest, describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

const prismaMock = mockDeep<PrismaClient>();
jest.unstable_mockModule('../../../src/db/primsa.js', () => ({
  default: prismaMock,
  __esModule: true,
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
      hash: jest.fn(),
      compare: jest.fn()
  },
  __esModule: true
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
      sign: jest.fn(),
      verify: jest.fn()
  },
  __esModule: true
}));

const mockGoogleClientVerifyIdToken = jest.fn();
jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockGoogleClientVerifyIdToken
  })),
  __esModule: true
}));

// Set env variables before importing the module
process.env.JWT_SECRET = 'secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';

// Import dynamically AFTER mocking
const { AuthServices } = await import('../../../src/services/auth.service.js');
const bcrypt = (await import('bcrypt')).default;
const jwt = (await import('jsonwebtoken')).default;

describe('AuthServices', () => {
    const JWT_SECRET = 'secret';
    
    beforeAll(() => {
        process.env.JWT_SECRET = JWT_SECRET;
        process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    });

    afterEach(() => {
        jest.clearAllMocks();
        mockReset(prismaMock);
    });

    describe('createUser', () => {
        it('should create a new user and hash password', async () => {
            const email = 'test@example.com';
            const password = 'password123';
            const name = 'Test User';
            
            prismaMock.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
            
            const mockCreatedUser = { id: 1, email, name, password: 'hashedPassword123', role: 'USER' as const, googleId: null, createdAt: new Date(), updatedAt: new Date() };
            prismaMock.user.create.mockResolvedValue(mockCreatedUser);

            const result = await AuthServices.createUser(email, password, name);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email } });
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: { email, password: 'hashedPassword123', name }
            });
            expect(result).toEqual(mockCreatedUser);
        });

        it('should throw an error if email already exists', async () => {
            const email = 'test@example.com';
            const mockExistingUser = { id: 1, email, name: 'Test', password: 'hash', role: 'USER' as const, googleId: null, createdAt: new Date(), updatedAt: new Date() };
            
            prismaMock.user.findUnique.mockResolvedValue(mockExistingUser);

            await expect(AuthServices.createUser(email, 'pass', 'name')).rejects.toThrow('Email sudah terdaftar. Silakan gunakan email lain.');
            expect(prismaMock.user.create).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            const email = 'test@example.com';
            const password = 'password123';
            
            const mockUser = { id: 1, email, name: 'Test User', password: 'hashedPassword123', role: 'USER' as const, googleId: null, createdAt: new Date(), updatedAt: new Date() };
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mocked.jwt.token');

            const result = await AuthServices.login(email, password);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email } });
            expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser.id, role: mockUser.role },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            expect(result).toEqual({
                token: 'mocked.jwt.token',
                user: { name: mockUser.name, email: mockUser.email, role: mockUser.role }
            });
        });

        it('should throw error if email not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(AuthServices.login('test@test.com', 'pass')).rejects.toThrow('invalid');
        });

        it('should throw error if password is wrong', async () => {
            const mockUser = { id: 1, email: 'test@test.com', name: 'Test User', password: 'hashedPassword123', role: 'USER' as const, googleId: null, createdAt: new Date(), updatedAt: new Date() };
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(AuthServices.login('test@test.com', 'wrongpass')).rejects.toThrow('invalid');
        });
    });

    describe('googleLogin', () => {
        it('should create new user if googleId and email do not exist', async () => {
            const mockPayload = { sub: 'google123', email: 'google@test.com', name: 'Google User' };
            const mockTicket = { getPayload: () => mockPayload };
            mockGoogleClientVerifyIdToken.mockResolvedValue(mockTicket);
            
            prismaMock.user.findUnique.mockResolvedValueOnce(null); // googleId search
            prismaMock.user.findUnique.mockResolvedValueOnce(null); // email search
            
            const mockCreatedUser = { id: 1, email: mockPayload.email, name: mockPayload.name, password: null, googleId: mockPayload.sub, role: 'USER' as const, createdAt: new Date(), updatedAt: new Date() };
            prismaMock.user.create.mockResolvedValue(mockCreatedUser);
            (jwt.sign as jest.Mock).mockReturnValue('mocked.jwt.token');

            const result = await AuthServices.googleLogin('valid-id-token');

            expect(mockGoogleClientVerifyIdToken).toHaveBeenCalledWith({
                idToken: 'valid-id-token',
                audience: 'test-client-id'
            });
            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: { email: mockPayload.email, name: mockPayload.name, googleId: mockPayload.sub }
            });
            expect(result.token).toBe('mocked.jwt.token');
        });

        it('should link google account if email exists but googleId does not', async () => {
             const mockPayload = { sub: 'google123', email: 'google@test.com', name: 'Google User' };
             const mockTicket = { getPayload: () => mockPayload };
             mockGoogleClientVerifyIdToken.mockResolvedValue(mockTicket);
             
             prismaMock.user.findUnique.mockResolvedValueOnce(null); // googleId search
             
             const mockExistingUser = { id: 1, email: mockPayload.email, name: 'Old Name', password: 'pass', googleId: null, role: 'USER' as const, createdAt: new Date(), updatedAt: new Date() };
             prismaMock.user.findUnique.mockResolvedValueOnce(mockExistingUser); // email search
             
             const mockUpdatedUser = { ...mockExistingUser, googleId: mockPayload.sub };
             prismaMock.user.update.mockResolvedValue(mockUpdatedUser);
             (jwt.sign as jest.Mock).mockReturnValue('mocked.jwt.token');
 
             const result = await AuthServices.googleLogin('valid-id-token');
             
             expect(prismaMock.user.update).toHaveBeenCalledWith({
                 where: { email: mockPayload.email },
                 data: { googleId: mockPayload.sub }
             });
             expect(result.token).toBe('mocked.jwt.token');
        });

        it('should return token immediately if user with googleId exists', async () => {
             const mockPayload = { sub: 'google123', email: 'google@test.com', name: 'Google User' };
             const mockTicket = { getPayload: () => mockPayload };
             mockGoogleClientVerifyIdToken.mockResolvedValue(mockTicket);
             
             const mockExistingUser = { id: 1, email: mockPayload.email, name: 'Google User', password: null, googleId: mockPayload.sub, role: 'USER' as const, createdAt: new Date(), updatedAt: new Date() };
             prismaMock.user.findUnique.mockResolvedValueOnce(mockExistingUser); // googleId search
             
             (jwt.sign as jest.Mock).mockReturnValue('mocked.jwt.token');
 
             const result = await AuthServices.googleLogin('valid-id-token');
             
             expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
             expect(prismaMock.user.create).not.toHaveBeenCalled();
             expect(prismaMock.user.update).not.toHaveBeenCalled();
             expect(result.token).toBe('mocked.jwt.token');
        });
        
        it('should throw error if payload is null or email missing', async () => {
             mockGoogleClientVerifyIdToken.mockResolvedValue({ getPayload: () => null });
             await expect(AuthServices.googleLogin('invalid-token')).rejects.toThrow('Invalid Google token');
             
             mockGoogleClientVerifyIdToken.mockResolvedValue({ getPayload: () => ({ sub: '123' }) }); // no email
             await expect(AuthServices.googleLogin('invalid-token')).rejects.toThrow('Google account has no email');
        });
    });
});
