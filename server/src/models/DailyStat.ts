import mongoose, {Schema, Document} from "mongoose";



export interface IDailyStat extends Document {
  artistId: mongoose.Types.ObjectId;
  date: string;
  views: number;
  favorites: number;   
}

const DailyStatSchema: Schema = new Schema ({
  artistId: {type: Schema.Types.ObjectId, ref: "User", required: true},
  date: {type: String, required: true},
  views: {type: Number, default: 0},
  favorites: {type: Number, default: 0}  
});

//Only one entry per day
DailyStatSchema.index({artistId: 1, date: 1}, {unique: true}); 


export default mongoose.model<IDailyStat>("DailyStat", DailyStatSchema); 