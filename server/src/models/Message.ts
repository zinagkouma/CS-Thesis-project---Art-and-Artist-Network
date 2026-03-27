import mongoose, {Schema, Document, Types} from "mongoose";



export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  seen: boolean;
  createdAt: Date;   
}


const MessageSchema = new Schema (
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    text: {type: String, required: true},
    seen: {type: Boolean, default: false}
  },
  {timestamps: true}   
);


export default mongoose.model<IMessage>("Message", MessageSchema); 