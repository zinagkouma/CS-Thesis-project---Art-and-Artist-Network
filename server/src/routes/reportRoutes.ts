import {Router, Request, Response, NextFunction} from 'express';
import {verifyAdmin, verifyToken} from '../middleware/auth';

import Report from '../models/Report';



const router = Router();

//Make a new report
router.post(
 '/',
 verifyToken,
 async (req: Request, res: Response, next: NextFunction) => {
   try {
    const {reportedItem, reportedUser, itemType, reason, description} = req.body;

    if (!reportedItem || !reason || !itemType) {
      res.status(400).json({message: "Missing required fields"});
      return;  
    }

    const newReport = new Report ({
      reportedUser,
      reportedItem,
      itemType,
      reason,
      description  
    });

    await newReport.save();
    res.status(201).json({message: "Report submitted successfully!"});

   } catch (err) {
     next(err);
   }
 
});


//Get all reports (Admin only)
router.get(
 '/',
 verifyToken,
 verifyAdmin,
 async (req: Request, res: Response, next: NextFunction) => {
   try {
    const reports = await Report.find()
         .populate("reportedUser", "username email")
         .populate("reportedItem")  //Get the actual message or comment 
         .sort({createdAt: -1})

        res.json(reports); 

       } catch (err) {
         next(err);  
       }
    }); 


//Resolve or dismiss report
router.patch(
 '/:id/status',
 verifyToken,
 verifyAdmin,
 async (req: Request, res: Response, next: NextFunction) => {
   try {
    const {status} = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {status},
      {new: true}
    );

    res.json(report);

   } catch (err) {
     next(err); 
   }
 
  });    

  
export default router; 