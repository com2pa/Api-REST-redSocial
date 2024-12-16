const refresRouter =require('express').Router()
const User = require('../models/user')

refresRouter.get('/', async(res, req)=>{
    return res.status(200).json({
       id:req.user.id,
       name:req.user.name,
       role:req.user.role 
    })
})

module.exports=refresRouter