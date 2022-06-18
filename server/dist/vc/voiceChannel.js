"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceChannel = void 0;
const signallingChannel_1 = require("../network/signallingChannel");
const webRtcCollector_1 = require("./webRtcCollector");
class VoiceChannel {
    name;
    _userIOs = [];
    _router;
    _webRtcClients;
    _signallingChannel;
    constructor(name, router) {
        this.name = name;
        this._router = router;
        this._webRtcClients = new Map();
        this._signallingChannel = new Map();
    }
    get users() {
        return [...this._userIOs];
    }
    get msRouter() {
        return this._router;
    }
    async addUser(userIO) {
        if (this._userIOs.includes(userIO)) {
            throw new Error(`User ${userIO.id} already exists in the current VC room!`);
        }
        this._userIOs.push(userIO);
        console.log(`${userIO.id} joined VC ${this.name}`);
        userIO.join(this.name);
        this._signallingChannel.set(userIO.id, new signallingChannel_1.SignallingChannel(this, userIO));
        this._signallingChannel.get(userIO.id).subscribeEvents();
        this._webRtcClients.set(userIO.id, new webRtcCollector_1.WebRtcClient());
        for (const peer of this._userIOs) {
            if (peer !== userIO) {
                const signallingChannel = this._signallingChannel.get(peer.id);
                await signallingChannel.send('new peer', {
                    peerId: userIO.id
                });
            }
        }
    }
    async removeUser(userIO) {
        const userIOIndex = this._userIOs.indexOf(userIO);
        this._userIOs.splice(userIOIndex, 1);
        console.log(`${userIO.id} exited from VC ${this.name}`);
        userIO.leave(this.name);
        const rtcClient = this._webRtcClients.get(userIO.id);
        this._signallingChannel.get(userIO.id).unsubscribeEvents();
        this._signallingChannel.delete(userIO.id);
        this._webRtcClients.delete(userIO.id);
        for (const peer of this._userIOs) {
            const signal = this._signallingChannel.get(peer.id);
            await signal.send('peer left', { peerId: userIO.id });
        }
        rtcClient.close();
    }
    userExists(userIO) {
        return this._userIOs.includes(userIO);
    }
    async createWebRtcTransport(client, options, type) {
        const webRtcClient = this._webRtcClients.get(client.id);
        if (type === 'send') {
            if (webRtcClient.sendTransport !== undefined) {
                return webRtcClient.sendTransport;
            }
            const transport = await this._router.createWebRtcTransport(options);
            webRtcClient.sendTransport = transport;
            console.log(`${client.id}: Created Web Rtc SEND Transport`);
            return transport;
        }
        else if (type === 'consumer') {
            if (webRtcClient.consumerTransport !== undefined) {
                return webRtcClient.consumerTransport;
            }
            const transport = await this._router.createWebRtcTransport(options);
            webRtcClient.consumerTransport = transport;
            console.log(`${client.id}: Created Web Rtc RECV Transport`);
            return transport;
        }
    }
    async connectTransport(client, transportId, dtlsParameters) {
        const webRtcClient = this._webRtcClients.get(client.id);
        if (webRtcClient.sendTransport !== undefined && webRtcClient.sendTransport.id === transportId) {
            console.log(`${client.id}: Connected Web Rtc SEND Transport`);
            await webRtcClient.sendTransport.connect({ dtlsParameters });
        }
        else if (webRtcClient.consumerTransport !== undefined && webRtcClient.consumerTransport.id === transportId) {
            console.log(`${client.id}: Connected Web Rtc RECV Transport`);
            await webRtcClient.consumerTransport.connect({ dtlsParameters });
        }
    }
    async addProducer(client, transportId, options) {
        const webRtcClient = this._webRtcClients.get(client.id);
        const producer = await webRtcClient.sendTransport.produce(options);
        webRtcClient.addProducer(producer);
        const promises = [];
        for (const peer of this._userIOs) {
            if (peer === client)
                continue;
            const consumerForPeer = await this.consumeProducer(peer, producer);
            const signallingChannel = this._signallingChannel.get(peer.id);
            promises.push(signallingChannel.send('new consumer', {
                peerId: client.id,
                consumerId: consumerForPeer.id,
                producerId: consumerForPeer.producerId,
                kind: consumerForPeer.kind,
                rtpParameters: consumerForPeer.rtpParameters
            }));
        }
        await Promise.all(promises);
        console.log(`${client.id}: Added a new producer. (${producer.id})`);
        return producer;
    }
    async closeProducer(client, producerId) {
        const webRtcClient = this._webRtcClients.get(client.id);
        const producerToClose = webRtcClient.getProducers().find(p => producerId === p.id);
        producerToClose.close();
        const promises = [];
        for (const [peerId, peerClient] of this._webRtcClients.entries()) {
            if (peerId === client.id)
                continue;
            const peerSignal = this._signallingChannel.get(peerId);
            for (const consumer of peerClient.getConsumers()) {
                if (consumer.producerId === producerId) {
                    const promise = peerSignal.send('close consumer', {
                        peerId: client.id,
                        consumerId: consumer.id,
                    });
                    peerClient.removeConsumer(consumer.id);
                    promises.push(promise);
                }
            }
        }
        await Promise.all(promises);
        webRtcClient.removeProducer(producerId);
        console.log(`${client.id}: Removed producer. (${producerId})`);
    }
    setRtpCapabilities(client, rtpCapabilities) {
        this._webRtcClients.get(client.id).rtpCapabilities = rtpCapabilities;
    }
    async consumePeer(client, peerId) {
        const peerWebRtcClient = this._webRtcClients.get(peerId);
        const consumerOptions = [];
        for (const peerProducer of peerWebRtcClient.getProducers()) {
            const consumer = await this.consumeProducer(client, peerProducer);
            if (consumer === undefined) {
                continue;
            }
            consumerOptions.push({
                id: consumer.id,
                producerId: consumer.producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            });
        }
        return consumerOptions;
    }
    async resumeConsumer(client, consumerId) {
        const webRtcClient = this._webRtcClients.get(client.id);
        for (const consumer of webRtcClient.getConsumers()) {
            if (consumer.id === consumerId) {
                await consumer.resume();
                console.log("Resumed consumer!");
            }
        }
    }
    async addDataProduer(client, transportId, options) {
        const webRtcClient = this._webRtcClients.get(client.id);
        webRtcClient.dataProducer = await webRtcClient.sendTransport.produceData(options);
        console.log(`${client.id}: Added a new data producer.`);
        return webRtcClient.dataProducer;
    }
    async consumeProducer(client, producer) {
        const consumerClient = this._webRtcClients.get(client.id);
        if (!this._router.canConsume({
            producerId: producer.id,
            rtpCapabilities: consumerClient.rtpCapabilities
        })) {
            return undefined;
        }
        const consumer = await consumerClient.consumerTransport.consume({
            producerId: producer.id,
            rtpCapabilities: consumerClient.rtpCapabilities,
            paused: true,
        });
        // consumer.on('producerclose', async () => {
        //     const signal = this._signallingChannel.get(client.id)
        //     await signal.send('consumer closed', {
        //         id: consumer.id,
        //     })
        // })
        consumerClient.addConsumer(consumer);
        return consumer;
    }
}
exports.VoiceChannel = VoiceChannel;
//# sourceMappingURL=voiceChannel.js.map