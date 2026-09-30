require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"])
const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const app = express()
dotenv.config()

app.use(express.json())

const UserRouter = require("./routers/user.routes")
const connectDB = require("./api/database/connectDB")
app.use("/api/v1", UserRouter)

// MongoDB connection
const URI= process.env.DB_URI
mongoose.connect(URI)
.then(()=>{
    console.log("MongoDB connected successfully");
    
})
.catch((err)=>{
    console.log(err, "cannot connect to MongoDB");  
})






















//creating and starting our server
const PORT =process.env.PORT
app.listen(PORT, (err)=>{

    if(err){
        console.log(err);
        console.log("cannot start server at this time");
        
        
    }else{
        console.log(`server started on port ${PORT}`);
        
    }
})

module.exports=async(req, res)=>{
    await connectDB()

    return app (req, res)
}