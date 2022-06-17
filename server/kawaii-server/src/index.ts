import { Server } from 'socket.io'
import { registerKawaiiServerSocketIO } from './kawaiiServer'
import http from 'http'
import https from 'https'
import express from 'express'
import fs from 'fs'
import cors from 'cors'
import { registerLoginEndpoints } from './login/loginHandler'
import { MemoryDB } from './login/dal/memoryDb'

const [HTTPS_PORT, HTTP_PORT] = [443, 80]

const startHttpServer = async () => {
    const app = express()
    
    let httpServer, tls: https.ServerOptions
    try {
        console.log('starting with HTTPS!')
        tls = {
            cert: fs.readFileSync('./kawaii-server/src/cert/public.crt'),
            key: fs.readFileSync('./kawaii-server/src/cert/private.key')
        }
        httpServer = https.createServer(tls, app).listen(HTTPS_PORT)
    } catch (error) {
        console.log('failed to start HTTPS server, starting HTTP server instead.')        
        httpServer = http.createServer(app).listen(HTTP_PORT)
    }

    app.use(express.static("../client/build"))
    
    registerHttpEndpoints(app)
    await startSocketIOServer(httpServer, app)
}

const registerHttpEndpoints = (app: express.Application) => {
    app.use(express.json())
    app.use(cors())
    registerLoginEndpoints(app, new MemoryDB())
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
