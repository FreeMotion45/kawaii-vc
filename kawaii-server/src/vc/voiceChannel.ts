import { Socket } from "socket.io";

export class VoiceChannel {
    public name: string

    private _userIOs: Socket[] = []
    
    constructor(name: string) {
        this.name = name
    }

    public get users() {
        return [...this._userIOs]
    }

    public addUser(userIO: Socket) {
        if (this._userIOs.includes(userIO)) {
            throw new Error(`User ${userIO.id} already exists in the current VC room!`);
        }

        this._userIOs.push(userIO)
        console.log(`${userIO.id} joined VC ${this.name}`)
        userIO.join(this.name)
    }

    public removeUser(userIO: Socket) {
        const userIOIndex = this._userIOs.indexOf(userIO)
        this._userIOs.splice(userIOIndex, 1)
        console.log(`${userIO.id} exited from VC ${this.name}`)
        userIO.leave(this.name)
    }

    public userExists(userIO: Socket) : boolean {
        return this._userIOs.includes(userIO)
    }

    public streamUserVoice(userIO: Socket, audioBuffer: any) {        
        console.log(`${userIO.id} streamed a new voice event!`)
        userIO.to(this.name).emit('voice', userIO.id, audioBuffer)
        userIO.emit('voice', userIO.id, audioBuffer)              
    }

    public async sendRTCOfferToPeer(callerIO: Socket, targetPeer: string, offer: RTCSessionDescriptionInit) {
        return new Promise<RTCSessionDescriptionInit>((resolve) => {
            for (const userIO of this._userIOs) {
                if (userIO.id === targetPeer) {
                    userIO.emit('rtc offer', callerIO.id, offer, (answer: RTCSessionDescriptionInit) => {
                        resolve(answer)
                    })
                }
            }
        })
    }

    public sendICECandidate(senderIO: Socket, targetPeer: string, iceCandidate: RTCIceCandidate) {
        for (const userIO of this._userIOs) {
            if (userIO.id === targetPeer) {
                userIO.emit('ice candidate', senderIO.id, iceCandidate)
            }
        }
    }
}