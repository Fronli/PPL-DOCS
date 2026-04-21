import type {Request, Response} from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../db/primsa.js';
import {getErrorMessage} from '../services/reuse.service.js';
import { AuthServices } from '../services/auth.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../../../');

export const getLoginStaticFile = async (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'frontend', 'loginpage', 'index.html'));
}

export const getSignupStaticFile = async (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'frontend', 'registerpage', 'index.html'));
}

export  const register = async (req: Request, res: Response) => {
    const { email, name, password } = req.body; 
    console.log(email);
    console.log(name);
    console.log(password);

    try{
      const newUser = await AuthServices.createUser(email, password, name);

      res.status(201).json({
            message: "User berhasil dibuat!",
            data: newUser
        });
    }        
    catch (error) {
      res.status(400).json({
          message: "Gagal mengisi data",
          error: getErrorMessage(error),
      });
    }
};

export const login = async(req: Request, res: Response)=>{
  try{
    const { email, password } = req.body;
    console.log(email, password);
    
    //Buat ngecek username & passwordnya bener atau nggak!
    const result = await AuthServices.login(email, password);
    console.log(result);

    //Return data yang isinya token dari authService.ts buat dikirim ke user
    return res.status(200).json({
        message: "login success!",
        token: result.token,
        user: result.user
    })

  }
  catch(error){
    console.error(error);
      return res.status(401).json({
        message: "invalid email or password",
      });
  }
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Pengganti "SELECT * FROM User"
    const users = await prisma.user.findMany(); 
    console.log("BERHASIL WOK!");
    res.json({
        status: "OK!",
        mesage: "anjay mabar!",
        users: users
    });
  } catch (error) {
    console.log("ERORR JIR!");
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    const result = await AuthServices.googleLogin(idToken);

    return res.status(200).json({
      message: "Google login success!",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({
      message: "Google login failed",
      error: getErrorMessage(error),
    });
  }
};