import mongoose, {Schema, Document, Types} from "mongoose";



export interface IConversation extends Document {
  members: Types.ObjectId[]; 
  lastMessage?: string; 
  lastMessageId?: Types.ObjectId;
  updatedAt: Date;   
}


const ConversationSchema = new Schema (
  {
    members: [{type: Schema.Types.ObjectId, ref: "User"}],
    lastMessage: {type: String},
    lastMessageId: {type: Schema.Types.ObjectId, ref: "Message"}
  },
  {timestamps: true}  
);


export default mongoose.model<IConversation>("Conversation", ConversationSchema); 