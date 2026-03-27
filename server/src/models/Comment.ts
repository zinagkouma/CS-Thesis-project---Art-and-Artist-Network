import mongoose, {Schema, Document} from 'mongoose';



export interface IComment extends Document {
  text: String;
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  createdAt: Date;   
}

const CommentSchema: Schema = new Schema({
  text: {type: String, required: true},
  user: {type: Schema.Types.ObjectId, ref: "User", required: true},
  event: {type: Schema.Types.ObjectId, ref: "Event", required: true},

}, {timestamps: true});


export default mongoose.model<IComment>("Comment", CommentSchema); 