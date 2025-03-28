import express from "express";
import dotenv from "dotenv"
import connectDb from "./database/db.js";



const app = express();

dotenv.config();

connectDb();


const PORT = process.env.PORT; 


app.get("/",(req,res)=>{
    res.send("Server is running ")
})

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
