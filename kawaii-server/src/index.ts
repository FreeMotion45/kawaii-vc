import { Server } from 'socket.io'
import { registerKawaiiServerSocketIO } from './kawaiiServer'
import http from 'http'
import https from 'https'
import express from 'express'
import fs from 'fs'

const startHttpServer = async () => {
    const PORT = 42069

    const app = express()
    
    let httpServer, tls: https.ServerOptions
    try {
        tls = {
            cert: fs.readFileSync('./kawaii-server/src/cert/host.crt'),
            key: fs.readFileSync('./kawaii-server/src/cert/host.key')
        }
        httpServer = https.createServer(tls, app).listen(PORT)
    } catch (error) {
        console.log('failed to start HTTPS server, starting HTTP server instead.')        
        httpServer = http.createServer(app).listen(PORT)
    }
    
    await startSocketIOServer(httpServer, app)
}

const startSocketIOServer = async (httpServer: http.Server, app: express.Application) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*'
        }
    })

    await registerKawaiiServerSocketIO(io)

    app.get('/', (req, res) => {
        res.send('<h1>Hello World!</h1>')
    })
}

startHttpServer()
