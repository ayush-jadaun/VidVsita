import express from "express";
import dotenv from "dotenv"
import connectDb from "./database/db.js";
import authRoutes from "./routes/auth.routes.js"
import cookieParser from "cookie-parser";




const app = express();

dotenv.config();

connectDb();


const PORT = process.env.PORT; 

app.use(express.json());
app.use(cookieParser()); // Add this before your routes


app.get("/",(req,res)=>{
    res.send("Server is running ")
})

app.use("/api",authRoutes)

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
