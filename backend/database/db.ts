import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGOURI; 

const connectDb = async () => {
  try {
    if (!uri) {
      throw new Error("❌ MONGOURI is not defined in .env file");
    }

    await mongoose.connect(uri);

    console.log("🟢 Database connected successfully");
  } catch (error) {
    console.error("🔴 MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDb;
