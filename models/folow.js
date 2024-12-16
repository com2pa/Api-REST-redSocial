const mongoose =require('mongoose');
const mongoosePaginate =require('mongoose-paginate-v2')

// Definir esquema de la colección 'users'
const followSchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'

    },
    followed: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },    
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    following:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }
    
})
followSchema.plugin(mongoosePaginate);
followSchema.set('toJSON',{
    transform:(document,returnedObject)=>{
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
})

const Follow = mongoose.model('Follow',followSchema);
Follow.paginate().then({})

module.exports = Follow;