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
        console.log('starting with HTTPS!')
        tls = {
            cert: fs.readFileSync('./kawaii-server/src/cert/public.crt'),
            key: fs.readFileSync('./kawaii-server/src/cert/private.key')
        }
        httpServer = https.createServer(tls, app).listen(PORT)
    } catch (error) {
        console.log('failed to start HTTPS server, starting HTTP server instead.')        
        httpServer = http.createServer(app).listen(PORT)
    }

    app.use(express.static("D:\\Local\\Programming\\Projects\\kawaii-vc-client\\kawaii-vc\\kawaii-client\\build"))
    
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
