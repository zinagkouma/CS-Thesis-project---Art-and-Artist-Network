import {Router, RequestHandler} from "express";
import {verifyToken} from "../middleware/auth";

import Venue from "../models/Venue";



const router = Router();


//Ensure only Artists can scout for venues
const verifyArtist: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({message: "Unauthorized"});
    return;
  }

  if (user.role === "Artist" || user.role === "Admin") {
    next();
    return; 
  }

  res.status(403).json({message: "Only Artists can scout venues!"});
};


//Create venue (Admin only)
router.post(
 '/add',
 verifyToken,
 async (req, res, next) => {
   try {
    const user = (req as any).user;

    if (user.role !== "Admin") {
      res.status(403).json({message: "Only Admins can create venues"});
      return;  
    }

    const {
      name,
      description,
      venueType,
      city,
      address,
      location,
      capacity,
      contactNumber,
      image,
      gallery
    } = req.body;

    if (!name || !venueType || !city || !address || !contactNumber) {
      res.status(400).json({message: "Missing required basic fields"});
      return;
    }
   
    if (gallery && gallery.length > 3) {
      res.status(400).json({message: "Gallery cannot exceed 3 images"});
      return; 
    }

    const newVenue = new Venue({
      name,
      description,
      venueType,
      city,
      address,
      location,
      capacity,
      contactNumber,
      image,
      gallery
    });

    await newVenue.save();
    res.status(201).json(newVenue); 

   } catch (err) {
     next(err); 
   }
 }); 


//Search for venues
router.get(
 '/scout',
 verifyToken,
 verifyArtist,
 async (req, res, next) => {
   try {
    const {city, venueType, minCapacity} = req.query;
    const query: any = {}; 

    if (city) query.city = {$regex: new RegExp(`^${city}$`, 'i')};
    if (venueType) query.venueType = venueType; 
    if (minCapacity) query.capacity = {$gte: Number(minCapacity)};

    const venues = await Venue.find(query).sort({name: 1});
    res.json(venues);

   } catch (err) {
     next(err); 
   }
 
}); 


//Get a venue by ID 
router.get(
 '/:id',
 verifyToken,
 verifyArtist,
 async (req, res, next) => {
   try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      res.status(404).json({message: "Venue not found"});
      return; 
    }

    res.json(venue);

   } catch (err) {
     console.error("Error fetching venue details:", err);
     next(err);
   }
 
 });

 
export default router;