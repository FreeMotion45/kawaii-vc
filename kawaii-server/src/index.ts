import { Server } from 'socket.io'
import { registerKawaiiServerSocketIO } from './kawaiiServer'
import http from 'http'
import express from 'express'
import cors from 'cors'

const PORT = 42069

const app = express()

app.use(cors())

const server = http.createServer(app).listen(PORT)

const io = new Server(server, {
    cors: {
        origin: '*'
    }
})
registerKawaiiServerSocketIO(io)

app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})
