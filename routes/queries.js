import express, { query } from "express";

// import auth from '../middlewares/auth.js';
import queryController from "../controllers/queries.js";

// import multer from 'multer';
// const upload = multer().any();

const router = express.Router();

router.post(
    '/login',
    queryController.login
)

router.post(
    '/add_favourite',
    queryController.AddFavourite
)
router.post(
    '/register_user',
    queryController.RegisterUser
)

router.get(
    '/query_one',
    queryController.GetQueryOne
)
router.get(
    '/query_two',
    queryController.GetQueryTwo
)
router.get(
    '/query_three',
    queryController.GetQueryThree
)

router.get(
    '/query_four',
    queryController.GetQueryFour
)

router.get(
    '/query_five',
    queryController.GetQueryFive
)

router.get(
    '/query_six',
    queryController.GetQuerySix
)

router.get(
    '/query_seven/',
    queryController.GetQuerySeven
)

export default router;