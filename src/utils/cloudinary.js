import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath ,{
            resource_type: 'auto'
        })
        //file has been uploaded successfully
        console.log("file has been uploaded successfully", response.url);
        fs.unlinkSync(localFilePath)
        console.log("file has been removed successfully from local system");
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload operation got failed  
         
        // console.error("❌ Cloudinary upload failed:", error.message);

        // // Remove local file if upload fails
        // try {
        //     if (fs.existsSync(localFilePath)) {
        //         fs.unlinkSync(localFilePath);
        //         console.log("🗑️ Local file deleted after failed upload.");
        //     }
        // } catch (unlinkError) {
        //     console.error("⚠️ Failed to delete local file:", unlinkError.message);
        // }

        // return null;    
    }
}

export { uploadOnCloudinary }