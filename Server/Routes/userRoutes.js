import {Router} from "express";
const router = Router(); //instance of router

// importing all controller from controller folder
import {register,login,logout,getProfile,forgotPassword,resetPassword,changePassword,updateUser} from '../controller/user.controller.js';
import {isLoggedIn} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";



router.post('/register', upload.single("avatar"),register);  //avatar name sai jo data aata hai binary form mai usko change kro by middleware function,wha sai file millega as a request. controller mai ja kar "todo code" likho
router.post('/login', login);
router.get('/logout', logout);
router.get('/me',isLoggedIn, getProfile);
router.post('/forgot-password',forgotPassword);
router.post('/reset/:resetToken',resetPassword);
router.post('/change-password',isLoggedIn,changePassword);
router.put('/update',isLoggedIn,upload.single("avatar"),updateUser);



export default router;