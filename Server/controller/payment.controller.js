import payment from '../models/payment.model.js';
import User from '../models/user.model.js';
import { razorpay } from '../server.js';
import AppError from '../utils/error.util.js';

const getRazorpayApiKey = async(req,res,next)=>{
    res.status(200).json({
        success:true,
        message:'RazorPay API Key, Key sent sucessfully',
        key:process.env.RAZORPAY_KEY_ID,
    });
};

const buySubscription = async (req,res,next)=>{
    try{
      const {id} = req.user; // user already login hoga then uska id mill skta hai 
      const user = await User.findById(id);
      if(!user){
          return next(new AppError('Unauthorized to buy this subscription',500));
      }
  
      if(user.role === 'ADMIN'){ // no need to take subscription for ADMIN
         return next(new AppError('Admin can not purchase the course',401));
      }
  
      // if not admin
      const subscription = await razorpay.subscriptions.create({ // razorpay mai subscription hai usko create kro, it is method of razorpay
          plan_id:process.env.RAZORPAY_PLAN_ID,
          customer_notify: 1, // customer ko notify kr doo, 1 for true... so that in next step user will do payment.
          total_count: 1
      });
      // NOTE:- this "subscription" variable contains object with values {id,status,plan_id,customer_id etc}--->pass by razorpay
      // User schema model mai subscription and status hai usme set kro  
      user.subscription.id = subscription.id;
      user.subscription.status = subscription.status;
      await user.save();
  
      res.status(200).json({
        success:true,
        message:'subscription initiated successfully',
        subscription_id : subscription.id   // no need to pass whole user just pass subscription id stored in user_model. subscription_id-->it is only veriable which stores subscription id.
      });
    }
    catch(err){
      console.log(err);
      return next(new AppError(err.message||'Subscription initiated Failed',500));
    }
};


//when user do payment, from client side you will get 3 things in API payload
//1)razorpay_payment_ID  2)razorpay_signature   3)razorpay_subscription_id
const verifySubscription = async (req,res,next)=>{
   try{
        const {id} = req.user;  
        const {razorpay_payment_id,razorpay_signature,razorpay_subscription_id} = req.body;
        // What is the difference between req.user and req.body?
        // req.user:- 1)This happens after the user successfully logs in and their session or token is validated
        //            2)It contains information about the currently logged-in user {like user id, email,role}
        //req.body:-  1)used when a user submits data via a form or API call, often in POST, PUT, or PATCH requests
        //            2)req.body is used to access form data or API payload data sent by the client.
    
        const user = await User.findById(id);
        if(!user){
        return next(new AppError('Unauthorized to buy this subscription',500));
        }
    
        const subscriptionId = user.subscription.id;
        //we will generate own signature and will match with payload comming signature from client. If both matches then payment is done otherwise not.
        const generatedSignature = crypto
        .createHmac('sha256',process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id} | ${subscriptionId}`)
        .digest('hex');
    
        if(generatedSignature !== razorpay_signature){
        return next(new AppError('Payment not verified, please try again',500));  
        }
    
        await payment.create({
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature
        });
        user.subscription.status = 'Active'  //at time of buySubscription, razorpay will set status= created , but payment is verified not then mark that as Active
        await user.save();
        // await payment.save(); <--this is no need to do because .create method will create as well as save the data.You can use this if you made changes.
    
        res.status(200).json({
            success:true,
            message:'payment created and verified sucessfully!',
        })
     }
   catch(err){
    return next(new AppError('An unexpected error occurred', 500));
   }
};


const cancleSubscription = async (req,res,next)=>{
 try{
  // it only required subscription id.
  const {id} = req.user;
  const  user = await User.findById(id);
  if(!user){
    return next(new AppError('Unauthorized: Please log in again.',500));
  };
  if(user.role === 'ADMIN'){
    return next(new AppError('Admins are not allowed to cancel subscriptions.',500));
  }

  const subscriptionId = user.subscription.id;
  if (!subscriptionId) {
    return next(new AppError('No active subscription found to cancel.', 400));
  }
  const subscription = await razorpay.subscriptions.cancel(subscriptionId);//to delete subscription id
  //now subscription will contain object in which status= cancle,so set it as same in user model 
  user.subscription.status = subscription.status;
  await user.save();

  res.status(200).json({
    success:true,
    message:'subscription canceled successfully',
    subscription: {
        id: subscriptionId,
        status: subscription.status,
      }
  });
 }
 catch(err){
    return next(new AppError('An unexpected error occurred while canceling the subscription.',500));
 }
};

const allPayment = async (req,res,next)=>{
  try{
    const razorpayPayments = await razorpay.payments.all();//fetch payment details from razorpay
    const dbPayments = await PaymentModel.find();

    //combine the data
    const allPayments = {
      razorpayPayments:razorpayPayments.items, // Assuming items contains payment data
      dbPayments
    }

    //return status and combined data
    res.status(200).json({
      success:true,
      message:'Fetched all payments successfully',
      data:allPayments
    });

  }
  catch(err){
     return next(new AppError(err.message,500));
  }
};

export {getRazorpayApiKey,buySubscription,verifySubscription,cancleSubscription,allPayment};