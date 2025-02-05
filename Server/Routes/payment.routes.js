import { Router } from "express";
import { getRazorpayApiKey,buySubscription,verifySubscription,cancleSubscription,allPayment } from "../controller/payment.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { userAuthorizedRole } from "../middlewares/auth.middleware.js";
const router = Router();

router
      .route('/razorpay-key')
      .get(isLoggedIn,getRazorpayApiKey);

router 
      .route('/subscribe')
      .post(isLoggedIn,buySubscription);

router 
      .route('/verify')
      .post(isLoggedIn,verifySubscription);

router 
      .route('/unsubscribe')
      .post(isLoggedIn,cancleSubscription);

router
      .route('/')
      .get(isLoggedIn,userAuthorizedRole('ADMIN'),allPayment);

export default router;