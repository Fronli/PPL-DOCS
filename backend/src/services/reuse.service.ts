import bcrypt from 'bcrypt';

export const getErrorMessage = (error: unknown)=>{
    if (error instanceof Error) return error.message;
    return String(error);
}