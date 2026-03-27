import {Router, RequestHandler, NextFunction} from 'express';
import Event from '../models/Event';
import User from '../models/User';
import Comment from '../models/Comment';
import Follow from '../models/Follow';
import {verifyToken} from '../middleware/auth';
import jwt from 'jsonwebtoken';
import {sendEmail} from '../utils/sendEmail';
import { sendInAppNotification } from '../utils/sendNotification';



const router = Router();

type Role = 'User' | 'Artist' | 'Admin';

interface reqUser {  
 userId: string; 
 role: Role;
}


//Only Artists can perform CRUD operations
const verifyArtist: RequestHandler = (req, res, next) => { 
   const user = (req as any).user as reqUser | undefined;
   
   if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
   }
   if (user.role === 'Artist'){
      next();
      return
   }

   res.status(403).json({ message: 'Only Artists can perform this action!' });
}


//Create Event
router.post('/', verifyToken, verifyArtist, async (req, res, next) => {
     try{
        const user = (req as any).user as reqUser;
        const {
          title,
          description,
          category,
          tags,
          coverImageURL,
          gallery,

          startDate,
          endDate,
          startTime,
          venueName,
          city,
          address,

          location,

          isFree,
          price,
          priceMin,
          priceMax,

          status,

         } = req.body as {
            title: string;
            description: string;
            category: string;
            tags?: string[];
            coverImageURL: string;
            gallery?: string[];

            startDate: Date | string;
            endDate?: Date | string;
            startTime: string;
            venueName: string;
            city: string;
            address: string;

            location: {type: "Point"; coordinates: [number, number]};

            isFree: boolean;
            price?: number | string;
            priceMin?: number | string;
            priceMax?: number | string; 
         
            status: "draft" | "published";
        };

        const finalIsFree = !!isFree; 
        let finalPrice: number | undefined = undefined;
        let finalPriceMin: number | undefined = undefined;
        let finalPriceMax: number | undefined = undefined;

        if (!finalIsFree) {
          const hasRange =
           priceMin !== undefined &&
           priceMax !== undefined &&
           priceMin !== "" &&
           priceMax !== "";

        if (hasRange) {
          finalPrice = finalPriceMin;
          finalPriceMin = Number(priceMin);
          finalPriceMax = Number(priceMax);

        } else if (price !== undefined && price !== "") {
          finalPrice = Number(price);
        } 
      }


      const event = new Event ({
        title: title?.trim(),
        description: description?.trim(),
        category: category?.trim(),
        tags,
        coverImageURL,
        gallery,

        startDate,
        endDate: endDate || undefined,
        startTime,
        venueName: venueName || undefined,
        city: city?.trim(),
        address: address?.trim(),

        location,

        isFree: finalIsFree,
        price: finalPrice,
        priceMin: finalPriceMin,
        priceMax: finalPriceMax,
        

        status: status || "draft",
        creator: user.userId, 
      });

      //validation for range price
      if (!event.isFree && event.priceMin != null && event.priceMax != null) {
         if (event.priceMin > event.priceMax) {
            res
              .status(400)
              .json({message: "min price cannot be greater than max price!"});
              return;
         }
      }

       await event.save();

       //Send notification email to followers
       if (event.status === "published") {
         const artist = await User.findById(user.userId);
         const follows = await Follow.find({followed: user.userId}).populate("follower");

         for (const followDoc of follows) {
            const followerUser = followDoc.follower as any;
            if (followerUser && followerUser.emailNotifications) {
              await sendEmail(
                followerUser.email,
                `New Event by ${artist?.username}!`,
                `${artist?.username} just published a new event: "${event.title}".\n\nCheck it out on Event Finder!`
              ); 
            }

            //In-app notification
            if (followerUser && followerUser.inAppNotifications) {
              await sendInAppNotification(
                followerUser._id.toString(),
                user.userId,
                "event_published",
                `${artist?.username} published a new event: "${event.title}".`,
                event.id    
              ); 
            }

         }
       }

       res.status(201).json(event);

      } catch(err) {
         next(err);
      };

});




//List of events with optional filters
router.get('/', async (req, res, next) => {
     try {
      const {q, category, city, status, from, to, filter} = req.query as {
         q?: string;
         category?: string;
         city?: string;
         status?: "draft" | "published";
         from?: string;
         to?: string;
         filter?: string;
      };

      const query: any = {};

      //Only published events are visible by default
    

      if (category) query.category = category; 
      if (city) query.city = city; 

      if (from || to){
         query.startDate = {};
         if (from) query.startDate.$gte = new Date(from);
         if (to) query.startDate.$lte = new Date(to);
      }


      //filter for 'My Events'
      if (filter === 'mine') {
         //Extract token from header
         const authHeader = req.header("Authorization");
         const token = authHeader && authHeader.split(' ')[1];

         if (!token) {
            res.json([]);
            return;
         }

         try {
           //Verify token to get user ID
           const verified = jwt.verify(token, process.env.JWT_SECRET as string) as reqUser;
           query.creator = verified.userId; 

           query.status = status ?? "published";
         } catch (err) {
            res.status(401).json({message: "Invalid token"});
            return;
         }
 
      } else {
        query.status = "published";  
      }

      if (q) query.$text = {$search: q};

      const events = await Event.find(query)
        .sort({startDate: 1})
        .populate({
           path: "creator",
           select: "username role status",
           match: {status: "Active"}
        });   

      const visibleEvents = events.filter(event => event.creator !== null);  
      res.json(visibleEvents);
 
     } catch (err) {
       next(err); 
     }
  });


//Get trending events 
  router.get(
   '/trending',
   async (req, res, next) => {
    try {
     const events = await Event.find({status: "published"}) 
          .sort({avgRating: -1, ratingCount: -1}) //Sort by rating, then by rating count
          .limit(4)
          .select("title coverImageURL avgRating startDate");
         
     res.json(events);

    } catch (err) {
      next(err); 
    }

   });




//Get event by ID
router.get('/:id', verifyToken as RequestHandler, async (req, res, next) => {
     try {
      const user = (req as any).user as reqUser | undefined;
      const event = await Event.findById(req.params.id).populate("creator", "username role");

      if (!event) {
         res.status(404).json({ message: 'Event not found' });
         return;
     }

     if (event.status !== 'published') {
        if (!user){
           res.status(403).json({ message: 'Unauthorized' });
           return;
        }

        //Get the string ID out of the populated object
        const creatorId = (event.creator as any)._id.toString(); 
        const isOwner = creatorId === user.userId; 

        const isAdmin = user.role === 'Admin';

        if (!isOwner && !isAdmin) {
           res.status(403).json({ message: 'Unauthorized' });
           return;
        }
     }
   
     res.json(event);
   } catch (err) {
     next(err);
   }
});



//Event rating
router.post('/:id/rate', verifyToken, async (req, res, next) => {
     try{
      const {rating} = req.body as {rating: 1 | 2 | 3 | 4 | 5};
      
      if (!rating || rating < 1 || rating > 5) {
         res.status(400).json({message: "Rating must be 1-5"});
         return; 
      }

      const event = await Event.findById(req.params.id);

      if (!event) {
         res.status(404).json({message: "Event not found"});
         return; 
      }

      //Increment the count for this specific star 
      event.ratingDist[rating] = (event.ratingDist[rating] || 0) + 1; 

      //Increment total count 
      event.ratingCount = (event.ratingCount || 0) + 1; 

      //Weighted rating calculation 
      const totalPoints = 
       (5 * event.ratingDist[5]) +
       (4 * event.ratingDist[4]) +
       (3 * event.ratingDist[3]) +
       (2 * event.ratingDist[2]) +
       (1 * event.ratingDist[1]);

      event.avgRating = totalPoints / event.ratingCount;
   
      await event.save(); 

      res.json({
        avgRating: event.avgRating,
        ratingCount: event.ratingCount,
        ratingDist: event.ratingDist  //Useful for charts 
      })

     } catch (err) {
       next(err);

     }
});



//Update event (creator only)
router.put('/:id', verifyToken, verifyArtist, async (req, res, next) => {
     try{
      const user = (req as any).user as reqUser;
      const event = await Event.findById(req.params.id);

      if (!event){
         res.status(404).json({message: 'Event not found'});
         return;
      }

      const isOwner = String(event.creator) === user.userId; 

      if (!isOwner){
         res.status(403)
            .json({message: 'Only the creator can update this event'});
         return;
      }

      const {
        isFree,
        price,
        priceMin,
        priceMax, 
        status,
        creator
      } = req.body as {
         isFree: boolean;
         price?: number | string;
         priceMin?: number | string;
         priceMax?: number | string; 
         status: string; 
         creator: string;

         [key: string]: any;
      }


      //Assign the fields that exist in the schema
      const allowed = [
      "title","description","category","tags","coverImageURL","gallery",
      "startDate","endDate","startTime","timezone","venueName","city","address",
      "location","isFree","price","status"
      ] as const;

      for (const k of allowed){
         if (k in req.body) (event as any)[k] = (req.body as any)[k];
      }


      //Price logic for update 
      if (typeof isFree === "boolean") {
         event.isFree = isFree;
      }

      if (event.isFree) {
         event.price = undefined; 
         event.priceMin = undefined;
         event.priceMax = undefined;
      } else {
         const hasRange = 
          priceMin !== undefined &&
          priceMax !== undefined &&
          priceMin !== "" &&
          priceMax !== "";
      

      if (hasRange) {
        const pMin = Number(priceMin);
        const pMax = Number(priceMax);

        event.priceMin = pMin;
        event.priceMax = pMax; 
        event.price = pMin; 


      } else if (price !== undefined && price !== ""){
         event.price = Number(price);
         event.priceMin = undefined; 
         event.priceMax = undefined;     
      } 
    }

    
      //validation for range price
      if (!event.isFree && event.priceMin != null && event.priceMax != null) {
         if (event.priceMin > event.priceMax) {
            res
              .status(400)
              .json({message: "min price cannot be greater than max price!"});
              return;
         }
      }


      await event.save();
      res.json(event);

     } catch(err) {
       next(err);
     }
  });



//Publish or cancel event (creator only)
router.patch('/:id/status', verifyToken, verifyArtist, async(req, res, next) => {
  try{
   const user = (req as any).user as reqUser; 
   const {status} = req.body as {
    status: 'draft' | 'published'; 
   };

   if (!status) {
      res.status(400).json({message: 'Status is required'});
      return;
   } 

   const event = await Event.findById(req.params.id); 
   if (!event){
      res.status(404).json({message: 'Event not found'});
      return;
   }

   const isOwner = String(event.creator) === user.userId; 
   if (!isOwner){
      res.status(403).json({message: 'Only the creator can change the status'});
      return;
   }

     event.status = status; 
     await event.save();
     res.json({id: event._id, status: event.status});

    } catch(err) {
      next(err); 
    }
  });
   
    
//Join event 
router.post('/:id/join', verifyToken, async (req, res, next) => {
  try {
   const event = await Event.findById(req.params.id);

   if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;  
   }

   event.attendeesCount += 1;
   await event.save();

   res.json({
     message: "You have joined the event!",
     attendeesCount: event.attendeesCount 
   });

  } catch (err) {
    next(err);
  }
});


//Get comments for an event
router.get('/:id/comments',async (req, res, next) => {
  try {
   const comments = await Comment.find({event: req.params.id})
        .populate("user", "username _id avatar role")
        .sort({createdAt: -1}); 
        
     res.json(comments);  
  } catch (err) {
    next(err);
  }
}); 


//Post a new comment
router.post('/:id/comments', verifyToken, async (req, res, next) => {
  try {
   const user = (req as any).user; 
   const {text} = req.body;

   if (!text) {
     res.status(400).json({message: "Comment cannot be empty"});
     return;  
   }

   const comment = new Comment({
     text,
     user: user.userId,
     event: req.params.id
   });

   await comment.save();

   await comment.populate("user", "username _id avatar role");
   res.status(201).json(comment); 

  } catch (err) {
    next(err);
  }
});  


//Delete event (creator and admin only)  
router.delete('/:id', verifyToken, async (req, res, next) => {
     try{
      const user = (req as any).user as reqUser; 
      const event = await Event.findById(req.params.id); 

      if (!event){
         res.status(404).json({message: 'Event not found'});
         return; 
      }

      const isOwner = String(event.creator) === user.userId; 
      const isAdmin = user.role === 'Admin';  

      if (!isOwner && !isAdmin){
         res.status(403).json({message: 'Events can be deleted only by their creators or the Admin'})
      }

      await event.deleteOne(); 
      res.json({id: req.params.id, deleted: true}); 

     } catch(err) {
       next(err); 
     }
  });

  

  export default router; 