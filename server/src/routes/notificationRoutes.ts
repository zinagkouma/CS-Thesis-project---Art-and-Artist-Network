import {Router, Request, Response, NextFunction} from 'express';
import {verifyToken} from '../middleware/auth';
import Notification from '../models/Notification';



const router = Router();


//Get all notifications for current user
router.get(
 '/',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const userId = (req as any).user.userId;

    const notifications = await Notification.find({receiver: userId})
         .sort({createdAt: -1})
         .populate("sender", "username avatar role")
         .limit(20);

    const unreadCount = await Notification.countDocuments({receiver: userId, isRead: false});
    
    res.json({notifications, unreadCount});
         
   } catch (err) {
     next(err); 
   }

 });


//Mark all as read
router.patch(
 '/mark-read',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const userId = (req as any).user.userId;
    
    await Notification.updateMany({receiver: userId, isRead: false}, {isRead: true});
    res.json({message: "All notifications marked as read"});

   } catch (err) {
     next(err); 
   } 
 
 }); 


 //Delete notification
 router.delete(
  '/:id',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     await Notification.findByIdAndDelete(req.params.id);
     res.status(200).json({message: "Notification deleted"});

    } catch (err) {
      res.status(500).json({message: "Server error"});
    }
  
  });


 export default router; 