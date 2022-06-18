"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRtcClient = void 0;
class WebRtcClient {
    _sendTransport;
    _consumerTransport;
    _producers;
    _consumers;
    _dataProducer;
    _rtpCapabilities;
    constructor() {
        this._producers = new Map();
        this._consumers = new Map();
    }
    get rtpCapabilities() {
        return this._rtpCapabilities;
    }
    set rtpCapabilities(value) {
        this._rtpCapabilities = value;
    }
    get dataProducer() {
        return this._dataProducer;
    }
    set dataProducer(value) {
        this._dataProducer = value;
    }
    get sendTransport() {
        return this._sendTransport;
    }
    set sendTransport(value) {
        this._sendTransport = value;
    }
    get consumerTransport() {
        return this._consumerTransport;
    }
    set consumerTransport(value) {
        this._consumerTransport = value;
    }
    getProducers() {
        return [...this._producers.values()];
    }
    getConsumers() {
        return [...this._consumers.values()];
    }
    addProducer(producer) {
        this._producers.set(producer.id, producer);
    }
    removeProducer(producerId) {
        this._producers.delete(producerId);
    }
    addConsumer(consumer) {
        this._consumers.set(consumer.id, consumer);
    }
    removeConsumer(consumerId) {
        this._consumers.delete(consumerId);
    }
    close() {
        this._consumerTransport?.close();
        this._sendTransport?.close();
    }
}
exports.WebRtcClient = WebRtcClient;
//# sourceMappingURL=webRtcCollector.js.map