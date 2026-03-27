import {Router, Request, Response, NextFunction} from 'express';
import {verifyToken} from '../middleware/auth';
import {sendEmail} from '../utils/sendEmail';

import User from '../models/User';
import Friendship from '../models/Friendship';
import { sendInAppNotification } from '../utils/sendNotification';



const router = Router();

const isAdmin = async (id: string): Promise<boolean> => {
  const user = await User.findById(id);
  return user?.role === "Admin"; 
};


//Send friend request
router.post(
 '/request',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
   const {receiverId} = req.body;
   const requesterId = (req as any).user.userId;
   
   if (requesterId === receiverId) {
    res.status(400).json({message: "You cannot add yourself"}); 
    return; 
   }

   const requesterIsAdmin = await isAdmin(requesterId);
   const receiverIsAdmin = await isAdmin(receiverId);

   if (requesterIsAdmin || receiverIsAdmin) {
    res.status(403).json({message: "Admins are not authorized for this action"});
    return;
   }

   const receiverUser = await User.findById(receiverId);
   const requesterUser = await User.findById(requesterId);

   //Check if either user has blocked the other 
   if (receiverUser?.blockedUsers?.includes(requesterId as any) ||
       requesterUser?.blockedUsers?.includes(receiverId as any)) 
      {
       res.status(403).json({message: "Action not permitted."});
       return; 
      }


   //Check if friendship already exists (in either direction)
   const existing = await Friendship.findOne({
     $or:[
       {requester: requesterId, receiver: receiverId},
       {requester: receiverId, receiver: requesterId}
     ]
   });

   if (existing) {
    if (existing.status === "pending") {
      res.status(409).json({message: "Request already pending"}); 
      return; 
    }

    if (existing.status === "accepted") {
      res.status(409).json({message: "Already friends!"});
      return;
    }

    //Update an existing rejected to pending
    existing.status = "pending";
    existing.requester = requesterId as any;
    existing.receiver = receiverId as any; 

    await existing.save();
    res.json(existing);
    return; 
   }

    
   //Create new request
    const newFriendship = new Friendship({
      requester: requesterId,
      receiver: receiverId,
      status: "pending"
    });

    await newFriendship.save();
 
    //Send email notification to receiver
    if (receiverUser && receiverUser.emailNotifications) {
      await sendEmail(
        receiverUser.email,
        "New Friend Request!",
        `${requesterUser?.username} just sent you a friend request on Event Finder.`
      );
    }

    //In-app notification
    if (receiverUser && receiverUser.inAppNotifications) {
      await sendInAppNotification(
        receiverId,
        requesterId,
        "friend_request",
        `${requesterUser?.username} sent you a friend request.`
      ); 
    }

    res.status(201).json(newFriendship);

  } catch (err) {
    next(err);
  }

});


//Accept friend request
router.put(
 '/accept/:requestId',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
   const userId = (req as any).user.userId;
   const request = await Friendship.findById(req.params.requestId);
   
   if (!request) {
    res.status(404).json({message: "Request not found"});
    return;
   }

   if (String(request.receiver) !== userId) {
    res.status(403).json({message: "Unauthorized"});
    return; 
   }

   request.status = "accepted";
   await request.save();

   //Send email notification to requester
   const requesterUser = await User.findById(request.requester);
   const receiverUser = await User.findById(userId);

   if (requesterUser && requesterUser.emailNotifications) {
    await sendEmail(
      requesterUser.email,
      "Friend Request Accepted!",
      `${receiverUser?.username} accepted your friend request.`
    );
   }

   //In-app notification
   if (requesterUser && requesterUser.inAppNotifications) {
     await sendInAppNotification(
       request.requester.toString(),
       userId,
       "friend_accepted",
       `${receiverUser?.username} accepted your friend request.`
     );
   }


   res.json({message: "Friend request accepted", friendship: request});

  } catch (err) {
    next(err);
  }

});


//Reject request or unfriend
router.delete(
 '/:requestId',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
   const userId = (req as any).user.userId;
   const request = await Friendship.findById(req.params.requestId); 

   if (!request) {
    res.status(404).json({message: "Frienship not found"});
    return;
   }

   //Only the involved parties can delete
   if (String(request.requester) !== userId && String(request.receiver) !== userId) {
    res.status(403).json({message: "Unauthorized"});
    return; 
   }

   await request.deleteOne();

   res.json({message: "Removed successfully"});

  } catch (err) {
    next(err);
  }

});


//Get user's friends and requests
router.get(
 '/',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
   const userId = (req as any).user.userId;
   
   const friendships = await Friendship.find({
     $or: [
        {requester: userId},
        {receiver: userId}
     ]  
   }).populate("requester", "username role avatar lastSeen showActiveStatus")
     .populate("receiver", "username role avatar lastSeen showActiveStatus");

    res.json(friendships);

  } catch (err) {
    next(err);
  }

});


//Check status with specific user 
router.get(
 '/status/:otherUserId',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
   const userId = (req as any).user.userId;
   const {otherUserId} = req.params;

   const friendship = await Friendship.findOne({
     $or: [
       {requester: userId, receiver: otherUserId},
       {requester: otherUserId, receiver: userId}
     ]
   });

   res.json(friendship ? friendship : {status: null});

  } catch (err) {
    next(err);
  }

});


export default router; 
