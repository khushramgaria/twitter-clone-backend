import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//to set limit to take json
app.use(express.json({
    limit: "16kb"
}))

//to understand the url data 
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

//
app.use(express.static("public"))

//to perform CRUD operations of user cookies browser with server securly 
app.use(cookieParser())

//router import 
import userRouter from "./routes/user.routes.js"

//router declaration
app.use("/api/v1/users", userRouter)

export { app }