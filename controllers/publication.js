const publicationRouter =require('express').Router()
const Publication =require('../models/publication')
const {usertExtractor}=require('../middleware/auth')
const {paginate} = require('mongoose-paginate-v2')
const multer = require('multer');
const User=require('../models/user')
const fs = require('fs')
const path = require('path');
const followServices=require('../services/followService') 


// Serve static files from the 'public' folder
// configuracion de subida
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const allowedMimeTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif',
            'video/mp4', 
            'video/webm',
            'video/ogg',
            'video/mkv'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, 'uploads/publications/');
        }
        else {
            cb(new Error('Formato de archivo no soportado o el tamaño del mismo!'), false);
        }
    },
    filename: function (req, file, cb) {
        cb(null, "pub" + Date.now() + ' - ' + file.originalname);
    }
})
const uploads = multer({
    storage: storage,
    limits: { fileSize: 1000000 } // 1MB
})

// accion para guardar publicacion

publicationRouter.post('/save', usertExtractor, async (req, res) => {
    // recoger los datos del body
    const params=req.body
    // sino me llega dar respuesta negativa
    if(!params.text){
        return res.status(400).json({
            status:'error',
            msg:'error al intentar enviar el texto'
        })
    }

    // crear y rellanar el objeto del modelo
    let newPublication=new Publication({
        text:params.text,
        user:req.user.id
    })

    // guardar el objeto en bd
   let guardarPublicacion = await newPublication.save()
    if(!guardarPublicacion){
        return res.status(500).json({
            status:'error',
            msg:'Error al guardar la publicacion'
        })
    }else{
        return res.status(201).json({
            status:'success',
            msg:'Publicacion guardada correctamente',
            publication:guardarPublicacion
        })
    }
 

})


//  sacar una publicacion en concreto

publicationRouter.get('/detail/:id', usertExtractor, async (req, res) => {
    // sacar el id de la publicacion de la url
    const publicationId =req.params.id
    // buscar la publicacion por la id
    let publication=await Publication.findById(publicationId)
    // si no encuentro la publicacion
    if(!publication){
        return res.status(404).json({
            status:'error',
            msg:'Publicacion no encontrada'
        })
    }else{
        // si la encuentro responder con la publicacion
        return res.status(200).json({
            status:'success',
            msg:'Publicacion encontrada',
            publication:publication
        })
    }
})


// eliminar publicaciones

publicationRouter.delete('/delete/:id', usertExtractor, async (req, res) => {
    // sacar el id de la publicacion de la url
    const publicationId =req.params.id
    // buscar la publicacion por la id
    let publication=await Publication.findByIdAndDelete({"user":req.user.id, "_id":publicationId})
    // si no encuentro la publicacion
    if(!publication){
        return res.status(500).json({
            status:'error',
            msg:'No se ha podido eliminar '
        })
    }else{
        // si la encuentro responder con la publicacion eliminada
        return res.status(200).json({
            status:'success',
            msg:'Publicacion eliminada correctamente',
            publication:publication
        })
    }
})

// listar todas las publicaciones de un usuario en concreto

publicationRouter.get('/all/:id/:page?', usertExtractor, async (req, res) => {
    // sacar el id del usuario de la url
    let userId = req.params.id
    // constrolar la pagina
    // let page = 1
    // if(req.params.page){
    //     page=req.params-page
    // }
    // const limit = 5
    const options ={
        page: parseInt(req.params.page) || 1,
        limit: parseInt(req.query.limit) || 10,
    }
    const limit =options.limit
    try{
            // buscar todas las publicaciones
        let publications=await Publication
        .find({"user":userId})
        .sort({createdAt:-1})
        .populate('user','-avatar -role -verificacion -email')
        .paginate({},options)
       

//     // si no encuentro publicaciones
        if(!publications || publications.length <= 0 ){
            return res.status(404).json({
                status:'error',
                msg:'No hay publicaciones para mostrar'
            })
        }
        // console.log(publications);

//        // si la encuentro responder con las publicaciones
       return res.status(200).json({
           status:'success',
           msg:'Publicaciones encontradas',
           page:publications.page,
        //    totalPages: Math.ceil(publications.length / limit),
           publications:publications
           
       })
    }catch(error){
        console.log('error en la lista de publicaciones',error)
        return res.status(500).json({
            status:"error",
            msg:'error en el server'
        })
    }
    
   

})



// subir ficheros
// pasar por parameto file0 en postman
// id es de la publicacion
publicationRouter.post('/upload/:id', [usertExtractor, uploads.single("file0")], async (req, res) => {
    // sacar id
    const publicationsId =req.params.id
     // comprabar si el id de la publicacion esta asociado al id del usuario identificado
     let publication=await Publication.findById({"user":req.user.id, "_id":publicationsId})
     // si no encuentro la publicacion
     if(!publication){
        return res.status(404).json({
            status:'error',
            msg:'Publicacion no encontrada'
        })
   
    }
     // recoger si fichero de imagen y comprobar si existe
     if (!req.file) {
        return res.status(404).send({msg:'La peticion no inclye imagen'  });
    }
    // conseguir el nombre del archivo
    let image = req.file.originalname

    //sacar la extension
    const imageSplit =image.split("\.")
    const ext = imageSplit[1];
     if (
        ext != "png" &&
        ext != "jpg" &&
        ext != "gif" &&
        ext != "jpeg" &&
        ext != "mp4" &&
        ext != "webm" &&
        ext != "ogg" &&
        ext != "mkv"
    ){
        // borrar archivo subido
        const filePath =req.file.path
        const fileDelete = fs.unlinkSync(filePath);
        // devolver respuesta negativa
        return res.status(400).json({error: 'La extension del archivo no es válida'})

     }
     // subir imagen al storage
     const files = `${req.user.id}-${Date.now()}.${ext}`;
     const avatarPath = path.join(__dirname, '..', '/uploads/publications', files);
     fs.renameSync(req.file.path, avatarPath);
     // actualizar el campo avatar en la base de datos
    const PublicationsUpdate = await Publication.findByIdAndUpdate(
        {"user":req.user.id,"_id":publicationsId}, 
        { file: files }, 
        { new: true })
        .exec();
    // devolver respuesta positiva
    const user = await User.findByIdAndUpdate(
        { "_id": req.user.id },
        { $push: { publications: PublicationsUpdate._id } },
        { new: true }
      )
      // devolver respuesta con los datos actualizados del usuario y la publicacion subida
     res.status(200).json({ 
         message: 'Subiendo archivo',
         user: user,
         publications: PublicationsUpdate,
         file:req.file,
        
     });


})

// devolver archivos multimedia

publicationRouter.get('/media/:file', async (req, res) => {
    const filename = req.params.file;
    const filePath = path.join(__dirname, '..', '/uploads/publications', filename);
    // verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
        return res.status(404).send({msg: 'El archivo no existe'});
    }
    // devolver el archivo
    res.sendFile(path.resolve(filePath));
    
});
// listado de todas las publicaciones (feed)
// permite ver las publicaciones de las personas que sigen (followers)
publicationRouter.get('/feed/:page?', usertExtractor, async (req, res) => {
    // sacar id del usuario de la url
    let userId = req.user.id
    // constrolar la pagina
    // let page = 1
    // if(req.params.page){
    //     page=req.params-page
    // }
    // const limit = 5
    const options ={
        page: parseInt(req.params.page) || 1,
        limit: parseInt(req.query.limit) || 10,
    }
    const limit =options.limit
    try{
        const myFollow = await followServices.followUserIds(req.user.id)

    //         // buscar todas las publicaciones
    //     let publications=await Publication
    //     .find({"user":{$ne:userId}})
    //     .sort({createdAt:-1})
    //     .populate('user','-avatar -role -verificacion')
    //     .paginate({},options)
    // //     // si no encuentro publicaciones
    // if(!publications || publications.length <= 0 ){
    //     return res.status(404).json({
    //         status:'error',
    //         msg:'No hay publicaciones para mostrar'
    //     })
    // }
    //     let publications=await Publication
    // me muestra los usuarios que yo sigo que tenga publicaciones
        let publications=await Publication.find({
            $or: [
                { user: { $in: [...myFollow.following, userId] } },
                { user: userId },
            ],       
        }).populate("user","-role -verificacion -email")
        .sort({ createdAt:-1})
        // .paginate({},options)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .exec();
        return res.status(200).json({
            status:'success',
            msg:'Publicaciones encontradas',
            // data:publications.docs,
            pagActual:options.page,
            following:myFollow.following,
            publications: publications,
            // totalDocs: publications.totalDocs,
            totalPages: options.totalPages,
            limit: options.limit,
        })
        
    // // si la encuentro responder con las publicaciones
    //    return res.status(200).json({
    //        status:'success',
    //        msg:'Publicaciones encontradas',
    //     //    page: publications.page,
    //     //    totalPages: Math.ceil(publications.length / limit),
    //     //    publications: publications
    //         following:myFollow.following,
    //         publications: publications,
            
           
    //    })
    }catch(error){
        console.log('error en la lista de publicaciones',error)
        return res.status(500).json({
            status:"error",
            msg:'error en el server'
        })
    }
})



module.exports=publicationRouter;