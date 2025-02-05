import {Schema,model} from "mongoose";

const courseSchema = new Schema({
  title:{
    type:String,
    required:[true,'Title is required'],
    minLength:[5,'Title must be atleaset 5 character'],
    maxLength:[40,'Title must not be more than 40 character'],
  },
  description:{
    type:String,
    required:[true,'Description is required'],
    minLength:[8,'Description must be atleaset 8 character'],
    maxLength:[100,'Description must not be more than 100 character'],
  },
  Category:{
    type:String,
    reuired:[true,'category must required'],
  },
  thumbnail:{
    public_id:{type:String,required:true},
    secure_url:{type:String,required:true},
  },
  lectures:[
    {title: {type:String,required:true},
     description:{type:String,required:true},  
     thumbnail:{
        public_id:{type:String,required:true},
        secure_url:{type:String,required:true},
     }
    }
  ],
  numberOfLectures:{
    type:Number,
    default:0,
  },
  createdBy:{
    type:String,
    required:true
  }
},{
    timestamps:true,
});

const Course = model('Course',courseSchema);

export default Course;