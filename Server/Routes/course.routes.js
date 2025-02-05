import {Router} from 'express';
import { getAllCourses, getLecturesByCourseId ,createCourse,updateCourse,removeCourse,addLectureToCourseById,deleteLectureToCourseById} from '../controller/course.controller.js';
import { authorizedSubscriber, isLoggedIn, userAuthorizedRole } from '../middlewares/auth.middleware.js';  // Correct import style
import upload from '../middlewares/multer.middleware.js';
const router = Router();

router.get('/',getAllCourses);
router.post('/createcourse',upload.single('thumbnail'),userAuthorizedRole('ADMIN'),createCourse);

router.get('/:id',isLoggedIn,authorizedSubscriber,getLecturesByCourseId);
router.post('/:id',isLoggedIn,userAuthorizedRole('ADMIN'),updateCourse);
router.delete('/:id',isLoggedIn,userAuthorizedRole('ADMIN'),removeCourse);
router.post('/addLectures/:id',isLoggedIn,userAuthorizedRole('ADMIN'),upload.single('thumbnail'),addLectureToCourseById);
router.delete('/deleteLectures/:id',isLoggedIn,userAuthorizedRole('ADMIN'),deleteLectureToCourseById);

export default router;