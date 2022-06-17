import { SignallingChannel } from "./signallingChannel";
import { Device, types as msTypes } from "mediasoup-client"
import { emptyPeer, MediaSoupPeer, Peer, PeerTrackData, RtcEvent } from "./webRtcPeer";
import { EventEmitter } from "events";


export class WebRtcConnection extends EventEmitter {
    private _mediaSoupPeers: Map<string, MediaSoupPeer> = new Map()

    private _sendTransport: msTypes.Transport | undefined
    private _consumerTransport: msTypes.Transport | undefined
    private _device: msTypes.Device | undefined
    private _producers: msTypes.Producer[]

    private _signal: SignallingChannel

    private _onNewConsumerProxy = (data: any, cb: (res: any) => void) => this._onNewConsumer(data, cb)
    private _onNewPeerProxy = (data: any, cb: (res: any) => void) => this._onNewPeer(data, cb)
    private _onPeerLeftProxy = (data: any, cb: (res: any) => void) => this._onPeerLeft(data, cb)
    private _onConsumerClosedProxy = (data: any, cb: (res: any) => void) => this._onConsumerClosed(data, cb)

    public constructor(signallingChannel: SignallingChannel) {
        super()

        this._signal = signallingChannel
        this._device = undefined
        this._sendTransport = undefined
        this._consumerTransport = undefined
        this._producers = []
    }

    public get signallingChannel() {
        return this._signal
    }

    public async connect() {        
        const routerRtpCapabilities =  await this._signal.getRouterRTPCapabilities()
        this._device = new Device()
        await this._device.load({ routerRtpCapabilities })
        await this._signal.sendRtpCapabilities(this._device.rtpCapabilities)

        await this.initializeSendTransport()
        await this.initializeConsumerTransport()        

        await this.createPeers()

        this._signal.on('new consumer', this._onNewConsumerProxy)
        this._signal.on('new peer', this._onNewPeerProxy)
        this._signal.on('peer left', this._onPeerLeftProxy)
        this._signal.on('close consumer', this._onConsumerClosedProxy)

        const peers: Map<string, Peer> = new Map()
        this._mediaSoupPeers.forEach((peer, id) => {
            peers.set(id, new Peer(id, peer.audioConsumer?.track, peer.videoConsumer?.track))
        })
        return peers
    }

    public async disconnect() {
        // for (const producer of this._producers) {
        //     producer.close()
        // }        

        // this._mediaSoupPeers.forEach((mediaSoupPeer, _) => {
        //     mediaSoupPeer.audioConsumer?.close()
        //     mediaSoupPeer.videoConsumer?.close()
        // })

        // Closing the send/receive transports also closes all the underlying producers and consumers.
        this._sendTransport?.close()
        this._consumerTransport?.close()

        this._producers = []
        this._mediaSoupPeers.clear()

        this._signal.off('new consumer', this._onNewConsumerProxy)
        this._signal.off('new peer', this._onNewPeerProxy)
        this._signal.off('peer left', this._onPeerLeftProxy)
        this._signal.off('close consumer', this._onConsumerClosedProxy)
    }

    public async stopProducingTrack(kind: msTypes.MediaKind) {
        for (const producer of [...this._producers]) {
            if (producer.kind !== kind)
                continue

            producer.close()
            this._producers.splice(this._producers.indexOf(producer), 1)
            this._signal.send('close producer', {
                producerId: producer.id,
            })
        }
    }

    public async produceTrack(options: msTypes.ProducerOptions) {
        if (this._sendTransport === undefined) {
            await this.initializeSendTransport()
        }

        if (this._sendTransport !== undefined) {    
            const producer = await this._sendTransport.produce(options)
            this._producers.push(producer)
            return producer
        }
    }

    private async createPeers() {
        const connectedPeerIDs: string[] = await this._signal.getPeersInRoom()

        const consumerForPeer = new Map<string, msTypes.Consumer[]>()
        const consumePromises = []
        for (const peerId of connectedPeerIDs) {
            consumePromises.push(
                this.consumePeer(peerId).then(consumers => {
                    consumerForPeer.set(peerId, consumers)
                })
            )
        }
        await Promise.all(consumePromises)

        const resumePromises = []
        for (const [peerId, peerConsumers] of Array.from(consumerForPeer.entries())) {
            const mediaSoupPeer: MediaSoupPeer = {
                audioConsumer: undefined,
                videoConsumer: undefined
            }

            for (const consumer of peerConsumers) {
                if (consumer.kind === 'video') {
                    mediaSoupPeer.videoConsumer = consumer
                } else if (consumer.kind === 'audio') {
                    mediaSoupPeer.audioConsumer = consumer
                }
                resumePromises.push(
                    this._signal.resume(consumer.id)
                )
            }

            this._mediaSoupPeers.set(peerId, mediaSoupPeer)
        }
        await Promise.all(resumePromises)
    }

    private async consumePeer(peerId: string) : Promise<msTypes.Consumer[]> {
        const consumersData = await this._signal.getPeerConsumers(peerId)            
        const consumers = []
        for (const consumerData of consumersData) {
            const consumer = await this._createReadyConsumer(
                consumerData.id,
                consumerData.producerId,
                consumerData.kind,
                consumerData.rtpParameters,
            )

            if (consumer !== undefined) {
                consumers.push(consumer)
            }
        }
        
        return consumers
    }

    private async _createReadyConsumer(
        id: string,
        producerId: string,
        kind: msTypes.MediaKind,
        rtpParameters: msTypes.RtpParameters) {
        if (this._consumerTransport === undefined) {
            throw new Error('cant create consumer if consumer transport is not connected.')
        }

        const consumer = await this._consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters
        })
        return consumer
    }
    

    private async initializeConsumerTransport() {
        if (this._device === undefined) {
            return
        }

        const {
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters
        } = await this._signal.createWebRtcTransport(this._device.sctpCapabilities, 'consumer')

        const consumerTransport = this._device.createRecvTransport({
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters,
        })

        consumerTransport.on('connect', async ({dtlsParameters}, callback, errback) => {
            await this._signal.connectTransport({
                id: consumerTransport.id,
                dtlsParameters: dtlsParameters
            })

            callback()
        })

        this._consumerTransport = consumerTransport
    }

    private async initializeSendTransport() {
        if (this._device === undefined) {
            return
        }

        const {
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters
        } = await this._signal.createWebRtcTransport(this._device.sctpCapabilities, 'send')

        const sendTransport = this._device.createSendTransport({
            id, 
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters,
        })

        sendTransport.on('connect', async ({dtlsParameters}, callback, errback) => {
            await this._signal.connectTransport({
                id: sendTransport.id,
                dtlsParameters: dtlsParameters
            })

            callback()
        })

        sendTransport.on('produce', async (options: msTypes.ProducerOptions, callback, errback) => {
            const producerId = await this._signal.addNewProducer({ 
                id: sendTransport.id,
                options,
            })

            callback({ id: producerId })
        })

        this._sendTransport = sendTransport
    }

    private async _onNewConsumer(data: any, cb: (res: any) => void) {
        const {
            peerId,
            consumerId,
            producerId,
            kind,
            rtpParameters
        } = data

        const mediaSoupPeer = this._mediaSoupPeers.get(peerId) as MediaSoupPeer

        const consumer = await this._createReadyConsumer(
            consumerId,
            producerId,
            kind,
            rtpParameters
        )
        
        if (consumer.kind === 'audio') {
            mediaSoupPeer.audioConsumer = consumer
        } else {
            mediaSoupPeer.videoConsumer = consumer
        }

        await this._signal.resume(consumerId)
        this.emit(RtcEvent.peerAddedTrack,
            {
                peerId,
                track: consumer.track
            }
        )

        cb({
            msg: 'thanks'
        })
    }

    private _onNewPeer(data: any, cb: (res: any) => void) {
        const { peerId } = data        
        this._mediaSoupPeers.set(peerId, { audioConsumer: undefined, videoConsumer: undefined })
        this.emit('new peer', peerId)
        cb({})
    }

    private _onPeerLeft(data: any, cb: (res: any) => void) {
        const { peerId } = data

        const mediaSoupPeer = this._mediaSoupPeers.get(peerId) as MediaSoupPeer        

        this._mediaSoupPeers.delete(peerId)
        mediaSoupPeer.audioConsumer?.close()
        mediaSoupPeer.videoConsumer?.close()

        this.emit('peer left', peerId)
        cb({})
    }

    private _onConsumerClosed(data: any, cb: (res: any) => void) {
        const { peerId, consumerId } = data
        const mediaSoupPeer = this._mediaSoupPeers.get(peerId) as MediaSoupPeer
        
        let consumerToClose: msTypes.Consumer | undefined = undefined
        if (mediaSoupPeer.audioConsumer?.id === consumerId) {
            consumerToClose = mediaSoupPeer.audioConsumer
        } else if (mediaSoupPeer.videoConsumer?.id === consumerId) {
            consumerToClose = mediaSoupPeer.videoConsumer
        } else {
            throw new Error(`consumer id ${consumerId} doesnt exist for ${peerId}`)
        }

        consumerToClose?.close()
        const eventData: PeerTrackData = {
            peerId,
            track: consumerToClose?.track as MediaStreamTrack,
        }
        this.emit(RtcEvent.peerRemovedTrack, eventData)

        cb({})
    }
}