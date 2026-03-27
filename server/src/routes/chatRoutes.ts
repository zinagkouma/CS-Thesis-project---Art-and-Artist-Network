import {Router, Request, Response, NextFunction} from 'express'; 
import { verifyToken } from '../middleware/auth';

import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Friendship from '../models/Friendship';



const router = Router();


//Get all friends with their chat info 
router.get(
 '/', 
 verifyToken,
 async (req: Request, res: Response, next: NextFunction) => {
   try {
    const userId = (req as any).user.userId;

    //Find all friendships and existing conversations with current user
    const friendships = await Friendship.find({
      $or: [{requester: userId}, {receiver: userId}],
      status: "accepted"
    })
    .populate("requester", "username avatar role")
    .populate("receiver", "username avatar role");

    const conversations = await Conversation.find({
      members: {$in: [userId]}
    });

    //Create a list of chats based on friends
    const chatList = await Promise.all(friendships.map(async f => {
      const friend = (String(f.requester._id) === userId)
           ? f.receiver
           : f.requester; 

    const convo = conversations.find(c =>
      c.members.some(m => String(m) === String((friend as any)._id))
    );

     if (convo) {
      //Count unread messages
      const unreadCount = await Message.countDocuments({
        conversationId: convo._id,
        sender: {$ne: userId},
        seen: false
      }); 


      //Return existing conversation
      return {
        conversationId: convo._id,
        otherUser: friend,
        lastMessage: convo.lastMessage || "No messages yet",
        updatedAt: convo.updatedAt,
        unreadCount: unreadCount
      };

     } else {
      //Return placeholder conversation
      return {
       conversationId: `virtual_${(friend as any)._id}`, 
       otherUser: friend,
       lastMessage: "Start a conversation",
       updatedAt: new Date(0), // Put at bottom of sort
       unreadCount: 0
      };
     }
           
    }));

    //Sort by most recent message
    chatList.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime(); 
      const dateB = new Date(b.updatedAt).getTime(); 
      return dateB - dateA; 
    });

    res.json(chatList);

   } catch (err) {
     next(err); 
   }
 }); 


 //Get global unread count
 router.get(
  '/unread/count',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
     const userId = (req as any).user.userId;
     
     //Get all convo IDs current user is part of
     const conversations = await Conversation.find({members: {$in: [userId]}});
     const conversationsId = conversations.map(c => c._id); 

     const totalUnread = await Message.countDocuments({
       conversationId: {$in: conversationsId},
       sender: {$ne: userId},
       seen: false
     });

     res.json({count: totalUnread});

    } catch (err) {
      next(err); 
    }
  
  });


 //Send message 
 router.post(
  '/',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     const senderId = (req as any).user.userId;
     const { conversationId, receiverId, text } = req.body;
     
     if (!text) {
       res.status(400).json({message: "Text required"});
       return;
     }

     let targetConvoId = conversationId;

     //If this is a new chat or ID is missing, create the conversation
     if (!targetConvoId || targetConvoId.startsWith("virtual_")) {
       if (!receiverId) {
         res.status(400).json({message: "Recipient ID required for new chat"});
         return;
       }

       let conversation = await Conversation.findOne({
         members: {$all: [senderId, receiverId]}
       });

       if (!conversation) {
         conversation = new Conversation({
           members: [senderId, receiverId],
           lastMessage: text
         });

         await conversation.save();
       }

       targetConvoId = conversation._id; 
     }

     //Create the message
     const newMessage = new Message({
       conversationId: targetConvoId,
       sender: senderId,
       text
     });

     const savedMessage = await newMessage.save();

     //Update conversation preview
     await Conversation.findByIdAndUpdate(targetConvoId, {
       lastMessage: text,
       lastMessageId: savedMessage._id,
       updatedAt: new Date()
     });

     res.status(201).json({
      ...savedMessage.toObject(),
      realConversationId: targetConvoId 
     });

    } catch (err) {
      next(err); 
    }
  
  });

  
  //Get messages
  router.get(
   '/:conversationId',
   verifyToken,
   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     const {conversationId} = req.params; 
     
     if (conversationId.startsWith("virtual_")) {
       res.json([]);
       return;
     }

     const messages = await Message.find({
      conversationId
     })
      .sort({createdAt: 1});
      
     res.json(messages); 

    } catch (err) {
      next(err); 
    } 

   });


  //Mark conversation as read
  router.put(
   '/:conversationId/read',
   verifyToken,
   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
     try {
      const userId = (req as any).user.userId;
      const {conversationId} = req.params;

      if (conversationId.startsWith("virtual_")) return; 
      
      /*Update all messages in this chat where i am NOT the sender
        and they are currently unread*/
      await Message.updateMany(
        {
          conversationId: conversationId,
          sender: {$ne: userId},
          seen: false 
        },
        {$set:{seen: true}}
      );
      
      res.json({success: true});

     } catch (err) {
       next(err);  
     }
   
   }); 

 export default router; 