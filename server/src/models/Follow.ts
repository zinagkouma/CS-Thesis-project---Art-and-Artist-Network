import mongoose, { Document, Schema, Types } from 'mongoose';


export interface IFollow extends Document {
  follower: Types.ObjectId; 
  followed: Types.ObjectId; 
  createdId: Date;   
}


const FollowSchema = new Schema<IFollow> (
  {
    follower: {type: Schema.Types.ObjectId, ref: "User", required: true},
    followed: {type: Schema.Types.ObjectId, ref: "User", required: true}
  },
  {timestamps: true}  //for managing createdAt
);


//Prevent duplicate follows
FollowSchema.index({follower: 1, followed: 1}, {unique: true});


export default mongoose.model<IFollow>("Follow", FollowSchema); 

