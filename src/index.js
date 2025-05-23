import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log(error);
        throw error
    })
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running on ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGODB connection Failed" ,err)
})



//ifies immediately run the code 
// ;( async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        // app.on("error",(error)=>{
        //     console.log(error);
        //     throw error
        // })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is running on port ${process.env.PORT}`);
//         })
//     }
//     catch (error){
//         console.log(error);
//         throw error
//     }
// } )
