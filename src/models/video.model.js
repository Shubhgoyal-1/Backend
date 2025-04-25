import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoScehma = new mongoose.Schema({
    videoFile:{
        type:String, //cloudinary url
        required:true
    },
    thumbnail: {
        type:String,
        required:true
    },
    title: {
        type:String,
        required:true
    },
    description: {
        type:String,
        required:true
    },
    duration: {
        type:Number, //cloudinary url
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished: {
        type:Boolean,
        default:false
    },
    owner:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }
},{
    timestamps: true
})

videoScehma.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video',videoScehma)