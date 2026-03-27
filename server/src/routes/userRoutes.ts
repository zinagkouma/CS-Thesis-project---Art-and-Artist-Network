import {Router, Request, Response, NextFunction} from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'; 
import {verifyToken, verifyAdmin} from '../middleware/auth';
import {upload} from './uploadRoutes';
import {sendEmail} from '../utils/sendEmail';
import nodemailer from 'nodemailer';
import {sendInAppNotification} from '../utils/sendNotification';
 

import User from '../models/User';
import Follow from '../models/Follow';
import Event from '../models/Event'; 
import Friendship from '../models/Friendship';
import DailyStat from '../models/DailyStat';



const router = Router()


router.post(
  '/signup',
  async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
      const {username, email, password, role} = req.body;

      // Validate required fields
      if (!username || !email || !password || !role) {
        res.status(400).json({message: "All fields are required."});
        return; 
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({message: "Email already in use."});
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const HashedPass = await bcrypt.hash(password, salt);

      // Create and save user
      const newUser = new User({
        username,
        email,
        password: HashedPass,
        role,
      });
      await newUser.save();

      // Respond with safe user info
      res.status(201).json({
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      });
    } catch (error: any) {
      console.error("SIGNUP PROBLEM: ", error.message || error);
    }
  }
);


router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
      const {email, password} = req.body;
      const isEmail = email.includes('@');
      // Find user
      const user = await User.findOne( 
        isEmail? {email: email.toLowerCase()} : {username: email}
      );

      if (!user) {
        res.status(401).json({message: 'Invalid credentials'});
        return;
      }

      // Check if user is suspended
      if (user.status === "Suspended") {
        res.status(403).json({message: "Your account is suspended"});
        return; 
      }

      // Compare against the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({message: 'Invalid credentials'});
        return; 
      }

      // Sign a JWT
      const token = jwt.sign(
        {userId: user._id, role: user.role},
        process.env.JWT_SECRET as string,
        {expiresIn: '2h'}
      );

      // Return it (and any user info you want client-side)
      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        }
      });
    } catch (err) {
      next(err);
    }
  }
);


//Forgot password
router.post(
 '/forgot-password',
  async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  try {
    const {email} = req.body;
    const user = await User.findOne({email});

    if (!user) {
      res.status(404).json({message: "No user with this email found."});
      return;
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); 
    await user.save();

    
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "bdea7a7a5aa208", 
        pass: "4ad9a22800b440" 
      },
      tls: {
        rejectUnauthorized: false
      },
      ignoreTLS: true
    });

    transporter.sendMail({
      from: '"Event Finder" <noreply@eventfinder.com>',
      to: user.email,
      subject: "Password reset",
      html: `<p>Click the link below to change your password:</p>
             <p><a href="${resetUrl}">Reset My Password</a></p>`
    }).catch(err => console.error("Mailtrap Error: ", err));

    res.json({message: "Email sent successfully!"});

  } catch (err) {
    next(err);
  }
});


router.post(
 '/reset-password/:token',
 async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  try {
    const {password} = req.body;
    const {token} = req.params;

    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({message: "Token is expired"});
      return; 
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({message: "Password changed successfully!"});
  } catch (err) {
    next(err);
  }
});


router.get(
'/',
verifyToken, 
verifyAdmin,
async (req: Request, res: Response, next: NextFunction) => {

  try {
    const {role, status, search} = req.query as 
    {role?: string; status?: string; search?: string};

  const query: any = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (search) { 

    query.$or = [
      {username: {$regex: search, $options: 'i'}},
      {email:    {$regex: search, $options: 'i'}}
    ]; 
  }

  const users = await User.find(query).sort({ createdAt: -1 });
  res.json(users.map(u => ({
     id: u._id,
     username: u.username,
     email: u.email,
     role: u.role,
     status: u.status,
     createdAt: u.createdAt
  })
 ));
    } catch (err) {next(err);}
  } 
);


// Fetch personal profile details   
router.get(
'/profile',
verifyToken,
async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  try {
    const userReq = (req as any). user; 
    const user = await User.findById(userReq.userId).select('-password'); //Exclude password 
    
    if (!user) {
      res.status(404).json({ message: "User not found"});
      return;
    }

    const friendsCount = await Friendship.countDocuments({
      $or: [{requester: user._id}, {receiver: user._id}],
      status: "accepted"
    });

    const followersCount = await Follow.countDocuments({followed: user._id}); 
    const followingCount = await Follow.countDocuments({follower: user._id});

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      avatar: user.avatar,
      bio: user.bio,

      professionType: user.professionType,
      city: user.city,
      portfolio: user.portfolio,
      skills: user.skills,
      lookingForCollab: user.LookingForCollab,
      gallery: user.gallery,

      followersCount,
      followingCount,
      friendsCount, 

      showActiveStatus: user.showActiveStatus !== false,
      friendVisibility: user.friendVisibility || "everyone"
    }); 

  } catch (err) {
     next(err); 
  }

}); 


//Update Artist's professional profile 
router.put(
 '/profile/edit',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
   const userId = (req as any).user.userId;
   
   const {
    professionType,
    city,
    portfolio,
    skills,
    lookingForCollab,
    gallery

   } = req.body; 


   //3 image limit validation
   if (gallery && Array.isArray(gallery) && gallery.length > 3) {
     res.status(400).json({message: "Gallery cannot exceed 3 images!"});
     return; 
   }

   const user = await User.findById(userId); 

   if (!user) {
     res.status(404).json({message: "User not found"});
     return;
   }

   //Update the fields
   if (professionType !== undefined) user.professionType = professionType;
   if (city !== undefined) user.city = city;
   if (portfolio !== undefined) user.portfolio = portfolio;
   if (skills !== undefined) user.skills = skills;
   if (lookingForCollab !== undefined) user.LookingForCollab = lookingForCollab;
   if (gallery !== undefined) user.gallery = gallery;  

   await user.save(); 

   res.status(200).json({
     message: "Profile updated successfully!",
     user: {
      professionType: user.professionType,
      city: user.city,
      portfolio: user.portfolio,
      skills: user.skills,
      LookingForCollab: user.LookingForCollab,
      gallery: user.gallery
     }
   });

  } catch (err) {
    console.error("Could not update profile", err); 
    next(err);  
  }
});


router.patch(
  '/:id/status',
  verifyToken,
  verifyAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {
      const {status} = req.body as {status: 'Active'|'Suspended'};
      if (!status) {res.status(400).json({message: 'Status is required'}); return}

      const updated = await User.findByIdAndUpdate(
        req.params.id, {status}, {new: true}
      );

      if (!updated) {res.status(404).json({message: 'User not found'}); return;}

      //Send notification email
      if (updated.status === "Suspended" && updated.emailNotifications) {
        await sendEmail(
          updated.email,
          "Account Suspended",
          "Your account has been suspended due to violations of our terms of service. Please contact support for more info."
        );
      }

      res.json({id: updated._id, status: updated.status});

   } catch (err) {
     next(err);
   }
});


//Toggle block user
router.post(
 '/:id/block',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const targetUserId = req.params.id;
    const currentUserId = (req as any).user.userId; 

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404).json({message: "User not found"});
      return;
    }

    //Initialize array if it doesn't exist
    if (!currentUser.blockedUsers) currentUser.blockedUsers = [];

    const isBlocked = currentUser.blockedUsers.includes(targetUserId as any);
    if (isBlocked) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        id => id.toString() !== targetUserId
      );

    } else {
      currentUser.blockedUsers.push(targetUserId as any); 

      //Automatically remove them from followers/following if blocked
      await Follow.deleteMany({
        $or: [
          {follower: currentUserId, followed: targetUserId},
          {follower: targetUserId, followed: currentUserId}
        ]
      });

      //Also remove from friends 
      await Friendship.deleteMany({
        $or: [
          {requester: currentUserId, receiver: targetUserId},
          {requester: targetUserId, receiver: currentUserId}
        ]
      });
    }

    await currentUser.save();

    res.json({
      isBlocked: !isBlocked,
      message: !isBlocked ? "User blocked successfully" : "User unblocked"
    });

   } catch (err) {
     next(err); 
   }
 
 });


//Get list of blocked users 
router.get(
 '/blocked',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const userId = (req as any).user.userId; 

    const user = await User.findById(userId).populate({
      path: "blockedUsers",
      select: "username avatar"
    });

    if (!user) {
      res.status(404).json({message: "User not found"});
      return; 
    }

    res.json(user.blockedUsers || []);

   } catch (err) {
     next(err);
   }
 
 });
 

// Delete user
router.delete(
  '/:id',
  verifyToken,
  verifyAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     const user = await User.findById(req.params.id);
     if (!user) {res.status(404).json({message: "User not found"}); return;}
     
     //Send notification email
     if (user.emailNotifications) {
      await sendEmail(
        user.email,
        "Account Deleted",
        "Your account has been deleted by an administrator. Please contact support for more info."
      );
     }


     const deleted = await User.findByIdAndDelete(req.params.id);

     if (!deleted) {res.status(404).json({message: "User not found"}); return;}

     res.json({id: deleted._id, deleted: true});

  } catch (err) {
    next(err);
  }
});


// Search users 
router.get(
 '/search/public',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
      const {q} = req.query as {q: string};

      if (!q || q.trim().length === 0) {
        res.json([]);
        return;
      }

      // Search users whose username matches query and are NOT Admins
      const users = await User.find({
        username: {$regex: q, $options: 'i'},  //Case insensitive
        role: {$ne: "Admin"},   //No Admins
        status: "Active"   //Only active users
      })
      .select("_id username role avatar")
      .limit(6);

      res.json(users);
    } catch (err) {
      next(err); 
    }
  });


  // Get a user's public profile
  router.get(
   '/:id/public-profile',
   verifyToken, 
   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
     try{
      
      const currentUser = (req as any).user;
      const currentUserId = currentUser.userId;

      const user = await User.findById(req.params.id).select('-password'); 

      if (!user || user.status === "Suspended") {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      //Increment views if viewer is NOT the owner 
      if (currentUserId !== user.id) {
        user.profileViews = (user.profileViews || 0) + 1;
        user.save().catch(err => console.error("Error updating views", err)); 

        //Update daily history
        const today = new Date().toISOString().split('T')[0];

        DailyStat.findOneAndUpdate(
         {artistId: user._id, date: today},
         {$inc: {views: 1}},
         {upsert: true, new: true}

        ).exec(); 
      }

      const currentUserData = await User.findById(currentUserId).select("blockedUsers");
      const isBlocked = currentUserData?.blockedUsers?.includes(user._id as any) || false; 

      //Fetch Follow counts in parallel 
      const [followersCount, followingCount, isFollowing, friendsCount, isFriend] = await Promise.all([
        Follow.countDocuments({followed: user._id}),
        Follow.countDocuments({follower: user._id}),
        Follow.exists({follower: currentUserId, followed: user._id}),
        
        Friendship.countDocuments({
          $or: [{requester: user._id}, {receiver: user._id}],
          status: "accepted"
        }),

        Friendship.exists({
          $or: [
            {requester: currentUserId, receiver: user._id},
            {requester: user._id, receiver: currentUserId}
          ],
          status: "accepted"
        })
      ]);  
 
      let canViewFriends = true;
      const visibility = user.friendVisibility || "everyone";

      if (visibility === "me") {
        canViewFriends = false;
      } else if (visibility === "friends" && !isFriend) {
        canViewFriends = false;
      }
      
      res.json({
        ...user.toObject(),
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        
        followersCount,
        followingCount,
        friendsCount, 
        canViewFriends, 
        isFollowing: !!isFollowing, 
        isBlocked, 

        profileViews: user.profileViews
      });

     } catch (err) {
       next(err); 
     }
   });


  // Follow/Unfollow logic (Only for Artists)
  router.post(
   '/:id/follow',
   verifyToken,
   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
     try {
      const targetUserId = req.params.id
      const currentUserId = (req as any).user.userId; 

      const targetUser = await User.findById(targetUserId); 
      if (!targetUser) {
        res.status(404).json({message: "User not found"}); 
        return; 
      }

      //Check if user is blocked
      if (targetUser.blockedUsers && targetUser.blockedUsers.includes(currentUserId as any)) {
        res.status(403).json({message: "You cannot follow this user"});
        return;
      }
      
      if (targetUser.role !== "Artist") {
        res.status(403).json({message: "You can only follow artists"});
        return; 
      }

      const existingFollow = await Follow.findOne({
        follower: currentUserId,
        followed: targetUserId
      });

      let following = false; 

      if (existingFollow) {
        await existingFollow.deleteOne();
        following = false; 

      } else {
        await Follow.create({
          follower: currentUserId,
          followed: targetUserId 
        });
        following = true; 

        //Send notification email to Artist
        if (targetUser.emailNotifications) {
          const followerUser = await User.findById(currentUserId);
            sendEmail(
              targetUser.email,
              "You have a new follower!",
              `${followerUser?.username} is now following you.`
            );
        }

        //In-app notification
         if (targetUser.inAppNotifications) {
          const followerUser = await User.findById(currentUserId);
          await sendInAppNotification(
            targetUserId,
            currentUserId,
            "new_follower",
            `${followerUser?.username} is now following you.`
          ); 
         }
      }

      const newCount = await Follow.countDocuments({followed: targetUserId}); 

      res.json({
        isFollowing: following,
        followersCount: newCount
      });

     } catch (err) {
       next(err); 
     }

   });


   //Toggle favorite event
   router.post(
    '/favorites/:eventId',
    verifyToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
       const {eventId} = req.params;
       const userId = (req as any).user.userId; 
       
       const user = await User.findById(userId); 

       if (!user) {
        res.status(404).json({message: "User not found"});
        return; 
       }

       //Initialize array  
       if (!user.favorites) user.favorites = [];
     
       const index = user.favorites.indexOf(eventId as any);
       let isAdding = true;  

       if (index === -1) {
        //Not in favorites, so it is added 
        user.favorites.push(eventId as any); 
        isAdding = true; 

       } else {
        //Remove if in array
        user.favorites.splice(index, 1); 
       }

       await user.save(); 

       //Record favorites for artist (also handle remove)
       try {
        const event = await Event.findById(eventId);
 
        if (event && event.creator) {
          const today = new Date().toISOString().split('T')[0];
          
          const incrementValue = isAdding ? 1 : -1; 

          await DailyStat.findOneAndUpdate(
            {artistId: event.creator, date: today},
            {$inc: {favorites: incrementValue}},
            {upsert: true}
          );
        }

       } catch (err) {
         console.error("Could not update stats", err); 
       }  
      
       res.json({favorites: user.favorites}); 

      } catch (err) {
        next(err); 
      }
    }
   );


   //Get user favorites 
   router.get(
    '/favorites',
    verifyToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
       const userId = (req as any).user.userId; 
       
       //Populate 'favorites'
       const user = await User.findById(userId).populate({
         path: "favorites",
         select: "title startDate city startTime coverImageURL"       
       });

       if (!user) {
        res.status(404).json({message: "User not found"});
        return; 
       }

       res.json(user.favorites || []); 
       
      } catch (err) {
        next(err);   
      } 
    }
   );


   //Get updates from followed Artists
   router.get(
    '/updates',
    verifyToken,
    async(req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
       const userId = (req as any).user.userId;
       
       /*Find the Artist's id and the events where this Artist is
         the creator*/
       const following = await Follow.find({follower: userId}).select("followed");
       const followedIds = following.map(f => f.followed); 
       
       const updates = await Event.find({
         creator: {$in: followedIds},
         status: "published"
       })
       .sort({createdAt: -1})
       .limit(10)
       .populate("creator", "username")
       .select("title coverImageURL createdAt creator");

       res.json(updates);

      } catch (err) {
        next(err); 
      }
    });


   //Get user's following artists
   router.get(
    '/following',
    verifyToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
       const userId = (req as any).user.userId; 
       
       //Find all follow documents where 'follower' is the user
       const followingList = await Follow.find({follower: userId})
            .populate({
             path: "followed",
             select: "username role"
            });
  
       const artists = followingList
            .map((f: any) => f.followed)
            .filter((user) => user !== null); 
     
       res.json(artists);       

      } catch (err) {
        next(err); 
      }
   });


//Get total users's stats
router.get(
 '/stats/global-analytics',
 verifyToken,
 verifyAdmin,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    
    //Date calculations
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    
    //Metrics for cards
    const totalUsers = await User.countDocuments();

    const newThisMonth = await User.countDocuments({
      createdAt: {$gte: thisMonthStart}
    });

    const newLastMonth = await User.countDocuments({
      createdAt: {$gte: lastMonthStart, $lt: thisMonthStart}
    });

    let growthPercent = 0;
    if (newLastMonth > 0) {
      growthPercent = ((newThisMonth - newLastMonth) / newLastMonth) * 100;

    } else if (newThisMonth > 0 ) {
      growthPercent = 100;  
    }

 
    //Sign up history
    const historyStats = await User.aggregate([
      {
        $match: {
          createdAt: {$gte: sixMonthsAgo}
        }
      },
      {
        $group: {
          _id:{
            month: {$month: "$createdAt"},
            year: {$year: "$createdAt"}
          },
          count: {$sum: 1}
        }
      },
      {$sort: {"_id.year": 1, "_id.month": 1}}
    ]);

    //Format for chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    //Fill in missing months with 0
    const formattedHistory = [];
    for (let i = 5; i >= 0; i--) {
       const d = new Date();
       d.setMonth(d.getMonth() - i);
       const monthIndex = d.getMonth();  //0 - 11 
       const year = d.getFullYear(); 

       const found = historyStats.find(
         h => h._id.month === (monthIndex + 1) && h._id.year === year
       );

       formattedHistory.push({
         name: monthNames[monthIndex],
         value: found ? found.count : 0
       });
    }


    //User composition pie chart
    const compositionStats = await User.aggregate([
      {
        $group: {
          _id: "$role", 
          value: {$sum: 1}
        }
      }
    ]);

    const formattedComposition = compositionStats.map(item => ({
      name: item._id, 
      value: item.value
    }));


    res.json({
      totalUsers,
      newThisMonth,
      growthPercent: Math.round(growthPercent),
      history: formattedHistory,
      composition: formattedComposition
    });
  
   } catch (err) {
     next(err);
   }

 });


//Get list of users who follow a specific user
router.get(
 '/:id/followers',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     const followers = await Follow.find({followed: req.params.id}) 
          .populate("follower", "username role avatarUrl");

     //Filter out deleted users
     const cleanList = followers
          .filter((f: any) => f.follower) 
          .map((f: any) => ({
            _id: f.follower._id,
            username: f.follower.username,
            role: f.follower.role,
            avatarUrl: f.follower.avatarUrl
          })); 

      res.json(cleanList);  

    } catch (err) {
      next(err); 
    }
  });


  //Get list of users a specific user follows
  router.get(
   '/:id/following',
   verifyToken,
   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
     try {
      const following = await Follow.find({follower: req.params.id})
           .populate("followed", "username role avatarUrl");

      const cleanList = following
          .filter((f: any) => f.followed) 
          .map((f: any) => ({
            _id: f.followed._id,
            username: f.followed.username,
            role: f.followed.role,
            avatarUrl: f.followed.avatarUrl
          }));  
         
       res.json(cleanList);

     } catch (err) {
       next(err); 
     } 
   });


//Get list of a user's friends
router.get(
 '/:id/friends',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const currentUserId = (req as any).user.userId;
    const targetUserId = req.params.id;

    //Check target user's privacy settings
    const targetUser = await User.findById(targetUserId).select('friendVisibility');

    if (!targetUser) {
      res.status(404).json({message: "User not found"});
      return;
    }

    const visibility = targetUser.friendVisibility || "everyone";
    const isOwnProfile = currentUserId === targetUserId; 

    if (!isOwnProfile) {
      if (visibility === "me") {
        res.status(403).json({message: "This user's friend list is private."});
        return;
      }

      if (visibility === "friends") {
        const isFriend = await Friendship.exists({
          $or: [
            {requester: currentUserId, receiver: targetUserId},
            {requester: targetUserId, receiver: currentUserId}
          ],
          status: "accepted"  
        });

        if (!isFriend) {
          res.status(403).json({message: "This user's friend list is private."});
          return;
        }
      }
    }

    //If privacy checks are ok, fetch the friends
    const friendships = await Friendship.find({
      $or: [{ requester: targetUserId }, { receiver: targetUserId }],
      status: "accepted"
    }).populate("requester receiver", "username role avatar");

    const cleanList = friendships.map(f => {
      const friend = (f.requester as any)._id.toString() === targetUserId
           ? f.receiver
           : f.requester;

      return{
        _id: (friend as any)._id,
        username: (friend as any).username,
        role: (friend as any).role,
        avatarUrl: (friend as any).avatar
      };       
    });

    res.json(cleanList);

   } catch (err) {
     next(err);
   }
 });

 
// Get Artist Dashboard Stats
router.get(
  '/stats/dashboard',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      
      // Fetch only the necessary fields
      const user = await User.findById(userId).select('profileViews');

      if (!user) {
        res.status(404).json({message: "User not found"});
        return;
      }

      // Return the stats needed for the "Fan Pulse" widget
      res.json({
        profileViews: user.profileViews || 0
      });

    } catch (err) {
      next(err);
    }
  });


//Get 7 day history for chart
router.get(
 '/stats/history',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const userId = (req as any).user.userId;

    const today = new Date();
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(today.getDate() - 6);  //Include today + 6 previous days
    const dateString = sevenDaysAgo.toISOString().split('T')[0];

    //Fetch stats
    const stats = await DailyStat.find({
      artistId: userId,
      date: {$gte: dateString}
    });

    //Fill in missing days
    const filledStats = [];

    for (let i = 6; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);

       const dateStr = d.toISOString().split('T')[0];
       const dayName = d.toLocaleDateString('en-US', {weekday: "short"});

       const found = stats.find(s => s.date === dateStr);

       filledStats.push({
         name: dayName,
         fullDate: dateStr,
         views: found ? found.views : 0,
         favorites: found ? found.favorites : 0 
       });
    }

     res.json(filledStats);

   } catch (err) {
    next(err); 
   } 
 
 });


  //Update profile 
  router.put(
   '/profile',
   verifyToken,
   upload.single("avatar"),
   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     console.log("Uploaded File:", req.file); 
     console.log("Body Data:", req.body);

     const userReq = (req as any).user; 
     const {bio} = req.body;
     const file = req.file; 
     

     const updateData: any = {};

     //Update bio if sent 
     if (bio !== undefined) updateData.bio = bio; 

     //Update avatar if file sent 
     if (file) {
       const base = `${req.protocol}://${req.get("host")}`;
       updateData.avatar = `${base}/uploads/${file.filename}`;

     }

     const updatedUser = await User.findByIdAndUpdate(
       userReq.userId,
       {$set: updateData},
       {new: true}
     )
     .select("-password");

     if (!updatedUser) {
       res.status(404).json({message: "User not found"});
       return; 
     }

      res.json(updatedUser);

    } catch (err) {
      next(err); 
    }
  }); 


//Change password
router.patch(
 '/change-password',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     const {currentPassword, newPassword} = req.body;
     const userId = (req as any).user.userId;  //Get ID from token

     if (!currentPassword || !newPassword) {
       res.status(404).json({message: "Both current and new passwords are required"});
       return;
     }

     if (newPassword.length < 6) {
       res.status(400).json({message: "Password must be at least 6 long"});
       return; 
     }

     const user = await User.findById(userId);
     if (!user) {
       res.status(404).json({message: "User not found"});
       return;
     }

     //Verify current password
     const isMatch = await bcrypt.compare(currentPassword, user.password);
     if (!isMatch) {
       res.status(401).json({message: "Incorrect current password"});
       return;
     }

     //Hash new password and save
     const salt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(newPassword, salt); 

     user.password = hashedPassword;
     await user.save();

     res.status(200).json({message: "Password updated successfully!"});
       

    } catch (err) {
      next(err); 
    }
  
  });  


//Change Email
router.patch(
 '/update-email',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const {newEmail} = req.body;
    const userId = (req as any).user.userId;
    
    if (!newEmail) {
      res.status(400).json({message: "Email is required"});
      return;
    }
 
    //Check if email is already taken
    const existingUser = await User.findOne({email: newEmail, _id: {$ne: userId} }); 

    if (existingUser) {
      res.status(409).json({message: "This email is already used by another account"});
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {email: newEmail},
      {new: true}
    );

    if (!updatedUser) {
      res.status(404).json({message: "User not found"});
      return;
    }

    res.json({
      message: "Email updated successfully!",
      email: updatedUser.email
    });


   } catch (err) {
     next(err); 
   }

 });
 

 //Update notification preferences
 router.patch(
  '/notifications',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     const userId = (req as any).user.userId; 
     const {emailNotifications, inAppNotifications} = req.body;

     const updatedUser = await User.findByIdAndUpdate(
       userId,
       {
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(inAppNotifications !== undefined && { inAppNotifications })
       },
       {new: true}
     );

     if (!updatedUser) {
       res.status(404).json({message: "User not found"});
       return;
     }

     res.json({
       message: "Notification preferences updated!",
       emailNotifications: updatedUser.emailNotifications,
       inAppNotifications: updatedUser.inAppNotifications
     });

    } catch (err) {
      next(err);
    }
  
  }); 


 //Update privacy preferences
 router.patch(
  '/privacy',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     const userId = (req as any).user.userId;
     const {showActiveStatus, friendVisibility} = req.body; 
     
     const updatedUser = await User.findByIdAndUpdate(
       userId,
       {
        ...(showActiveStatus !== undefined && {showActiveStatus}),
        ...(friendVisibility !== undefined && {friendVisibility})
       },
       {new: true}
     );

     if (!updatedUser) {
       res.status(404).json({message: "User not found"});
       return;
     }

     res.json({
       message: "Privacy settings updated!",
       showActiveStatus: updatedUser.showActiveStatus,
       friendVisibility: updatedUser.friendVisibility
     });

    } catch (err) {
      next(err); 
    }
  
  });

 
 //Delete MY account
 router.delete(
  '/delete-account',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
     const userId = (req as any).user.userId;
     
     //Delete user and associated data 
     const deletedUser = await User.findByIdAndDelete(userId);
     await Event.deleteMany({creator: userId});

     if (!deletedUser) {
       res.status(404).json({message: "User not found"});
       return;
     }

     res.json({message: "Account deleted successfully!"});

    } catch (err) {
      next(err);
    }
 }); 


 //Scout professionals 
 router.get(
  '/scout',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
     const {professionType, city} = req.query; 
     
     const query: any = {
       role: "Artist",
       status: "Active" 
     };

     if (professionType) {
       query.professionType = professionType; 

     } else {
       query.professionType = {$ne: "None"};
     }

     const professionals = await User.find(query)
          .select("username email professionType city portfolio skills lookingForCollab avatar")
          .sort({createdAt: -1});

      res.json(professionals);     

    } catch (err) {
      console.error("Scout search error:", err);
      next(err);
    }
  });


export default router;
