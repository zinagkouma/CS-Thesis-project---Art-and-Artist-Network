import mongoose, {Schema, Document, Types} from "mongoose";


export interface IFriendship extends Document {
  requester: Types.ObjectId;
  receiver: Types.ObjectId; 
  status: "pending" | "accepted" | "rejected";
  createdAt: Date; 
  updatedAt: Date;  
}


const FriendshipSchema: Schema = new Schema(
  {
    requester: {type: Schema.Types.ObjectId, ref: "User", required: true},
    receiver: {type: Schema.Types.ObjectId, ref: "User", required: true},
    status: {
     type: String,
     enum: ["pending", "accepted", "rejected"],
     default: "pending"
    }
  },
  {timestamps: true}  
);

//Make sure a unique request pair exists
FriendshipSchema.index({requester: 1, receiver: 1}, {unique: true}); 


export default mongoose.model<IFriendship>("Friendship", FriendshipSchema); 