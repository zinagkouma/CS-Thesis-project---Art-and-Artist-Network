import mongoose, {Schema, Document} from 'mongoose';



export interface INotification extends Document {
  receiver: mongoose.Types.ObjectId; 
  sender?: mongoose.Types.ObjectId;
  type: "friend_request" | "friend_accepted" | "new_follower" | "event_published" | "system";  
  message: string;
  isRead: boolean;
  createdAt: Date; 
  eventId?: mongoose.Types.ObjectId;
}

const NotificationSchema = new Schema<INotification>({
  receiver: {type: Schema.Types.ObjectId, ref: "User", required: true},
  sender: {type: Schema.Types.ObjectId, ref: "User"},
  type: {
    type: String,
    enum: ["friend_request", "friend_accepted", "new_follower", "event_published", "system"],
    required: true
  },
  message: {type: String, required: true},
  isRead: {type: Boolean, default: false},
  eventId: {type: Schema.Types.ObjectId, ref: "Event"}

}, {timestamps: true});


export default mongoose.model<INotification>("Notification", NotificationSchema);