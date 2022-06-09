import { Server, Socket } from "socket.io";
import { VoiceChannel } from "./vc/voiceChannel";
import { createWorker, types as mediasoupTypes } from "mediasoup";
import { ClientSession } from "./users/client";

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
        await this.createVoiceChannel('reshef-zoid')
        await this.createVoiceChannel('yoav public-baths')
        await this.createVoiceChannel('gabi-power-up-star')
        await this.createVoiceChannel('dani-zaurus')

        console.log('Registering Dani SUCC events...')

        this._io.on('connect', (socket) => this.onUserConnect(socket))
        console.log('Registered To Dani connect event!')
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
        const clientSession: ClientSession = {
            socket: userIo,
            currentChannel: undefined
        }

        console.log(`${userIo.id} connected!`)

        userIo.on('disconnect', () => {
            if (clientSession.currentChannel !== undefined) {
                clientSession.currentChannel.removeUser(userIo)
            }

            console.log(`${userIo.id} disconnected! Bye bye!`)
        })
        console.log('Registered To Dani dickonnect event!')

        userIo.on('join room', async (data: any, cb: (res: any) => void) => {
            const { roomName } = data
            clientSession.currentChannel = this.getVoiceChannelByName(roomName)
            await clientSession.currentChannel.addUser(userIo)
            cb({})
        })

        userIo.on('leave room', async (cb: (res: any) => void) => {
            await clientSession.currentChannel.removeUser(userIo)
            clientSession.currentChannel = undefined
            cb({})
        })

        userIo.on('get voice channels', (cb: (res: any) => void) => {
            const channelNames = []
            this._voiceChannels.forEach(channel => {
                channelNames.push(channel.name)
            })

            cb({
                channelNames,
            })
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
