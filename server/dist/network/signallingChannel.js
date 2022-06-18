"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignallingChannel = void 0;
class SignallingChannel {
    _voiceChannel;
    _client;
    constructor(voiceChannel, client) {
        this._voiceChannel = voiceChannel;
        this._client = client;
    }
    subscribeEvents() {
        this._client.on("get router rtp capabilities", (callback) => this.onGetRouterRtpCapabilities(callback));
        this._client.on("create transport", (sctpCapabilities, type, callback) => this.onCreateTransport(sctpCapabilities, type, callback));
        this._client.on("transport connect", (connectParams, callback) => this.onConnectTransport(connectParams, callback));
        this._client.on("new producer", (producerParams, callback) => this.onNewProducer(producerParams, callback));
        this._client.on("new data producer", (dataProducerParams, callback) => this.onNewDataProducer(dataProducerParams, callback));
        this._client.on("consume peer", (peerId, callback) => this.onGetPeerConsumers(peerId, callback));
        this._client.on("send rtp capabilities", (rtpCapabilities, callback) => this.onClientSentRtpCapabilities(rtpCapabilities, callback));
        this._client.on("get peers in room", (callback) => this.onGetPeersInRoom(callback));
        this._client.on("resume consumer", (consumerId, callback) => this.resumeConsumer(consumerId, callback));
        this._client.on("close producer", (data, callback) => this.onCloseProducer(data, callback));
    }
    unsubscribeEvents() {
        this._client.removeAllListeners("get router rtp capabilities");
        this._client.removeAllListeners("create transport");
        this._client.removeAllListeners("transport connect");
        this._client.removeAllListeners("new producer");
        this._client.removeAllListeners("new data producer");
        this._client.removeAllListeners("consume peer");
        this._client.removeAllListeners("send rtp capabilities");
        this._client.removeAllListeners("get peers in room");
        this._client.removeAllListeners("resume consumer");
        this._client.removeAllListeners("close producer");
    }
    async send(ev, data) {
        return new Promise((res, rej) => {
            this._client.emit(ev, data, res);
        });
    }
    async resumeConsumer(consumerId, callback) {
        await this._voiceChannel.resumeConsumer(this._client, consumerId);
        callback();
    }
    onGetRouterRtpCapabilities(callback) {
        callback(this._voiceChannel.msRouter.rtpCapabilities);
    }
    onClientSentRtpCapabilities(rtpCapabilities, callback) {
        this._voiceChannel.setRtpCapabilities(this._client, rtpCapabilities);
        callback();
    }
    async onCreateTransport(sctpCapabilities, type, callback) {
        const clientSendTransport = await this._voiceChannel.createWebRtcTransport(this._client, {
            listenIps: [
                { ip: "127.0.0.1" },
                { ip: "192.168.1.21" },
            ],
            enableTcp: true,
            enableUdp: true,
            preferUdp: true,
            enableSctp: Boolean(sctpCapabilities),
            numSctpStreams: sctpCapabilities.numStreams,
        }, type);
        callback({
            id: clientSendTransport.id,
            iceParameters: clientSendTransport.iceParameters,
            iceCandidates: clientSendTransport.iceCandidates,
            dtlsParameters: clientSendTransport.dtlsParameters,
            sctpParameters: clientSendTransport.sctpParameters,
        });
    }
    onGetPeersInRoom(callback) {
        const peers = [];
        this._voiceChannel.users.forEach(peer => {
            if (peer !== this._client) {
                peers.push(peer.id);
            }
        });
        callback({ peers });
    }
    async onConnectTransport(connectionParams, callback) {
        const { id: transportId, dtlsParameters } = connectionParams;
        await this._voiceChannel.connectTransport(this._client, transportId, dtlsParameters);
        callback();
    }
    async onNewProducer(clientProducerParameters, callback) {
        const { id, options } = clientProducerParameters;
        const producer = await this._voiceChannel.addProducer(this._client, id, options);
        callback(producer.id);
    }
    async onCloseProducer(data, cb) {
        const { producerId } = data;
        await this._voiceChannel.closeProducer(this._client, producerId);
        cb({});
    }
    async onGetPeerConsumers(peerId, callback) {
        const consumers = await this._voiceChannel.consumePeer(this._client, peerId);
        callback(consumers);
    }
    async onNewDataProducer(dataProducerParameters, callback) {
        const { id, options } = dataProducerParameters;
        const dataProducer = await this._voiceChannel.addDataProduer(this._client, id, options);
        callback(dataProducer.id);
    }
}
exports.SignallingChannel = SignallingChannel;
//# sourceMappingURL=signallingChannel.js.map