import { Server, Socket } from "socket.io";
import { VoiceChannel } from "./vc/voiceChannel";
import { createWorker, types as mediasoupTypes } from "mediasoup";

class KawaiiServer {    
    private _io: Server
    private _voiceChannels: VoiceChannel[] = []
    private _userRoom: Map<string, VoiceChannel> = new Map()

    private _worker: mediasoupTypes.Worker    

    constructor() { }

    public async initialize(io: Server) {
        await this._initializeMediaSoup()

        this._io = io
        await this.createVoiceChannel('general')

        console.log('Registering Dani SUCC events...')

        this._io.on('connect', (socket) => this.onUserConnect(socket))
        console.log('Registered To Dani connect event!')

        this._io.on('disconnect', (socket) => this.onUserDisconnect(socket))
        console.log('Registered To Dani dickonnect event!')
    }

    private async _initializeMediaSoup() {
        this._worker = await createWorker()        
    }

    private async createVoiceChannel(name: string) {
        const router = await this._worker.createRouter({
            mediaCodecs : [
                {
                    kind      : 'audio',
                    mimeType  : 'audio/opus',
                    clockRate : 48000,
                    channels  : 2
                },
                {
                    kind       : 'video',
                    mimeType   : 'video/VP8',
                    clockRate  : 90000,
                    parameters:
                    {
                        'x-google-start-bitrate': 1000
                    }
                }
            ]      
        })

        this._voiceChannels.push(new VoiceChannel(name, router))
    }

    private onUserConnect(userIo: Socket) {
        console.log(`${userIo.id} connected!`)
        userIo.on('disconnect', () => this.onUserDisconnect(userIo))

        userIo.on('join room', async (data: any, cb: (res: any) => void) => {
            const { roomName } = data
            await this.getVoiceChannelByName(roomName).addUser(userIo)
            cb({})
        })
    }

    private onUserDisconnect(userIo: Socket) {
        console.log(`${userIo.id} disconnected! Bye bye!`)
        this._voiceChannels.forEach(vc => {
            if (vc.userExists(userIo)) {
                vc.removeUser(userIo)
            }
        })
    }

    private getVoiceChannelByName(voiceChannelName: string): VoiceChannel {
        for (const voiceChannel of this._voiceChannels) {
            if (voiceChannel.name === voiceChannelName) {
                return voiceChannel
            }
        }

        return undefined
    }
}

export const registerKawaiiServerSocketIO = async (io: Server) => {
    const kws = new KawaiiServer()
    await kws.initialize(io)
}
