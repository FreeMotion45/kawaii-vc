import { Socket } from "socket.io";
import { createWorker, types as msTypes } from "mediasoup";
import { VoiceChannel } from "../vc/voiceChannel";

type TransportConnectionParameters = {
    id: string,
    dtlsParameters: msTypes.DtlsParameters,
}

type ProducerParameters =  {
    id: string,
    options: msTypes.ProducerOptions
}

type DataProducerParameters = {
    id: string,
    options: msTypes.DataProducerOptions
}

export class SignallingChannel {
    private _voiceChannel: VoiceChannel
    private _client: Socket

    constructor(voiceChannel: VoiceChannel, client: Socket) {
        this._voiceChannel = voiceChannel
        this._client = client        
    }

    public subscribeEvents() {
        this._client.on("get router rtp capabilities", (callback) => this.onGetRouterRtpCapabilities(callback))
        this._client.on("create transport", (sctpCapabilities: msTypes.SctpCapabilities, type: string, callback: any) => this.onCreateTransport(sctpCapabilities, type, callback))
        this._client.on("transport connect", (connectParams: TransportConnectionParameters, callback: () => void) => this.onConnectTransport(connectParams, callback))
        this._client.on("new producer", (producerParams: ProducerParameters, callback: (producerId: string) => void) => this.onNewProducer(producerParams, callback))
        this._client.on("new data producer", (dataProducerParams: DataProducerParameters, callback: (dataProducerId: string) => void) => this.onNewDataProducer(dataProducerParams, callback))
        this._client.on("consume peer", (peerId: string, callback: (consumerIds: string[]) => void) => this.onGetPeerConsumers(peerId, callback))
        this._client.on("send rtp capabilities", (rtpCapabilities: msTypes.RtpCapabilities, callback: () => void) => this.onClientSentRtpCapabilities(rtpCapabilities, callback))
        this._client.on("get peers in room", (callback: (response: any) => void) => this.onGetPeersInRoom(callback))
        this._client.on("resume consumer", (consumerId: string, callback: () => void) => this.resumeConsumer(consumerId, callback))
        this._client.on("close producer", (data: any, callback: (res: any) => void) => this.onCloseProducer(data, callback))
    }

    public unsubscribeEvents() {
        this._client.removeAllListeners("get router rtp capabilities")
        this._client.removeAllListeners("create transport")
        this._client.removeAllListeners("transport connect")
        this._client.removeAllListeners("new producer")
        this._client.removeAllListeners("new data producer")
        this._client.removeAllListeners("consume peer")
        this._client.removeAllListeners("send rtp capabilities")
        this._client.removeAllListeners("get peers in room")
        this._client.removeAllListeners("resume consumer")
        this._client.removeAllListeners("close producer")
    }

    public async send(ev: string, data: any) {
        return new Promise((res, rej) => {
            this._client.emit(ev, data, res)
        })
    }
    
    public async resumeConsumer(consumerId: string, callback: () => void) {
        await this._voiceChannel.resumeConsumer(this._client, consumerId)
        callback()

    }

    private onGetRouterRtpCapabilities(callback) {        
        callback(this._voiceChannel.msRouter.rtpCapabilities)        
    }

    private onClientSentRtpCapabilities(rtpCapabilities: msTypes.RtpCapabilities, callback: () => void) {
        this._voiceChannel.setRtpCapabilities(this._client, rtpCapabilities)
        callback()
    }

    private async onCreateTransport(sctpCapabilities: msTypes.SctpCapabilities, type, callback: any) {
        const clientSendTransport = await this._voiceChannel.createWebRtcTransport(this._client, {
            listenIps: [
                 { ip: "127.0.0.1" },
                 { ip: "192.168.1.21" },
                 { ip: "25.81.129.4" },
            ],
            enableTcp: true,
            enableUdp: true,
            preferUdp: true,
            enableSctp: Boolean(sctpCapabilities),
            numSctpStreams: sctpCapabilities.numStreams,
        }, type)

        callback({
            id: clientSendTransport.id,
            iceParameters: clientSendTransport.iceParameters,
            iceCandidates: clientSendTransport.iceCandidates,
            dtlsParameters: clientSendTransport.dtlsParameters,
            sctpParameters: clientSendTransport.sctpParameters,
        })
    }

    private onGetPeersInRoom(callback: (response: any) => void) {
        const peers = []
        this._voiceChannel.users.forEach(peer => {
            if (peer !== this._client) {
                peers.push(peer.id)
            }
        })
        callback({ peers })
    }

    private async onConnectTransport(connectionParams: TransportConnectionParameters, callback: () => void) {
        const { id: transportId, dtlsParameters } = connectionParams
        await this._voiceChannel.connectTransport(this._client, transportId, dtlsParameters)
        callback()
    }

    private async onNewProducer(clientProducerParameters: ProducerParameters, callback: (producerId: string) => void) {
        const { id, options } = clientProducerParameters
        const producer = await this._voiceChannel.addProducer(this._client, id, options)        
        callback(producer.id)
    }

    private async onCloseProducer(data: any, cb: (res: any) => void) {
        const { producerId } = data
        await this._voiceChannel.closeProducer(this._client, producerId)
        cb({})
    }

    private async onGetPeerConsumers(peerId: string, callback: (consumerIds: string[]) => void) {
        const consumers = await this._voiceChannel.consumePeer(this._client, peerId)
        callback(consumers)
    }

    private async onNewDataProducer(dataProducerParameters: DataProducerParameters, callback: (dataProducerId: string) => void) {
        const { id, options } = dataProducerParameters
        const dataProducer = await this._voiceChannel.addDataProduer(this._client, id, options)
        callback(dataProducer.id)
    }
}