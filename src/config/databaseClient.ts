// mongodb db connection
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const DBClient = () => {
  const mongUrl = process.env.MONGO_URL || "";
  return mongoose.connect(mongUrl).then(() => {
    console.log("MongoDB connected");
  }).catch((err) => {
    console.log(err);
  });
}