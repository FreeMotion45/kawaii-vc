import { types as msTypes } from "mediasoup"


export class WebRtcClient {
    private _sendTransport: msTypes.WebRtcTransport | undefined
    private _consumerTransport: msTypes.WebRtcTransport | undefined
    private _producers: Map<string, msTypes.Producer>
    private _consumers: Map<string, msTypes.Consumer>
    private _dataProducer: msTypes.DataProducer | undefined
    private _rtpCapabilities: msTypes.RtpCapabilities | undefined
    
    constructor() {
        this._producers = new Map()
        this._consumers = new Map()
    }
    
    public get rtpCapabilities(): msTypes.RtpCapabilities {
        return this._rtpCapabilities
    }
    
    public set rtpCapabilities(value: msTypes.RtpCapabilities) {
        this._rtpCapabilities = value
    }
    
    public get dataProducer(): msTypes.DataProducer {
        return this._dataProducer
    }
    
    public set dataProducer(value: msTypes.DataProducer) {
        this._dataProducer = value
    }
    
    public get sendTransport(): msTypes.WebRtcTransport {
        return this._sendTransport
    }
    
    public set sendTransport(value: msTypes.WebRtcTransport) {
        this._sendTransport = value        
    }

    public get consumerTransport(): msTypes.WebRtcTransport {
        return this._consumerTransport
    }
    
    public set consumerTransport(value: msTypes.WebRtcTransport) {
        this._consumerTransport = value        
    }

    public getProducers() {        
        return [...this._producers.values()]
    }

    public getConsumers() {
        return [...this._consumers.values()]
    }

    public addProducer(producer: msTypes.Producer) {
        this._producers.set(producer.id, producer)
    }

    public removeProducer(producerId: string) {
        this._producers.delete(producerId)
    }

    public addConsumer(consumer: msTypes.Consumer) {
        this._consumers.set(consumer.id, consumer)
    }

    public removeConsumer(consumerId: string) {
        this._consumers.delete(consumerId)
    }

    public close() {
        this._consumerTransport?.close()
        this._sendTransport?.close()
    }
}