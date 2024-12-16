const followRouter=require('express').Router()
const Follow = require('../models/folow')
const User = require('../models/user')
const {usertExtractor}=require('../middleware/auth')
const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');
// servicios
const followService =require('../services/followService');
// accion de guardar un follow(accion de seguir)
followRouter.post('/save', usertExtractor,async (req, res) => {
     // obteniendo los datos por body
     const followedUserId = req.body.follow;
     // console.log(followedUserId)
 
     // sacar id del usuario identificado
     const identity =req.user
 
      // buscamos el id del usuario seguido
      const followedUser = await User.findById(followedUserId)
 
      if (!followedUser) {
          return res.status(404).send({
              status: 'error',
              message: 'User no encontrado'
          })
      }
         // creando objeto con el modelo follow
     let userToFollow = new Follow({
         user: identity.id,
         followed: followedUser._id
     })
    
        // usuario que estoy siguiendo
        const siguiendo= await User.findById(identity._id)
        //  este es aquien quiero seguir o seguidores
        const LosMeSiguen =await User.findById(followedUserId)
    
        // verificar si ya esta añadido en el arrays de following
        if(siguiendo.following.includes(followedUser._id) && LosMeSiguen.followers.includes(identity._id)){
            return res.status(400).send({
                status:'error',
                msg:'ya sigues a este usuario',
            })
        }   
           
      // guardar el objeto follow
     const newFollow = await userToFollow.save()
 
     // actualizar los arrays de following y followers en los usuarios
     await User.findByIdAndUpdate(identity._id, {$push: {following: followedUser._id}}, {new: true})
     await User.findByIdAndUpdate(followedUserId, {$push: {followers: identity._id}}, {new: true})
     
 
     return res.status(200).send({
         status:'sucess', 
         identity:req.user,//con que estoy iniciado sesion
         userToFollow,
         newFollow      //se guardo
     })
 

})

// accion de eliminar un follow(accion de dejar de seguir)

followRouter.delete('/unfollow/:id', usertExtractor, async (req, res) => {
    //   recogemos el id del usario identificado
    const userId =req.user

    // obtenemos el id enviado por la url
    const followedId = req.params.id

    // convertimos los ids a ObjectId
    const userIdObjectId = new mongoose.Types.ObjectId(userId);
    const followedIdObjectId = new  mongoose.Types.ObjectId(followedId);


    // find de las coincidencias y hacer remove
    await Follow.findOneAndDelete({user: userIdObjectId, followed: followedIdObjectId});
    // find de los coincidencias y hacer remove en el usuario seguido
    await Follow.findOneAndDelete({user: followedIdObjectId, followed: userIdObjectId});

    // actualizar los arrays de following y followers en los usuarios
    const updatedUser = await User.findByIdAndUpdate(userIdObjectId, {$pull: {following: followedIdObjectId}}, {new: true});
    const updatedFollowedUser = await User.findByIdAndUpdate(followedIdObjectId, {$pull: {followers: userIdObjectId}}, {new: true});

    // guardamos
    await updatedUser.save();
    await updatedFollowedUser.save();
   // return success response
   return res.status(200).send({
       status:'success', 
       message:'¡Follow eliminado correctamente !'
   });

})

// accion de obtener los seguidores y los usuarios que sigue

followRouter.get('/following/:id?/:page?', usertExtractor, async (req, res) => {
//     // // obtener el id del usuario identificado
    let userId = req.user;
    
    // comprobar si me llega el id por parametro en url
    if (req.params.id) {
        userId = req.params.id;
    }
    // verificar si el id es correcto
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).send({
            status: 'error',
            message: 'Usuario no encontrado',
        });
    }

    // comprobar si me llega la pagina . si no la pagina 1
    let limit=5
    let page= parseInt(req.params.page) || 1
    // const option={    
    //     limit:parseInt(req.query.page) || 1,
    //     page: parseInt(req.params.page) || 1,
    //     forceCountFn:true,
    //     lean: true,
    //   }
    // verificar si me llega la pagina por la url
    if(req.params.page){
        page=req.params.page
    }

    // find a follow popilar datos de los usarios y paginar con mongoose paginate
    const following = await Follow.find({ user: userId })
        .populate('user followed','-avatar -role -verificacion -email')//-avatar campos que no aparecera con el -
        .skip((page - 1) * limit)
        .limit(limit);
    const total = await Follow.countDocuments({ user: userId });
    // obteniendo los id de los usarios seguidos por el usuario quien inicio sesion
    let followUserIds = await followService.followUserIds(req.user.id);


    return res.status(200).send({
        status: 'success',
        message: 'Listado de usuarios que sigues',
        pagActual: page,
        following,
        totalPages: Math.ceil(total / limit),
        totalDocs: total,
        limit,
        user_Following: followUserIds.following, // para saber los usuarios que estoy siguiendo
        user_followers: followUserIds.followers, // para saber los usuarios que me sigue
    });
        // .paginate({},option,function(error,result){
        //      if(error) return res.status(500).json({error: 'Error en el server'});
        //      return res.status(200).send({
        //          status:'success',
        //          message: 'Listado de usuarios que sigues',
        //          following:result.docs,
        //          currentPage: result.page,
        //          totalPages: Math.ceil(result.totalDocs / result.limit),
        //      });
        //  });


 
})

// accion de obtener los usuarios que me siguen

followRouter.get('/followers/:id?/:page?', usertExtractor, async (req, res) => {
    //     // // obtener el id del usuario identificado
    let userId = req.user;
    
    // comprobar si me llega el id por parametro en url
    if (req.params.id) {
        userId = req.params.id;
    }
    // verificar si el id es correcto
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).send({
            status: 'error',
            message: 'Usuario no encontrado',
        });
    }

    // comprobar si me llega la pagina . si no la pagina 1
    let limit=5
    let page= parseInt(req.params.page) || 1
    // verificar si me llega la pagina por la url
    if(req.params.page){
        page=req.params.page
    }
     // find a follow popilar datos de los usarios y paginar con mongoose paginate
     const followers = await Follow.find({ followed: userId })
     .populate('user','-avatar -role -verificacion -email')//followed //-avatar campos que no aparecera con el -
     .skip((page - 1) * limit)
     .limit(limit);
 const total = await Follow.countDocuments({ followed: userId });
 // obteniendo los id de los usarios seguidos por el usuario quien inicio sesion
 let followUserIds = await followService.followUserIds(req.user.id);


 return res.status(200).send({
     status: 'success',
     message: 'Listado de usuarios que sigues',
     pagActual: page,
     followers,
     totalPages: Math.ceil(total / limit),
     totalDocs: total,
     limit,
     user_Following: followUserIds.following, // para saber los usuarios que estoy siguiendo
     user_followers: followUserIds.followers, // para saber los usuarios que me sigue
 });

})


module.exports = followRouter;