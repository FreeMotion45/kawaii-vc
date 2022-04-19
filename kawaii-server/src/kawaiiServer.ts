import { Server, Socket } from "socket.io";
import { VoiceChannel } from "./vc/voiceChannel";

class KawaiiServer {
    private io: Server
    private voiceChannels: VoiceChannel[]

    constructor(io: Server) {
        this.io = io        
        this.initialize()
    }

    private initialize() {
        console.log('Registering Dani SUCC events...')
        
        this.io.on('connect', this.onUserConnect)
        console.log('Registered To Dani connect event!')

        this.io.on('disconnect', this.onUserDisconnect)        
        console.log('Registered To Dani dickonnect event!')
    }

    private onUserConnect(userIo: Socket) {
        console.log(`${userIo.id} connected!`)

        userIo.on('join voice channel', (voiceChannelName) => this.onJoinVoiceChannel(userIo, voiceChannelName))
        userIo.on('exit voice channel', () => this.onExitVoiceChannel(userIo))
    }

    private onUserDisconnect(userIo: Socket) {
        console.log(`${userIo.id} disconnected!`)
    }

    private onJoinVoiceChannel(userIO: Socket, voiceChannelName: string) {
        const voiceChannel = this.getVoiceChannelByName(voiceChannelName)
        voiceChannel.addUser(userIO)

        userIO.on('voice', (voiceBuffer) => voiceChannel.streamUserVoice(userIO, voiceBuffer))
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
            if (voiceChannel.name == voiceChannelName) {
                return voiceChannel
            }
        }

        return undefined
    }
}

export const registerKawaiiServerSocketIO = (io: Server) => {
    const kws = new KawaiiServer(io)
}
