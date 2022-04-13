import { Server, Socket } from "socket.io";

export class KawaiiServer {
    #io: Server;

    constructor(io: Server) {
        this.#io = io
        console.log('Dani starts sucking the D!')

        this.#initialize()
    }

    #onUserConnect(userIo: Socket) {
        console.log(`${userIo.id} connected!`)
    }

    #onUserDisconnect(userIo: Socket) {
        console.log(`${userIo.id} disconnected!`)
    }

    #initialize() {
        this.#io.on('connect', this.#onUserConnect)
        this.#io.on('disconnect', this.#onUserDisconnect)
    }
}
