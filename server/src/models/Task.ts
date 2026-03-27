import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: String,
  completed: Boolean,
});

export default mongoose.model('Task', TaskSchema);
