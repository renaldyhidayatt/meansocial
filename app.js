require('dotenv').config();
const express = require("express");
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const authPassport = require('./helpers/authPassport')
const cookieParser = require('cookie-parser')


require('./config/db')



const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan("dev"))
app.use(cors())
app.use(cookieParser())

app.use(passport.initialize())

passport.use(authPassport)

app.use("/api/auth", require('./router/auth.router'))


app.use("/", (req, res) => {
  res.send("Hello World")
})




app.listen(5000, (req, res) => {
  console.log("Server running 5000 Port")
})
