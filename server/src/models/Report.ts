import mongoose, { Schema, Document } from 'mongoose';



export interface IReport extends Document {
  reportedUser: mongoose.Types.ObjectId;
  reportedItem: mongoose.Types.ObjectId;
  itemType: "Message" | "Comment";
  reason: string;
  description: string;
  status: "Pending" | "Resolved" | "Dismissed";
  createdAt: Date;
}

const ReportSchema:Schema = new Schema({
  reportedUser: {type: Schema.Types.ObjectId, ref: "User", required: true},
  reportedItem: {type: Schema.Types.ObjectId, refPath: "itemType", required: true},
  itemType: {
    type: String,
    enum: ["Message", "Comment"],
    default: "Message",
    required: true 
  },
  reason: {type: String, required: true},
  description: {type: String},
  status: {
    type: String,
    enum: ["Pending", "Resolved", "Dismissed"],
    default: "Pending"
  }  

}, {timestamps: true});


export default mongoose.model<IReport>("Report", ReportSchema); 