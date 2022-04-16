import { Socket } from "socket.io";

class VoiceChatRoom {
    private userIOs: Socket[]
    private audioBuffers: Map<string, any[]>
    
    constructor() { }

    public addUser(userIO: Socket) {
        if (this.userIOs.includes(userIO)) {
            throw new Error(`User ${userIO.id} already exists in the current VC room!`);
        }

        this.userIOs.push(userIO)
    }

    public removeUser(userIO: Socket) {
        const userIOIndex = this.userIOs.indexOf(userIO)
        this.userIOs.splice(userIOIndex, 1)
    }

    public resetAudioSlice() {
        this.audioBuffers.clear()
    }

    public addAudioBuffer(userIO: Socket, audioBuffer: any) {
        if (!this.audioBuffers.has(userIO.id)) {
            this.audioBuffers[userIO.id] = []
        }

        this.audioBuffers[userIO.id].push(audioBuffer)
    }
}