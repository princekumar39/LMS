import Course from '../models/course.model.js';
import AppError from '../utils/error.util.js';
import cloudinary from 'cloudinary';
import fs from 'fs';
const getAllCourses = async function(req,res,next){

    try{
        const courses= await Course.find({}).select('-lectures');
        res.status(200).json({
          success:true,
          message:'All courses',
          courses,
        });
    }
    catch(err){
        return next(new AppError(err.message,500));
    }
}

const getLecturesByCourseId = async function(req,res,next){
    try{
        const {id}= req.params;
        const course = await Course.findById(id);

        if(!course){
            return next(new AppError('Invalid course Id',400));
        }
        res.status(200).json({
          success:true,
          message:'courses lectures fetched successfully',
          lectures:course.lectures,
        });
    }
    catch(err){
        return next(new AppError(err.message,500));
    }
}

const createCourse = async (req,res,next)=>{
   const {title,description,category,createdBy} = req.body;
   if(!title|| !description || !category || !createdBy){
     return next(new AppError('All fields are required',500));
   }

   const course = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail:{
            public_id:'dummy',
            secure_url:'dummy',
        }
   });
   if(!course){
      return next(new AppError('Course not created, please try again! ',500));
   }
   
   // for image , send it on cloudinary
   if(req.file){
    try{
       const result = await cloudinary.v2.uploader.upload(req.file.path , {
        folder:'lms', 
        width:250,
        height:250,
        gravity:'faces',   // gravity means kiss part par focus krni hai photo mai
        crop:'fill' // crop means pure size ko bharna hai .
        });

      if(result){
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }
      fs.rmSync(`uploads/${req.file.filename}`); //fs.rm is used to remove the file located in the uploads/ directory (where multer might have stored it temporarily). req.file.filename is the name of the uploaded file.
    }
    catch(err){
     return next(new AppError(err || 'file not uploaded,please try again' , 500));
    }
   }
   await course.save();

   res.status(200).json({
    success:true,
    message:"successfully created course",
    course
   });
}


const updateCourse = async(req,res,next)=>{
     try{
        const {id} = req.params;
        const course = await Course.findByIdAndUpdate(    //mongodb method for finding course by id and updating the course.
          id,                                             // it takes 2 parameter,1st is id and 2nd what you want to update.
          {
            $set : req.body // jo v body mai information/data milegi,usko sirf overwrite/update kr do
          },
          {
            runValidators: true, // it will validate , your data is similar to schema or not 
          }
        );
      
        // if there is no any course to update,which you are finding then simply push error.
        if(!course){
          return next(new AppError('Course doesnot exit',500));
        }

        res.status(200).json({
          success:true,
          message:'Course Updated successfully',
          course,
        })
     }
     catch(err){
      console.log(err);
      return next(new AppError('Course not upadated,please try again',500));
     }
}

const removeCourse = async(req,res,next)=>{
   try{
      const {id} =req.params;
      const course = await Course.findById(id);
      if(!course){
        return next(new AppError('Course doesnot exit',500));
      }

      await Course.findByIdAndDelete(id);
      res.send(200).json({
        success:true,
        message:"Course Deleted Successfully",
      });
      
   }
   catch(err){
    return next(new AppError(err.message,500));
   }
}

const addLectureToCourseById = async(req,res,next)=>{
  const {title,description,} = req.body;
  const {id}=req.params;
  if(!title,!description){
    return next(new AppError('All Fields Required',500));
  }

  const course = await Course.findById(id);
  if(!course){
    return next(new AppError('Course does not exist',500));
  }

  const lectureData = { 
    title,
    description,
    thumbnail:{
      public_id:'dummy',
      secure_url:'dummy',
    }
  };
    if(req.file){
          try{
            const result = await cloudinary.v2.uploader.upload(req.file.path , {
             folder:'lms', 
             width:250,
             height:250,
             gravity:'faces',   // gravity means kiss part par focus krni hai photo mai
             crop:'fill' // crop means pure size ko bharna hai .
             });
     
           if(result){
             lectureData.thumbnail.public_id = result.public_id;
             lectureData.thumbnail.secure_url = result.secure_url;
           }
           fs.rmSync(`uploads/${req.file.filename}`); //fs.rm is used to remove the file located in the uploads/ directory (where multer might have stored it temporarily). req.file.filename is the name of the uploaded file.
         }
         catch(err){
          return next(new AppError(err || 'file not uploaded,please try again' , 500));
         }
    }
      course.lectures.push(lectureData);
      course.numberOfLectures= course.lectures.length;
      await course.save();
      res.status(200).json({
        success:true,
        message:'Lectures Added successfully',
        course,
      });
}

const deleteLectureToCourseById = async(req,res,next)=>{
   try{
    const {id} = req.params; // it is lecture id
    const course = await Course.findOne({ "lectures._id": id });
    if(!course){
      return next(new AppError('course doesnt exist',500));
    }
    // Remove the lecture from the course
    const lectureIndex = course.lectures.findIndex((lec) => lec._id.toString() === id);
    if (lectureIndex === -1) {
      return next(new AppError("Lecture not found", 404));
    }
    course.lectures.splice(lectureIndex, 1);

    // Update the number of lectures
    course.numberOfLectures = course.lectures.length;

    await course.save();
    res.status(200).json({
      success:true,
      message:'Course deleted Successfully',
    });
   }
   catch(err){
     return next(new AppError(err.message,500));
   }
}

export {getAllCourses,getLecturesByCourseId,createCourse,updateCourse,removeCourse,addLectureToCourseById,deleteLectureToCourseById};