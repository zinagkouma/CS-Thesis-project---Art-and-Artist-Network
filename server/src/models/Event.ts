import mongoose, {Schema, Document, Types } from "mongoose";


export interface IEvent extends Document {
   title: string;
   creator: Types.ObjectId;
   description: string;
   category: string;
   tags: string[];
   coverImageURL: string;
   gallery?: string[];
   
   //Time and place
   startDate: Date;
   endDate?: Date;
   startTime: string;
   venueName: string;
   city: string;
   address: string;

   //Geospatial point for map 
   location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
   };


   //Ticketing 
   isFree: boolean;
   price?: number;
   priceMin?: number;
   priceMax?: number; 
   attendeesCount: number;

   //Publication status
   status: "draft" | "published";

   createdAt: Date;
   updatedAt: Date;

   //Rating
   avgRating: number; 
   ratingCount: number;

   //Store rating counts 
   ratingDist:{
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
   };


}



const EventSchema: Schema = new Schema<IEvent>({
    title: { type: String, required: true, trim: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },

    description: { 
      type: String,
      required: function(this: IEvent) {return this.status === "published";} //required only for publish 
    },

    category: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }], //NOT required for drafts 

    coverImageURL: { 
      type: String, 
      required: function(this: IEvent) {return this.status === "published";} //required only for publish
    },

    gallery: [String],

    startDate: { 
      type: Date,
      required: function(this: IEvent) {return this.status === "published";}, //required only for publish
      index: true 
    },

    endDate: { type: Date },

    startTime: {
       type: String,
       required: function(this: IEvent) { return this.status === 'published'; }
    },

    venueName: { 
      type: String,
      required: function(this: IEvent) { return this.status === 'published'; }
    },

    city: { 
      type: String,
      required: function(this: IEvent) {return this.status === "published";}, //required only for publish
      index: true 
    },

    address: 
    {
      type: String,
      required: function(this: IEvent) {return this.status === "published";} //required only for publish
    },
    

    //Location 
    location: {
      type: {
       type: String,
       enum: ["Point"],
       required: function(this: IEvent) { return this.status === 'published'; }
      },

      coordinates: {
        type: [Number],
        required: function(this: IEvent) { return this.status === 'published'; },

        //validation
        validate :{
          validator: (v: number[]) => v.length === 2,
          message: "Coordinates must be [longitude, latitude]"   
        },
      },   
    },
    

    
    isFree: { type: Boolean}, // NOT required for drafts 
    price: { type: Number, min: 0 },
    priceMin: { type: Number, min: 0 },   
    priceMax: { type: Number, min: 0 }, 
    attendeesCount: { type: Number, default: 0, min: 0 },

    status:{
        type: String,
        enum: ["draft", "published"],
        default: "draft",
        index: true
    },


    //Rating
    avgRating: {type: Number, default: 0},
    ratingCount: {type: Number, default: 0},

    ratingDist: {
      1: {type: Number, default: 0},
      2: {type: Number, default: 0},
      3: {type: Number, default: 0},
      4: {type: Number, default: 0},
      5: {type: Number, default: 0}
   } 
 },
    { timestamps: true } 
 );

 //Search based on title and tags
 EventSchema.index({title:"text", tags:"text"});

 //Geospatial index for location-based queries
 EventSchema.index({location: "2dsphere"});


 export default mongoose.model<IEvent>("Event", EventSchema);