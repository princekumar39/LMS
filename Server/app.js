import express from 'express';
const app = express();  // making an instance.
app.use(express.json());//--->this used to convert all data into js before sending it to req.body
//get config of .env file, so that you can use each and every data of env like port without error.
import userRoutes from './Routes/userRoutes.js';
import errorMiddleware from './middlewares/err.middleware.js';
import courseRoutes from './Routes/course.routes.js';
import paymentRoutes from './Routes/payment.routes.js';
import {config} from 'dotenv';
config();

// To decode query params
app.use(express.urlencoded({extended:true}));

//defining and running cookie-parser.
import cookieParser from 'cookie-parser';
app.use(cookieParser());  //extract cookie data from HTTP requests.




// using morgon for locking purpose for different link,whatever link is used by user it will show result in your terminal 
import morgan from 'morgan';
app.use(morgan('dev'));



// Using cors for cross authentication.
import cors from 'cors';
app.use(cors({
    origin:[process.env.FRONTEND_URL],
    credentials:true
}));




// importing the routers
app.use('/api/v1/user',userRoutes);
app.use('/api/v1/courses',courseRoutes);
app.use('/api/v1/payments',paymentRoutes);
app.all('*',(req,res)=>{     // koi v valid routes user na daale too ye bala chalega code.
    res.status(404).send('OOPS!! 404 ERROR , Pgae Not Found');
});

// If in app.js routes , some error occurs then this below middleware helps to show error.
app.use(errorMiddleware);





export default app;