import { Server, Socket } from "socket.io";
import { VoiceChannel } from "./vc/voiceChannel";

class KawaiiServer {
    private io: Server
    private voiceChannels: VoiceChannel[] = []

    constructor() { }

    public initialize(io: Server) {
        this.io = io
        this.voiceChannels.push(new VoiceChannel('general'))

        console.log('Registering Dani SUCC events...')        
        
        this.io.on('connect', (socket) => this.onUserConnect(socket))
        console.log('Registered To Dani connect event!')

        this.io.on('disconnect', (socket) => this.onUserDisconnect(socket))
        console.log('Registered To Dani dickonnect event!')
    }

    private onUserConnect(userIo: Socket) {
        console.log(`${userIo.id} connected!`) 

        userIo.on('join voice channel', (voiceChannelName: string, callback: Function) => this.onJoinVoiceChannel(userIo, voiceChannelName, callback))
        userIo.on('exit voice channel', () => this.onExitVoiceChannel(userIo))
        userIo.on('disconnect', () => this.onUserDisconnect(userIo))
    }

    private onUserDisconnect(userIo: Socket) {
        console.log(`${userIo.id} disconnected! Bye bye!`)
    }

    private onJoinVoiceChannel(userIO: Socket, voiceChannelName: string, callback: Function) {
        const voiceChannel = this.getVoiceChannelByName(voiceChannelName)
        voiceChannel.addUser(userIO)

        userIO.on('voice', (voiceBuffer) => voiceChannel.streamUserVoice(userIO, voiceBuffer))
        
        callback({
            status: 'ok'
        })
    }

    private onExitVoiceChannel(userIO: Socket) {
        for (const voiceChannel of this.voiceChannels) {
            if (voiceChannel.userExists(userIO)) {
                voiceChannel.removeUser(userIO)
                
                userIO.removeAllListeners('voice')
            }
        }
    }

    private getVoiceChannelByName(voiceChannelName: string) : VoiceChannel {
        for (const voiceChannel of this.voiceChannels) {
            if (voiceChannel.name === voiceChannelName) {
                return voiceChannel
            }
        }

        return undefined
    }
}

export const registerKawaiiServerSocketIO = (io: Server) => {
    const kws = new KawaiiServer()
    kws.initialize(io)
}
