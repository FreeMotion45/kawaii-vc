import { Socket } from "socket.io"
import { VoiceChannel } from "../vc/voiceChannel"

export type ClientSession = {
    socket: Socket,
    currentChannel: VoiceChannel | undefined,
}