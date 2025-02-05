import AppError from '../utils/error.util.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from 'cloudinary';
import fs from 'fs';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

//...................REGISTER ROUTE..................................
const register = async(req,res,next)=>{
    const {name,email,password} = req.body;     // post krne par sarri details body level par aati hai 
    
    if(!name || !email || !password){
        /*  return res.send(400).json({
                success:false,
                message:"all fields required"
             })  */                
        //  NOTE:- this uppar code we can write no doubt , but if user not filled any box ,then we only need to pass a message to user(so that they can fill all details). For that we will create a utility folder(utils). 
        // In that utils folder , we will write code and whenever this type of error part comes so, instead of writing again & again this uppar code we will simply called that utils folder code(function/class) .

        return next(new AppError('all fields are required',400));// so this is returning error in instance form,not in json and next error ko aage bhej dega (par kaha?)-->for that we will create a middleWare(and that middleware called in app.js after all the routes to show on website)
    }
   
    const userExists = await User.findOne({email}) ; // it will return t/f
     if(userExists){
        return next(new AppError('Email already Exits',400)); 
     }

     // We will not save user details directly, we will do it in 2 steps.
     //1step:- User ki basic details like name, email ye sb save kr doo 
     //2 step:- photo ye sb 3rd party sai lenge then save krenge 

     const user = await User.create({ // ye database mai save/create krne mai help krega(below is the formate)
        name,
        email,
        password,
        avatar:{
            public_id:email,
            secure_url:'https://lumiere-a.akamaihd.net/v1/images/avatar_800x1200_208c9665.jpeg?region=0%2C0%2C800%2C1200'  // dummy avatar image ,if user will not provide(It will as in binary data)
        },
     });
  
     if( !user ){   // If uppar code not able to save data.
        return next(new AppError('User Registration Failed,Please try again' , 400));
     }
     
     //Before saving the data, Image is in binary form so we have to convert that binary form image into real image and then we will stroe that in Database.
     // For changing image from binary to actual image we will use multer. And we will store it by 3rd party which is cloudinary.

    // TODO File Upload
      if(req.file){
        //we will use cloudinary which help to upload the picture.
        // for upload we use query below
        /* cloudinary.v2.uploader.upload("/home/my_image.jpg(this is the path of photo)", {upload_preset: "my_preset"} (preset means customization for photo), (error, result)=>{
        console.log(result, error);
        }); */
        try{
           
            // cloudinary use krne sai phle configuration set kro server file par
           const result = await cloudinary.v2.uploader.upload(req.file.path , {
               folder:'lms', 
               width:250,
               height:250,
               gravity:'faces',   // gravity means kiss part par focus krni hai photo mai
               crop:'fill' // crop means pure size ko bharna hai .
           });
             
                if(result){
                  user.avatar.public_id = result.public_id;
                  user.avatar.secure_url = result.secure_url;     // ab jo ki result mai photo aa gya too public_id and link ko replace kr doo orginal sai dummy hta kar before saving.  
               

                // local folder mai upload hai usko v htao 
                fs.rmSync(`uploads/${req.file.filename}`); //fs.rm is used to remove the file located in the uploads/ directory (where multer might have stored it temporarily). req.file.filename is the name of the uploaded file.
             }
               
        }
        catch(error){
              return next(new AppError(error || 'file not uploaded,please try again' , 500));
        }
      }

    // This token is setup here for a reason that if user has done signup, so user get automatically login.
    await user.save();
    user.password = undefined;
    // calling token , if you had registered then no need to login for 7 days
    const token = await user.generateJWTToken();
    const cookieOption = {
      maxAge:7*24*60*60*1000,  // 7 days
      httpOnly:true,
      secure:false,
    };
    res.cookie('token',token,cookieOption);
    res.status(201).json({
        success:true,
        message:"User registered Successfully",
        user,
    });
  };



//...........LOGIN ROUTES..................
const login = async(req,res,next)=>{

    try{
        const {email,password} = req.body;
        
        if( !email || !password ){
         return next(new AppError('All fields are required', 500));
        }
     
        const user = await User.findOne({
         email
        }).select('password email subscription role');
        
         if( !user || !(await bcrypt.compare(password,user.password)) ){
             return next(new AppError('Email or password doesnot match', 400));
         }
         user.password =undefined;

         const token = await user.generateJWTToken();
         const cookieOption = {
             maxAge:24*60*60*1000,  // 24 hrs
             httpOnly:true,
             secure:false,
           };
           console.log(cookieOption);
           res.cookie('token',token,cookieOption);
           
           res.status(200).json({
             success:true,
             message:"user login succesfull",
             user
           });
    }
    catch(err){
        return next(new AppError(err.message, 500));
    }
  
}


 //..................LOGOUT ROUTES................
const logout = (req,res,next)=>{
    res.cookie('token',null,{
        secure : true,
        maxAge:0,
        httpOnly:true
    });

    res.status(200).json({
        success:true,
        message:'User logged out successfully'
    })
}


 //..................GET PROFILE DETAIL ROUTES................
const getProfile = async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const user = await User.findOne(userId);

        res.status(200).json({
            success:true,
            message:'user details',
            user
        });
    }
    catch(err){
        return next(new AppError('failed to fetch profile data', 500));
  
    }
}


//..................FORGOT PASSWORD ROUTES................
const forgotPassword = async(req,res,next)=>{
   const {email} = req.body;

   if(!email){
    return next(new AppError('Email is required',400));
   }

   const user = await User.findOne({email});
   if(!user){
    return next(new AppError('Email is not registered',400));
   }
    
   const resetToken = await user.generatePasswordResetToken();
   console.log('User object before save:', user);
   await user.save();

   const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`; // frontend k URL//reset-password par click kre to link k sath token bhej do
   
   const subject = 'Reset Password';
   const message = `You can reset password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password </a> \n If above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.\n If you have not requested this,kindely ignore this.`;
 
   try{
       await sendEmail(email,subject,message); // this function call is being writen in utils file.

       res.status(200).json({
        success:true,
        message:`Reset password token has been sent to ${email} successfully`
       });
   }
   catch(err){
    //if due to any region mail not sent correctly then forgotPasswordExpiry and forgotPasswordToken undefined kr do jo bnaye thai pr tb error dikhao
    user.forgotPasswordExpiry =undefined;
    user.forgotPasswordToken = undefined;
    await user.save();

    return next(new AppError(err.message, 500));
   }
}



//..................RESET PASSWRORD ROUTES................
const resetPassword = async(req,res,next)=>{  // data is coming in params form,params" typically refer to parameters that are part of the URL or the query string of a request
       const {resetToken} = req.params; // we are using query params which is encoded, to decode it write app.use(express.urlencoded({extended:true}))
       const {password} = req.body;  // password will enter by user in body.

       const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

       //to check token has been send through email exist in database or not
       const user = await User.findOne({
          forgotPasswordToken,
          forgotPasswordExpiry:{$gt:Date.now()}  //checking exist kar rha token too expire too nhi hua
       });

       if(!user){
          return next(new AppError('Token is expired, please try again',400));
       }

       // if everything is alright then replace previous password with new password
       user.password = password;
       user.forgotPasswordToken = undefined;
       user.forgotPasswordExpiry = undefined;  // kaam ho gya to token ko hta do
       user.save();

       res.status(200).json({
        success:true,
        message:'Password change successfully',
       })
}



//.................for changing the Password, if you know already your password.................
const changePassword = async(req,res,next)=>{
     const {oldPassword,newPassword} = req.body;
     const {id} = req.user;

     if(!oldPassword || !newPassword){
        return next(new AppError('All fileds required',400));
     }

     const user = await User.findOne(id).select('+password');

     if(!user){
        return next(new AppError('User does not Exist',400));
     }
     const isPasswordValid = await user.comparePassword(oldPassword);
     if(!isPasswordValid){
        return next(new AppError('Invalid old password',400));
     }

     user.password = newPassword;
     await user.save();
     user.password =undefined;
     res.status(200).json({
        success:true,
        message:'password change successfully'
     });
}


const updateUser = async (req,res,next)=>{
   const {fullName} = req.body;
   const {id} = req.user.id;

  const user = await User.findById(id);
  if(!user){
     return next(new AppError('User does not exits'),400);
  }

  if(req.fullName){
    user.name = fullName;
  }

  if(req.file){
    await  cloudinary.v2.uploader.destroy(user.avatar.public_id); // destroy the previous photo
    try{
           
        // cloudinary use krne sai phle configuration set kro server file par
       const result = await cloudinary.v2.uploader.upload(req.file.path , {
           folder:'lms', 
           width:250,
           height:250,
           gravity:'faces',   // gravity means kiss part par focus krni hai photo mai
           crop:'fill' // crop means pure size ko bharna hai .
       });
         
            if(result){
              user.avatar.public_id = result.public_id;
              user.avatar.secure_url = result.secure_url;     // ab jo ki result mai photo aa gya too public_id and link ko replace kr doo orginal sai dummy hta kar before saving.  
           

            // website par v dummy upload hai usko v htao 
            fs.rmSync(`uploads/${req.file.filename}`); //fs.rm is used to remove the file located in the uploads/ directory (where multer might have stored it temporarily). req.file.filename is the name of the uploaded file.
         }
           
    }
    catch(error){
          return next(new AppError(error || 'file not uploaded,please try again' , 500));
    }
  }

   await user.save();
   res.status(200).json({
    success:true,
    message:'successfully updated details!',
   })
}

export{register,login,logout,getProfile,forgotPassword,resetPassword,changePassword,updateUser};