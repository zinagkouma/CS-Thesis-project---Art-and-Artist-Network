import {Request, Response, NextFunction} from 'express'; 
import jwt from 'jsonwebtoken';

import User from '../models/User';



export const trackActivity = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization; 

  //Check if there's a token header
  if (authHeader) {
    const token = authHeader.split(' ')[1];

    if (token) {
      try {
       //Manually decode the token to get the ID immediately
       const decoded = jwt.decode(token) as {userId: string} | null;

       if (decoded && decoded.userId) {
         User.findByIdAndUpdate(decoded.userId, {lastSeen: new Date()}).exec(); 
       }

      } catch (err) {
        //Ignore errors 
      }
    }
  }
  
  next();
};