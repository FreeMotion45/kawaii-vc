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
    private _ws: Socket

    constructor(ws: Socket) {
        this._ws = ws
    }

    public on(ev: string, callback: (data: any, cb: (res: any) => void) => void) {
        this._ws.on(ev, callback)
    }

    public off(ev: string, callback: (data: any, cb: (res: any) => void) => void) {
        this._ws.off(ev, callback)
    }

    public sendRequest(ev: string, data: any) {
        return new Promise((resolve, reject) => {
            this._ws.emit(ev, data, (response: any) => {                
                resolve(response)
            })
        })
    }

    public getPeersInRoom() : Promise<string[]> {
        return new Promise((resolve, reject) => {
            this._ws.emit("get peers in room", (response: any) => {
                const { peers } = response
                resolve(peers)
            })
        })
    }

    public getRouterRTPCapabilities(): Promise<msTypes.RtpCapabilities> {
        return new Promise((resolve, reject) => {
            this._ws.emit("get router rtp capabilities", (rtpCapabilities: msTypes.RtpCapabilities) => {
                resolve(rtpCapabilities)
            })
        })
    }

    public sendRtpCapabilities(rtpCapabilities: msTypes.RtpCapabilities) {
        return new Promise((resolve, reject) => {            
            this._ws.emit("send rtp capabilities", rtpCapabilities, () => {
                resolve(undefined)
            })
        })
    }

    public createWebRtcTransport(deviceSctpCapabilities: msTypes.SctpCapabilities, type: string): Promise<SendTransportParameters> {                
        return new Promise((resolve, reject) => {
            this._ws.emit("create transport", deviceSctpCapabilities, type, (transportParameters: SendTransportParameters) => {
                resolve(transportParameters)
            })
        })
    }

    public resume(consumerId: string) {
        return new Promise((resolve, reject) => {
            this._ws.emit("resume consumer", consumerId, () => {
                resolve({})
            })
        })
    }

    public connectTransport(transportConnectionParameters: TransportConnectionParameters) {
        return new Promise((resolve, reject) => {
            this._ws.emit("transport connect", transportConnectionParameters, () => {
                resolve("ok")
            })
        })
    }

    public addNewProducer(producerParameters: ProducerParameters) {
        return new Promise((resolve, reject) => {
            this._ws.emit("new producer", producerParameters, (producerId: string) => {
                resolve(producerId)
            })
        })
    }

    public getPeerConsumers(peerId: string) : Promise<any[]> {
        return new Promise((resolve, reject) => {
            this._ws.emit("consume peer", peerId, (consumerIds: any[]) => {
                resolve(consumerIds)
            })
        })
    }

    public addNewDataProducer(producerParameters: DataProducerParameters) {
        return new Promise((resolve, reject) => {
            this._ws.emit("new data producer", producerParameters, (producerId: string) => {
                resolve(producerId)
            })
        })
    }    
}