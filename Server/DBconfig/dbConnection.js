import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoose_URI = process.env.mongoose_URI;
mongoose.set('strictQuery',false); // This lines means if user want data and data is not present inside the database-->dont show error by restriction just ignore

const connectionToDB = async ()=>{
    try{
      const connection = await mongoose.connect(mongoose_URI);
      if(connection){
        console.log(`Database is connected on ${connection.connection.host}`);
      }     
    }
    catch(err){
       console.log(err);
       process.exit(1);  // If database is not connected then terminate the server and all thing because nothing will be happend on site EX:- Login , signup etc. 
    } 
}

export default connectionToDB;