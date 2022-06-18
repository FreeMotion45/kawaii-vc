"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerKawaiiServerSocketIO = void 0;
const voiceChannel_1 = require("./vc/voiceChannel");
const mediasoup_1 = require("mediasoup");
class KawaiiServer {
    _io;
    _voiceChannels = [];
    _userRoom = new Map();
    _worker;
    constructor() { }
    async initialize(io) {
        await this._initializeMediaSoup();
        this._io = io;
        await this.createVoiceChannel('general');
        // await this.createVoiceChannel('reshef-zoid')
        // await this.createVoiceChannel('yoav public-baths')
        // await this.createVoiceChannel('gabi-power-up-star')
        // await this.createVoiceChannel('dani-zaurus')
        console.log('Registering Dani SUCC events...');
        this._io.on('connect', (socket) => this.onUserConnect(socket));
        console.log('Registered To Dani connect event!');
    }
    async _initializeMediaSoup() {
        this._worker = await (0, mediasoup_1.createWorker)();
    }
    async createVoiceChannel(name) {
        const router = await this._worker.createRouter({
            mediaCodecs: [
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {
                        'x-google-start-bitrate': 1000
                    }
                }
            ]
        });
        this._voiceChannels.push(new voiceChannel_1.VoiceChannel(name, router));
    }
    onUserConnect(userIo) {
        const clientSession = {
            socket: userIo,
            currentChannel: undefined
        };
        console.log(`${userIo.id} connected!`);
        userIo.broadcast.emit("chat message", {
            message: `${userIo.id} connected.`
        });
        userIo.on('disconnect', () => {
            userIo.broadcast.emit("chat message", {
                message: `${userIo.id} has disconnected.`
            });
            if (clientSession.currentChannel !== undefined) {
                clientSession.currentChannel.removeUser(userIo);
            }
            console.log(`${userIo.id} disconnected! Bye bye!`);
        });
        console.log('Registered To Dani dickonnect event!');
        userIo.on('join room', async (data, cb) => {
            const { roomName } = data;
            clientSession.currentChannel = this.getVoiceChannelByName(roomName);
            await clientSession.currentChannel.addUser(userIo);
            cb({});
        });
        userIo.on('leave room', async (cb) => {
            await clientSession.currentChannel.removeUser(userIo);
            clientSession.currentChannel = undefined;
            cb({});
        });
        userIo.on('get voice channels', (cb) => {
            const channelNames = [];
            this._voiceChannels.forEach(channel => {
                channelNames.push(channel.name);
            });
            cb({
                channelNames,
            });
        });
        userIo.on("chat message", messageData => {
            const { message } = messageData;
            userIo.broadcast.emit("chat message", {
                message: `${userIo.id}: ${message}`
            });
        });
    }
    getVoiceChannelByName(voiceChannelName) {
        for (const voiceChannel of this._voiceChannels) {
            if (voiceChannel.name === voiceChannelName) {
                return voiceChannel;
            }
        }
        return undefined;
    }
}
const registerKawaiiServerSocketIO = async (io) => {
    const kws = new KawaiiServer();
    await kws.initialize(io);
};
exports.registerKawaiiServerSocketIO = registerKawaiiServerSocketIO;
//# sourceMappingURL=kawaiiServer.js.map