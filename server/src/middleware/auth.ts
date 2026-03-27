import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";



export interface AuthRequest extends Request {
    user?: {userId: string; role: 'User'|'Artist'|'Admin'};
}


export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    if (!token){
     res.status(401).json({ message: 'No token provided' });
     return;
    }

    try {
      const decoded = jwt.verify(token ,process.env.JWT_SECRET as string) as any; 
      
      const user = await User.findById(decoded.userId); 

      if (!user) {
        res.status(401).json({message: "User does not exist"});
        return; 
      }

      if (user.status === "Suspended") {
        res.status(403).json({message: "Account suspended"});
        return; 
      }

      req.user = {userId: user.id, role: user.role};
      next(); 

    } catch {
     res.status(401).json({message: "Invalid token"});
     return;
    }
  }


export function verifyAdmin(req: AuthRequest, res: Response, next: NextFunction): void {

    if (!req.user) {
     res.status(401).json({ message: 'Unauthorized user' });
     return;
    }

    if (req.user.role !== 'Admin') {
     res.status(403).json({ message: 'Admin access only!' });
     return;
    }
    next();
}