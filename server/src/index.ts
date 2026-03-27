import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv'; 
import path from 'path'; 

import {trackActivity} from './middleware/activityTracker';


dotenv.config(); 

console.log('Loaded ENV:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? '••••••••' : null
});


import taskRoutes from './routes/taskRoutes';
import userRoutes from './routes/userRoutes';
import contactRoutes from './routes/contactRoutes'; 
import eventRoutes from './routes/eventRoutes'; 
import uploadRoutes, {uploadDir} from './routes/uploadRoutes'; 
import statsRoutes from './routes/statsRoutes'; 
import friendRoutes from './routes/friendRoutes'; 
import chatRoutes from './routes/chatRoutes'; 
import reportRoutes from './routes/reportRoutes'; 
import venueRoutes from './routes/venueRoutes';
import notificationRoutes from './routes/notificationRoutes'; 


const app = express();
app.use(cors());
app.use(express.json());
app.use(trackActivity); 


mongoose.connect(process.env.MONGO_URI!)
  .then(() => 
    console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));


  const rootUploadPath = path.join(__dirname, '../uploads');


  app.use('/uploads', express.static(rootUploadPath));

  app.use('/api/tasks', taskRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/stats', statsRoutes);  
  app.use('/api/friends', friendRoutes);
  app.use('/api/chat', chatRoutes); 
  app.use('/api/reports', reportRoutes); 
  app.use('/api/venues', venueRoutes);
  app.use('/api/notifications', notificationRoutes);
  

  app.use(trackActivity); 

  enum EnvPort { DEFAULT = 5000 }
  const PORT = process.env.PORT ?? EnvPort.DEFAULT;
  app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
  

