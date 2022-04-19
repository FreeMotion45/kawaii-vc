import { Socket } from "socket.io";

export class VoiceChannel {
    public name: string

    private userIOs: Socket[] = []
    
    constructor(name: string) {
        this.name = name
    }

    public addUser(userIO: Socket) {
        if (this.userIOs.includes(userIO)) {
            throw new Error(`User ${userIO.id} already exists in the current VC room!`);
        }

        this.userIOs.push(userIO)
        console.log(`${userIO.id} joined VC ${this.name}`)
    }

    public removeUser(userIO: Socket) {
        const userIOIndex = this.userIOs.indexOf(userIO)
        this.userIOs.splice(userIOIndex, 1)
        console.log(`${userIO.id} exited from VC ${this.name}`)
    }

    public userExists(userIO: Socket) : boolean {
        return this.userIOs.includes(userIO)
    }

    public streamUserVoice(userIO: Socket, audioBuffer: any) {
        // TODO: Implement this...
        console.log(`${userIO.id} streamd a new voice event!`)
    }
}