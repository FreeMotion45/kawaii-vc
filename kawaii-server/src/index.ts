import { Server } from 'socket.io'
import { KawaiiServer } from './kawaiiServer'
import express from 'express'
import { createServer as createHttpServer } from 'http'

const expressHost = express()

const httpServer = createHttpServer(expressHost)


const PORT = 42069

const httpOptions = {
    cors: {
        origin: '*'
    }
}
const io = new Server(httpServer, httpOptions)
const kws = new KawaiiServer(io)

httpServer.listen(PORT)