import express from "express"
import dotenv from "dotenv"
import cors from 'cors'
import api from "./routes/index.js";
import createError from "http-errors";
import logger from "morgan";
// import userController from "./src/controllers/user.js";

import { StatusCodes } from "http-status-codes";

dotenv.config();

const app = express();

app.use(logger("dev"));

app.use(express.json()); // this allows us to take request.body data

app.get('/', (req, res) => res.status(StatusCodes.OK).send("API Running!!!"));

app.use(api);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server started on port : ${PORT}`))

app.use(cors());


// Define Routes
app.get("/", (req, res) => res.status(200).json({ msg: "Server Running" }));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send("Page Not Found");
});


export default app;
