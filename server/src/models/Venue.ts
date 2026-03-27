import mongoose, {Schema, Document} from "mongoose";



export interface IVenue extends Document {
  name: string; 
  description: string; 
  venueType: "Theater" | "Live Music" | "Stadium" | "Other"; 
  city: string; 
  address: string; 
  location: {type: "Point", coordinates: [number, number]};
  capacity: number;
  contactNumber: string;  
  image?: string;
  gallery?: string[];
}

const VenueSchema: Schema = new Schema({
  name: {type: String, required: true},
  description: {type: String},
  venueType: {
    type: String,
    enum: ["Theater", "Live Music", "Stadium", "Other"],
    required: true
  },
  city: {type: String, required: true},
  address: {type: String, required: true},
  location: {
    type: {type: String, enum: ["Point"], default: "Point"},
    coordinates: {type: [Number], required: true}
  },
  capacity: {type: Number},
  contactNumber: {type: String, required: true},
  image: {type: String},
  gallery: [{type: String}]

}, {timestamps: true});

//Indexes for fast searching
VenueSchema.index({name: "text", city: "text"}); 


export default mongoose.model<IVenue>("Venue", VenueSchema); 