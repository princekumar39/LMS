import jwt  from "jsonwebtoken";
import AppError from "../utils/error.util.js";

const isLoggedIn = async (req, res, next) => {
    try {
        const  token = req.cookies.token;
        if (!token) {
            return next(new AppError('Unauthenticated, please login again', 401));
        }

        const userDetails = jwt.verify(token, process.env.JWT_SECRET); // to decode the token and value of token will get stored in userdetails.
        req.user = userDetails;
        next();
    } catch (err) {
        return next(new AppError('Invalid or expired token, please login again', 401));
    }
}

// const userAuthorizedRole = (...roles)=>async(req,res,next)=>{
//    const currentUserRole = req.user.roles;
//    if(!roles.includes(currentUserRole)){
//      return next(new AppError('Not Authorized to do',403));
//     }
//    next();
// }

function userAuthorizedRole(requiredRole) {
    return (req, res, next) => {
        const currentRole = req.user.role; // Assuming role is set on req.user
        if (!currentRole || currentRole !== requiredRole) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to perform this action',
            });
        }

        next();
    };
}


const authorizedSubscriber = async(req,res,next)=>{
   const subscription = req.user.subscription;
   const currentRole = req.user.role;
   if(currentRole !== 'ADMIN' && subscription.status !== 'active'){
     return next(new AppError('please subscribe to access this!!',403));
   };
}

export {isLoggedIn,userAuthorizedRole,authorizedSubscriber};