import { Device, types as msTypes } from "mediasoup-client";
import { Socket } from "socket.io-client";

type SendTransportParameters = {
    id: string,
    iceParameters: msTypes.IceParameters,
    iceCandidates: msTypes.IceCandidate[],
    dtlsParameters: msTypes.DtlsParameters,
    sctpParameters: msTypes.SctpParameters,
}

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
    private _socket: Socket

    constructor(socket: Socket) {
        this._socket = socket
    }

    public on(ev: string, callback: (data: any, cb: (res: any) => void) => void) {
        this._socket.on(ev, callback)
    }

    public off(ev: string, callback: (data: any, cb: (res: any) => void) => void) {
        this._socket.off(ev, callback)
    }

    public send(ev: string, data?: any) {
        return new Promise((resolve, reject) => {
            if (data === undefined) {
                this._socket.emit(ev, (response: any) => {
                    resolve(response)
                })
            } else {
                this._socket.emit(ev, data, (response: any) => {
                    resolve(response)
                })
            }
        })
    }

    public getPeersInRoom() : Promise<string[]> {
        return new Promise((resolve, reject) => {
            this._socket.emit("get peers in room", (response: any) => {
                const { peers } = response
                resolve(peers)
            })
        })
    }

    public getRouterRTPCapabilities(): Promise<msTypes.RtpCapabilities> {
        return new Promise((resolve, reject) => {
            this._socket.emit("get router rtp capabilities", (rtpCapabilities: msTypes.RtpCapabilities) => {
                resolve(rtpCapabilities)
            })
        })
    }

    public sendRtpCapabilities(rtpCapabilities: msTypes.RtpCapabilities) {
        return new Promise((resolve, reject) => {            
            this._socket.emit("send rtp capabilities", rtpCapabilities, () => {
                resolve(undefined)
            })
        })
    }

    public createWebRtcTransport(deviceSctpCapabilities: msTypes.SctpCapabilities, type: string): Promise<SendTransportParameters> {                
        return new Promise((resolve, reject) => {
            this._socket.emit("create transport", deviceSctpCapabilities, type, (transportParameters: SendTransportParameters) => {
                resolve(transportParameters)
            })
        })
    }

    public resume(consumerId: string) {
        return new Promise((resolve, reject) => {
            this._socket.emit("resume consumer", consumerId, () => {
                resolve({})
            })
        })
    }

    public connectTransport(transportConnectionParameters: TransportConnectionParameters) {
        return new Promise((resolve, reject) => {
            this._socket.emit("transport connect", transportConnectionParameters, () => {
                resolve("ok")
            })
        })
    }

    public addNewProducer(producerParameters: ProducerParameters) {
        return new Promise((resolve, reject) => {
            this._socket.emit("new producer", producerParameters, (producerId: string) => {
                resolve(producerId)
            })
        })
    }

    public getPeerConsumers(peerId: string) : Promise<any[]> {
        return new Promise((resolve, reject) => {
            this._socket.emit("consume peer", peerId, (consumerIds: any[]) => {
                resolve(consumerIds)
            })
        })
    }

    public addNewDataProducer(producerParameters: DataProducerParameters) {
        return new Promise((resolve, reject) => {
            this._socket.emit("new data producer", producerParameters, (producerId: string) => {
                resolve(producerId)
            })
        })
    }    
}