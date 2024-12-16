const jwt = require('jsonwebtoken')
const User = require('../models/user')



const usertExtractor = async(request, response, next)=>{
    
    try {
        // comprobar que el token existe
    const token = request.cookies?.accesstoken
    if(!token) return response.status(401).json({error: 'No estas autorizado para acceder a esta ruta'})
 

    // verificar que el token es válido
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log(decoded)

    // traer el usuario
    const user = await User.findById(decoded.id);
    request.user = user;


    // continuar con la ejecución de la ruta
    next();
    } catch (error) {
       return response.status(403).json({error: 'No estas autorizado para acceder a esta ruta'})
    }
    
}

module.exports = {usertExtractor};