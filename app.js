require('dotenv').config()
const express = require('express')
const app = express()
const cors =require('cors')
const cookieParser =require('cookie-parser')
const connection =require('./bd/connection')
// const path = require('path');
const { usertExtractor } = require('./middleware/auth');
const userRouter = require('./controllers/user')
const followRouter = require('./controllers/Follow')
const publicationRouter = require('./controllers/publication')
const refresRouter = require('./controllers/refres')





// Connect to MongoDB
connection()
// upload de archivos


app.use(cors())
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));


// Routes

app.use('/api/users', userRouter)
app.use('/api/follow', followRouter)
app.use('/api/publication', publicationRouter)
app.use('/api/refres', usertExtractor ,refresRouter)



module.exports = app