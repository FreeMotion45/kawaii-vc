import { Server, Socket } from "socket.io";

export class KawaiiServer {
    private io: Server    

    constructor(io: Server) {
        this.io = io
        console.log('Dani starts sucking the D!')

        this.initialize()
    }

    private onUserConnect(userIo: Socket) {
        console.log(`${userIo.id} connected!`)
    }

    private onUserDisconnect(userIo: Socket) {
        console.log(`${userIo.id} disconnected!`)
    }

    private initialize() {
        this.io.on('connect', this.onUserConnect)
        this.io.on('disconnect', this.onUserDisconnect)
    }
}
