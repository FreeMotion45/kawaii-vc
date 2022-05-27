import { Socket } from "socket.io";
import { types as msTypes } from "mediasoup"
import { SignallingChannel } from "../network/signallingChannel";
import { WebRtcClient } from "./webRtcCollector";
import { Consumer, ConsumerOptions } from "mediasoup/node/lib/Consumer";
import e from "express";

export class VoiceChannel {    
    public name: string

    private _userIOs: Socket[] = []    
    private _router: msTypes.Router
    
    private _webRtcCollectors: Map<string, WebRtcClient>
    private _signallingChannel: Map<string, SignallingChannel>
    
    constructor(name: string, router: msTypes.Router) {
        this.name = name
        this._router = router
        this._webRtcCollectors = new Map()
        this._signallingChannel = new Map()        
    }

    public get users() {
        return [...this._userIOs]
    }

    public get msRouter() {
        return this._router
    }

    public async addUser(userIO: Socket) {
        if (this._userIOs.includes(userIO)) {
            throw new Error(`User ${userIO.id} already exists in the current VC room!`);
        }        

        this._userIOs.push(userIO)
        console.log(`${userIO.id} joined VC ${this.name}`)
        userIO.join(this.name)        

        this._signallingChannel.set(userIO.id, new SignallingChannel(this, userIO))
        this._signallingChannel.get(userIO.id).subscribeSignallingChannelEvents()

        this._webRtcCollectors.set(userIO.id, new WebRtcClient())

        for (const peer of this._userIOs) {
            if (peer !== userIO) {
                const signallingChannel = this._signallingChannel.get(peer.id)
                await signallingChannel.send('new peer', {
                    peerId: userIO.id
                })
            }
        }
    }

    public removeUser(userIO: Socket) {
        const userIOIndex = this._userIOs.indexOf(userIO)
        this._userIOs.splice(userIOIndex, 1)
        console.log(`${userIO.id} exited from VC ${this.name}`)
        userIO.leave(this.name)
        this._signallingChannel.delete(userIO.id)
    }

    public userExists(userIO: Socket) : boolean {
        return this._userIOs.includes(userIO)
    }

    public async createWebRtcTransport(client: Socket, options: msTypes.WebRtcTransportOptions, type: string) {        
        const webRtcClient = this._webRtcCollectors.get(client.id)
        if (type === 'send') {
            if (webRtcClient.sendTransport !== undefined) {
                return webRtcClient.sendTransport
            }        
    
            const transport = await this._router.createWebRtcTransport(options)        
            webRtcClient.sendTransport = transport
    
            console.log(`${client.id}: Created Web Rtc SEND Transport`)
            return transport
        } else if (type === 'consumer') {
            if (webRtcClient.consumerTransport !== undefined) {
                return webRtcClient.consumerTransport
            }

            const transport = await this._router.createWebRtcTransport(options)        
            webRtcClient.consumerTransport = transport
    
            console.log(`${client.id}: Created Web Rtc RECV Transport`)
            return transport
        }
    }

    public async connectTransport(client: Socket, transportId: string, dtlsParameters: msTypes.DtlsParameters) {
        const webRtcClient = this._webRtcCollectors.get(client.id)
        if (webRtcClient.sendTransport.id === transportId) {
            console.log(`${client.id}: Connected Web Rtc SEND Transport`)
            await webRtcClient.sendTransport.connect({ dtlsParameters })
        } else if (webRtcClient.consumerTransport.id === transportId) {
            console.log(`${client.id}: Connected Web Rtc RECV Transport`)
            await webRtcClient.consumerTransport.connect({ dtlsParameters })
        }        
    }

    public async addProducer(client: Socket, transportId: string, options: msTypes.ProducerOptions) {
        const webRtcClient = this._webRtcCollectors.get(client.id)
        const producer = await webRtcClient.sendTransport.produce(options)
        webRtcClient.addProducer(producer)
        this._userIOs.forEach(async peer => {
            if (peer === client) return
            
            const webRtcPeer = this._webRtcCollectors.get(peer.id)
            const consumerForPeer = await this.createConsumerFromProducer(webRtcPeer, producer)
            webRtcPeer.addConsumer(consumerForPeer)

            const signallingChannel = this._signallingChannel.get(peer.id)
            await signallingChannel.send('new consumer', {
                peerId: client.id,
                consumerId: consumerForPeer.id,
                producerId: consumerForPeer.producerId,
                kind: consumerForPeer.kind,
                rtpParameters: consumerForPeer.rtpParameters
            })
        })

        console.log(`${client.id}: Added a new producer.`)

        return producer
    }

    public setRtpCapabilities(client: Socket, rtpCapabilities: msTypes.RtpCapabilities) {
        this._webRtcCollectors.get(client.id).rtpCapabilities = rtpCapabilities
    }

    public async consumePeer(client: Socket, peerId: string) : Promise<any[]> {
        const webRtcClient = this._webRtcCollectors.get(client.id)
        const peerWebRtcClient = this._webRtcCollectors.get(peerId)

        const consumerOptions = []
        for (const peerProducer of peerWebRtcClient.getProducers()) {            
            const consumer = await this.createConsumerFromProducer(webRtcClient, peerProducer)
            if (consumer === undefined) {
                continue
            }

            webRtcClient.addConsumer(consumer)
            consumerOptions.push({
                id: consumer.id,
                producerId: consumer.producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            })
        }

        return consumerOptions
    }

    public async resumeConsumer(client: Socket, consumerId: string) {
        const webRtcClient = this._webRtcCollectors.get(client.id)
        for (const consumer of webRtcClient.getConsumers()) {
            if (consumer.id === consumerId) {
                await consumer.resume()
                console.log("Resumed consumer!")
            }
        }
    }

    public async addDataProduer(client: Socket, transportId: string, options: msTypes.DataProducerOptions) {
        const webRtcClient = this._webRtcCollectors.get(client.id)
        webRtcClient.dataProducer = await webRtcClient.sendTransport.produceData(options)

        console.log(`${client.id}: Added a new data producer.`)

        return webRtcClient.dataProducer
    }

    private async createConsumerFromProducer(consumerClient: WebRtcClient, producer: msTypes.Producer) {
        if (!this._router.canConsume({
            producerId: producer.id,
            rtpCapabilities: consumerClient.rtpCapabilities
        })) {
            return undefined
        }

        return await consumerClient.consumerTransport.consume({
            producerId: producer.id,
            rtpCapabilities: consumerClient.rtpCapabilities,
            paused: true,
        })
    }
}