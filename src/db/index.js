import { DB_NAME } from '../constants.js'
import mongoose from 'mongoose'

//connect to the database
const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error('Error connecting to the database:', error)
        process.exit(1) // Exit the process with failure
    }
}

export default connectDB