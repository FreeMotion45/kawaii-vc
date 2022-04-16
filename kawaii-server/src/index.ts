import { Server } from 'socket.io'
import { KawaiiServer } from './kawaiiServer'
import { createServer as createHttpServer } from 'http'
import * as express from 'express'
import * as cors from 'cors'

const app = express()
app.use(cors())

const httpServer = createHttpServer(app)

const io = new Server(httpServer)
const kws = new KawaiiServer(io)

app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})

const PORT = 42069
app.listen(PORT)
