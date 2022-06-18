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

const getPort = (defaultPort: number) => {
    if (process.env.PORT !== undefined && process.env.PORT !== null) {
        return Number(process.env.PORT)
    }
    return defaultPort
}

const startHttpServer = async () => {
    const app = express()
    
    let httpServer, tls: https.ServerOptions
    try {
        console.log('starting with HTTPS!')
        tls = {
            cert: fs.readFileSync('./src/cert/public.crt'),
            key: fs.readFileSync('./src/cert/private.key')
        }
        const port = getPort(HTTPS_PORT)
        console.log(`LISTENING ON PORT ${port}`)
        httpServer = https.createServer(tls, app).listen(port)
    } catch (error) {
        console.log('failed to start HTTPS server, starting HTTP server instead.')        
        httpServer = http.createServer(app).listen(getPort(HTTP_PORT))
    }

    console.log('Starting in ' + process.cwd())
    app.use(express.static("./static"))
    
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
