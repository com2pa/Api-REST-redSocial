const mongoose = require('mongoose')
const { MONGO_URL } = require('../config')

// Connect to MongoDB
const connection =async()=>{
    try {
        await mongoose.connect(MONGO_URL);            
        console.log('Conectando a MongoDB!')
    } catch (error) {
        console.error('Error conexion a  MongoDB:', error)
        
    }
}

module.exports = connection