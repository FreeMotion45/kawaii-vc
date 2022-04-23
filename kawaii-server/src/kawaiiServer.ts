import { Server, Socket } from "socket.io";
import { VoiceChannel } from "./vc/voiceChannel";

class KawaiiServer {
    private _io: Server
    private _voiceChannels: VoiceChannel[] = []
    private _userRoom: Map<string, VoiceChannel> = new Map()

    constructor() { }

    public initialize(io: Server) {
        this._io = io
        this.createVoiceChannel('general')

        console.log('Registering Dani SUCC events...')

        this._io.on('connect', (socket) => this.onUserConnect(socket))
        console.log('Registered To Dani connect event!')

        this._io.on('disconnect', (socket) => this.onUserDisconnect(socket))
        console.log('Registered To Dani dickonnect event!')
    }

    private createVoiceChannel(name: string) {
        this._voiceChannels.push(new VoiceChannel(name))
    }

    private onUserConnect(userIo: Socket) {
        console.log(`${userIo.id} connected!`)

        userIo.on('join voice channel', (voiceChannelName: string, callback: Function) => this.onJoinVoiceChannel(userIo, voiceChannelName, callback))
        userIo.on('exit voice channel', (callback: Function) => this.onExitVoiceChannel(userIo, callback))
        userIo.on('send rtc offer', (peer: string, offer: RTCSessionDescriptionInit, returnPeerAnswerToOfferrer: (answer: RTCSessionDescriptionInit) => any) => this.onSendRTCOffer(userIo, peer, offer, returnPeerAnswerToOfferrer))
        userIo.on('send ice candidate', (peer: string, iceCandidate: RTCIceCandidate) => this.onSendICECandidate(userIo, peer, iceCandidate))
        userIo.on('disconnect', () => this.onUserDisconnect(userIo))
    }

    private onUserDisconnect(userIo: Socket) {
        console.log(`${userIo.id} disconnected! Bye bye!`)
    }

    private onJoinVoiceChannel(userIO: Socket, voiceChannelName: string, returnChannelData: Function) {
        const voiceChannel = this.getVoiceChannelByName(voiceChannelName)
        voiceChannel.addUser(userIO)
        this._userRoom[userIO.id] = voiceChannel

        const users = voiceChannel.users
        users.filter(user => user !== userIO)
        const userIDs = []
        users.forEach(user => {
            if (user.id !== userIO.id) {
                userIDs.push(user.id)
            }            
        })

        returnChannelData({
            peers: userIDs
        })
    }

    private async onSendRTCOffer(userIO: Socket, peer: string, offer: RTCSessionDescriptionInit, returnPeerAnswerToOfferrer: (answer: RTCSessionDescriptionInit) => any) {
        const voiceChannel: VoiceChannel = this._userRoom[userIO.id]
        const peerAnswer = await voiceChannel.sendRTCOfferToPeer(userIO, peer, offer)
        returnPeerAnswerToOfferrer(peerAnswer)
    }

    private async onSendICECandidate(userIO: Socket, peer: string, iceCandidate: RTCIceCandidate) {
        const voiceChannel: VoiceChannel = this._userRoom[userIO.id]
        voiceChannel.sendICECandidate(userIO, peer, iceCandidate)
    }

    private onExitVoiceChannel(userIO: Socket, clientCallback: Function) {
        for (const voiceChannel of this._voiceChannels) {
            if (voiceChannel.userExists(userIO)) {
                voiceChannel.removeUser(userIO)

                userIO.removeAllListeners('voice')
            }
        }

        clientCallback({
            status: 'ok'
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

export const registerKawaiiServerSocketIO = (io: Server) => {
    const kws = new KawaiiServer()
    kws.initialize(io)
}
