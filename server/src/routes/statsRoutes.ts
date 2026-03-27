import {Router, Request, Response, NextFunction} from 'express'; 
import { verifyToken } from '../middleware/auth';
import mongoose from 'mongoose';
import Follow from '../models/Follow';
import Event from '../models/Event'; 


const router = Router(); 

//Statistics regarding artist's follower growth and recent follower list 
router.get(
 '/followers',
 verifyToken,
 async(req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const userId = (req as any).user.userId; 
    
    const totalFollowers = await Follow.countDocuments({followed: userId}); 

    //Logic for "New this month"
    const now = new Date(); 
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    
    //Count new followers from this month and last month
    const newThisMonth = await Follow.countDocuments({
      followed: userId,
      createdAt: {$gte: firstDayCurrentMonth} 
    });

    const newLastMonth = await Follow.countDocuments({
      followed: userId,
      createdAt: {$gte: firstDayLastMonth, $lt: firstDayCurrentMonth}  
    });


    //Calculate growth rate (%)
    let growthRate = 0;

    if (newLastMonth > 0) {
      growthRate = ((newThisMonth - newLastMonth) / newLastMonth) * 100;

    } else if (newThisMonth > 0) {
      growthRate = 100; 
    }
 

    //Generate data for last 6 months  
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); 

    const monthlyData = await Follow.aggregate([
      {
        $match: {
          followed: new mongoose.Types.ObjectId(userId),
          createdAt: {$gte: sixMonthsAgo}
        }  
      },
      {
        $group: {
          _id: {
            month: {$month: "$createdAt"},
            year: {$year: "$createdAt"}
          },
          count: {$sum: 1}
        }
      },
      {$sort: { "_id.year": 1, "_id.month": 1 }}
    ]);


    //Making the final format for the chart 
    const chartData = [];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(); 
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;  //1-12
      const y = d.getFullYear();

      const found = monthlyData.find(item => item._id.month === m && item._id.year === y); 
      const count = found ? found.count : 0; 

      chartData.push({
        month: monthNames[m - 1],
        count: count
      });
    }


    //Join "Follow" and "User" collections to get follower's role 
    const audienceData = await Follow.aggregate([
      {$match: {followed: new mongoose.Types.ObjectId(userId)}},
      { $lookup: {
          from: "users",
          localField: "follower",
          foreignField: "_id",
          as: "followerInfo"
        }
      },
      {$unwind: "$followerInfo"},
      {
        $group: {
          _id: "$followerInfo.role", //Group by role
          count: {$sum: 1}
        }
      }
    ]);

    //Format audience data
    const breakdown = audienceData.map(item => ({
      name: item._id,
      value: item.count
    }));


    //Get 5 most recent followers 
    const recentList = await Follow.find({followed: userId})
          .sort({createdAt: -1})
          .limit(5)
          .populate("follower", "username role") //Fetch details from User model 

    const recentFollowers = recentList
    .filter((f: any) => f.follower !== null) //Skip deleted user records 
    .map((f: any) => ({
      _id: f.follower._id,
      username: f.follower.username,
      role: f.follower.role,
      date: f.createdAt
    }));

    res.json({
      total: totalFollowers,
      newThisMonth,
      growthRate: Math.round(growthRate),
      chartData,
      recentFollowers,
      breakdown
    });

   } catch (err)  {
     next(err);
   }
 });



//Statistics regarding events 
router.get(
 '/events',
 verifyToken,
 async(req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
    const userId = (req as any).user.userId;

    const sixMonthsAgo = new Date ();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); 

    const stats = await Event.aggregate([
      {
       //Get only events by this Artist
       $match: {
        creator: new mongoose.Types.ObjectId(userId)
       }
      },
      {
        $facet: {
          //Pipeline for published events's general stats 
          "generalStats": [
            {$match: {status: "published"}},
            {
              $project: {
                avgRating: 1,
                ratingCount: 1,
                attendeesCount: 1,

                //Revenue calculation
                effectivePrice: {
                  $cond: {
                    if: {$eq: ["$isFree", true]},
                    then: 0,
                    else: {
                      $cond: {
                        if: {
                          $and: [
                            {$gt: ["$priceMin", null]}, 
                            {$gt: ["$priceMax", null]}
                          ]
                        },
                        then: {$avg: ["$priceMin", "$priceMax"]},
                        else: {$ifNull: ["$price", 0]}
                      }
                    }
                  } 
                } 
              }   
            },
            {
              $group: {
                _id: null,
                averageRating: {$avg: "$avgRating"},
                totalRatingsCount: {$sum: "$ratingCount"},
                publishedEvents: {$sum: 1},
                totalAttendees: {$sum: "$attendeesCount"},
                avgAttendees: {$avg: "$attendeesCount"},
                totalRevenue: { 
                  $sum: {$multiply: ["$effectivePrice", "$attendeesCount"]} 
                }
              }
            }
          ],

          //Data for pie chart
          "statusBreakdown": [
            {
              $group: {
                _id: "$status",
                count: {$sum: 1}
              }
            }
          ],

          //Pipeline for monthly trend 
          "monthlyStats": [
            {
              $match: {
                status: "published",
                startDate: {$gte: sixMonthsAgo}
              }
            },
            {
              $group: {
                _id: {
                  month: {$month: "$startDate"},
                  year: {$year: "$startDate"}
                },
                totalAttendees: {$sum: "$attendeesCount"}
              }
            },
            {$sort: {"_id.year": 1, "_id.month": 1}}
          ]
        }
      },

       //Format the final result
      {
        $project: {
          generalStats: {$arrayElemAt: ["$generalStats", 0]},
          statusBreakdown: "$statusBreakdown",
          monthlyStats: "$monthlyStats"
        }
      }
    ]);

    
    const general = stats[0]?.generalStats || {
      averageRating: 0,
      totalRatingsCount: 0,
      publishedEvents: 0,
      totalAttendees: 0,
      avgAttendees: 0,
      totalRevenue: 0
    };

    const breakdownRaw = stats[0]?.statusBreakdown || []; 
    const formattedBreakdown = breakdownRaw.map((item: any) => ({
      
      name: item._id ? (item._id.charAt(0).toUpperCase() + item._id.slice(1)) : "Unknown",
      value: item.count
    }));

    //Process monthly data 
    const monthlyRaw = stats[0]?.monthlyStats || [];
    const chartData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1; 
      const y = d.getFullYear();

      const found = monthlyRaw.find((item: any) => item._id.month === m && item._id.year === y);

      chartData.push({
        month: monthNames[m - 1],
        count: found ? found.totalAttendees : 0
      });
    }

    //Make the combined response
    res.json({
      publishedEvents: general.publishedEvents || 0,
      averageRating: Number(general.averageRating?.toFixed(1)) || 0,
      totalRatingsCount: general.totalRatingsCount || 0,
      totalAttendees: general.totalAttendees || 0,
      avgAttendees: Math.ceil(general.avgAttendees || 0),
      totalRevenue: Number(general.totalRevenue?.toFixed(2)) || 0,
      statusBreakdown: formattedBreakdown,
      chartData
    });

   } catch (err) {
      console.error("Aggregation Error:", err);
      next(err);
   } 
 });
      
      
 export default router; 