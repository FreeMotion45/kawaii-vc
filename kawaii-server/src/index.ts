import { Server } from 'socket.io'
import { KawaiiServer } from './kawaiiServer.js'

const PORT = 42069

const io = new Server(PORT)
const kws = new KawaiiServer(io)