import { SignallingChannel } from "./signallingChannel";
import { Device, types as msTypes } from "mediasoup-client"
import { Consumer } from "react";

export class WebRtcConnection {
    private _sendTransport: msTypes.Transport | undefined
    private _consumerTransport: msTypes.Transport | undefined
    private _device: msTypes.Device | undefined
    private _producers: msTypes.Producer[]
    private _consumers: msTypes.Consumer[]

    private _signallingChannel: SignallingChannel

    public constructor(signallingChannel: SignallingChannel) {
        this._signallingChannel = signallingChannel
        this._device = undefined
        this._sendTransport = undefined
        this._consumerTransport = undefined
        this._producers = []
        this._consumers = []
    }

    public async load() {
        const routerRtpCapabilities =  await this.signallingChannel.getRouterRTPCapabilities()
        this._device = new Device()
        await this._device.load({ routerRtpCapabilities })

        await this.signallingChannel.sendRtpCapabilities(this._device.rtpCapabilities)                

        await this.initializeConsumerTransport()
    }

    public get sendTransport() {
        return this._sendTransport
    }

    public get recvTransport() {
        return this._consumerTransport
    }

    public get signallingChannel() {
        return this._signallingChannel
    }

    public get consumers() {
        return this._consumers
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

    public async consumePeer(peerId: string) : Promise<msTypes.Consumer[]> {
        const consumersData = await this._signallingChannel.getPeerConsumers(peerId)            
        const consumers = []
        for (const consumerData of consumersData) {
            const consumer = await this.createReadyConsumer(
                consumerData.id,
                consumerData.producerId,
                consumerData.kind,
                consumerData.rtpParameters,
            )

            if (consumer !== undefined) {
                consumers.push(consumer)            
                this._consumers.push(consumer)
            }
        }
        
        return consumers
    }

    public async createReadyConsumer(
        id: string,
        producerId: string,
        kind: msTypes.MediaKind,
        rtpParameters: msTypes.RtpParameters) {
        if (this._consumerTransport === undefined) {
            await this.initializeConsumerTransport()
        }

        if (this._consumerTransport !== undefined) {
            const consumer = await this._consumerTransport.consume({
                id,
                producerId,
                kind,
                rtpParameters
            })
            this._consumers.push(consumer)
            return consumer
        }
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
        } = await this._signallingChannel.createWebRtcTransport(this._device.sctpCapabilities, 'consumer')

        const consumerTransport = this._device.createRecvTransport({
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters,
        })

        consumerTransport.on('connect', async ({dtlsParameters}, callback, errback) => {
            await this._signallingChannel.connectTransport({
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
        } = await this._signallingChannel.createWebRtcTransport(this._device.sctpCapabilities, 'send')

        const sendTransport = this._device.createSendTransport({
            id, 
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters,
        })

        sendTransport.on('connect', async ({dtlsParameters}, callback, errback) => {
            await this._signallingChannel.connectTransport({
                id: sendTransport.id,
                dtlsParameters: dtlsParameters
            })

            callback()
        })

        sendTransport.on('produce', async (options: msTypes.ProducerOptions, callback, errback) => {
            const producerId = await this._signallingChannel.addNewProducer({ 
                id: sendTransport.id,
                options,
            })

            callback({ id: producerId })
        })

        // sendTransport.on('producedata', async (options: msTypes.DataProducerOptions, callback, errback) => {
        //     const dataProducerId = await this._signallingChannel.addNewDataProducer({
        //         id: sendTransport.id,
        //         options,
        //     })

        //     callback(dataProducerId)
        // })

        this._sendTransport = sendTransport
    }
}