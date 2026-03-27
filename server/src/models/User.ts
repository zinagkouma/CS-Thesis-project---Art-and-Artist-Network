import mongoose, {Schema, Document} from 'mongoose';
import bcrypt from 'bcrypt';



interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date; 
  role: "User" | "Artist" | "Admin";
  status: "Active" | "Suspended";
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[]; 
  favorites: mongoose.Types.ObjectId[];
  blockedUsers?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  lastSeen: Date; 
  profileViews?: number;
  avatar?: string;
  bio?: string;

  professionType?: "Director" | "Musician" | "Actor" |"None"; 
  skills?: string[];
  city?: string;
  portfolio: string; 
  gallery?: string[]; 
  LookingForCollab?: boolean; 

  emailNotifications: boolean;
  inAppNotifications: boolean; 
  showActiveStatus?: boolean;
  friendVisibility?: "everyone" | "friends" | "me";
  
  validatePassword(password: string): Promise<boolean>;
}


const UserSchema = new Schema<IUser>({
  username: {type: String, required: true},
  email: {type: String, required: true, unique: true, lowercase: true},
  password: {type: String, required: true},
  resetPasswordToken: {type: String},
  resetPasswordExpire: {type: Date},
  role: {type: String, enum: ["User","Artist","Admin"], required: true},
  status: {type: String, enum: ["Active","Suspended"], default: "Active", required: true}, 
  lastSeen: {type: Date, default: Date.now},
  profileViews: {type: Number, default: 0},

  followers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  following: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],

  favorites: [{type: mongoose.Schema.Types.ObjectId, ref: "Event"}],
  blockedUsers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],


  bio: {type: String, maxlength: 150},
  avatar: {type: String},

  professionType: {
    type: String, 
    enum: ["Director", "Musician", "Actor", "None"],
    default: "None"
  },
  skills: [{type: String}],
  city: {type: String},
  portfolio: {type: String}, 
  gallery: [{type: String}],
  LookingForCollab: {type: Boolean, default: false},

  emailNotifications: {type: Boolean, default: true},
  inAppNotifications: {type: Boolean, default: true},
  showActiveStatus: {type: Boolean, default: true},
  friendVisibility: {type: String, enum: ["everyone", "friends", "me"], default: "everyone"}
},
 { timestamps: true });


// Instance method to check password
UserSchema.methods.validatePassword = function(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};


// Pre‐save hook to hash password
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


//Clean up data of deleted user 
UserSchema.post("findOneAndDelete", async function(doc) {
  if (doc) {
    console.log(`Cleaning up data for user: ${doc.username}`);

    await mongoose.model("Follow").deleteMany({
      $or: [{follower: doc._id}, {followed: doc._id}]
    });

    //If user is Artist, delete all his events 
    if (doc.role === "Artist") {
      await mongoose.model("Event").deleteMany({creator: doc._id});
    }

    console.log("Clean up complete!")
  }
});


export default mongoose.model<IUser>('User', UserSchema);
