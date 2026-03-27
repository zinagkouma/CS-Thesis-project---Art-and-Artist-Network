import Notification from "../models/Notification";



export const sendInAppNotification = async (
  receiverId: string,
  senderId: string | null,
  type: "friend_request" | "friend_accepted" | "new_follower" | "event_published" | "system",  
  message: string,
  eventId?: string
) => {
  try {
   await Notification.create({
     receiver: receiverId,
     sender: senderId,
     type,
     message,
     isRead: false,
     eventId
   });
   

  } catch (error) {
    console.error("Could not create notification", error); 
  }  
};