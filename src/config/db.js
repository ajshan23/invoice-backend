import mongoose from "mongoose";

export const connectDB = async () => {
    try {
      await mongoose.connect("mongodb://localhost:27017/pdf-app");
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1); // Exit the process with a failure code
    }
  };
  