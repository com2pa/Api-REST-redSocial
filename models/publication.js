const mongoose =require('mongoose')
const mongoosePaginate =require('mongoose-paginate-v2')
const publicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    file:{
        type: String
        // la ruta del archivo subido
        // se guarda en la base de datos
    }

})
publicationSchema.plugin(mongoosePaginate);
publicationSchema.set('toJSON',{
    transform:(document,returnedObject)=>{
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id
        delete returnedObject.__v
    }
})
const Publication = mongoose.model('Publication',publicationSchema);
Publication.paginate().then({})

module.exports = Publication;
