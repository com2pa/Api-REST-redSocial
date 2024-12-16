const http = require('http')
const app = require('./app')

const server = http.createServer(app)
server.listen(3000,()=>{
    console.log('servidor en puerto 3000')  
})