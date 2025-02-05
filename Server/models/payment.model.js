import {Schema,model} from 'mongoose'

const paymentSchema = new Schema({
     razorpay_payment_id:{   // dont use hard code, because here using razorpay only, thats why "razor_payment_id" defined otherwise it should be payent_id only.
        type:String,
        required:true,
     },
     razorpay_subscription_id:{
        type:String,
        required:true,
     },
     razorpay_signature:{ // after payment, razorpay provide you "razorpay_signature", this help you to verify payment had been done or failed or cancelled.
        type:String,
        required:true,
     }
},{
    timestamps:true
});
//detail payment details of user will be available on razorpay site also, you need above above 3 things mainly for payment and verification on your site.
const payment = model('payment',paymentSchema);
export default payment;