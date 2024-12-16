const mongoose = require('mongoose');
const mongoosePaginate =require('mongoose-paginate-v2')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lastname:String,
    bio:String,
    nick:{
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: 'default.png'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    role:{
        type: String,
        enum: ['ADMIN', 'USER'],
        default: 'USER'
    },
    verificacion:{
        type: Boolean,
        default: false
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Follow'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Follow'
    }],
    publications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publication'
    }]
})
userSchema.plugin(mongoosePaginate);
userSchema.set('toJSON',{
    transform:(document,returnedObject)=>{
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.password;
    }
})


// Exportamos el modelo 'User' para usarlo en otros archivos
const User = mongoose.model('User',userSchema);

module.exports = User;