import app from './app.js';
const PORT = process.env.PORT || 5001;
import connectionToDB from './DBconfig/dbConnection.js';
import cloudinary from 'cloudinary';
import Razorpay from "razorpay";

// cloudinary configuration
cloudinary.v2.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
});

//RazorPay configuration
 export const razorpay = new Razorpay({
   key_id : process.env.RAZORPAY_KEY_ID,
   key_secret: process.env.RAZORPAY_SECRET
}); 

app.listen(PORT , async()=>{
   await connectionToDB();   // ek baar server run karne sai phle check kr loo db connect hai ya nhi shi sai 
   console.log(`App is running at http:localhost:${PORT}`);
});








