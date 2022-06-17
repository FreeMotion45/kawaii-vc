import { EventEmitter } from "events";
import { types as msTypes } from "mediasoup-client"

export enum RtcEvent {
    peerAddedTrack = 'track added',
    peerRemovedTrack = 'track removed'
}

export interface PeerTrackData {
    peerId: string,
    track: MediaStreamTrack,
}

export const emptyPeer: MediaSoupPeer = {
    audioConsumer: undefined,
    videoConsumer: undefined
}

export interface MediaSoupPeer {
    audioConsumer: msTypes.Consumer | undefined,
    videoConsumer: msTypes.Consumer | undefined,
}

// export interface Peer {
//     id: string,
//     audio: MediaStreamTrack | undefined,
//     video: MediaStreamTrack | undefined
// }

export class Peer extends EventEmitter {
    private _id: string
    private _audio: MediaStreamTrack | undefined
    private _video: MediaStreamTrack | undefined

    public static from(other: Peer) {
        return new Peer(other.id, other.audio, other.video)
    }

    public constructor(id: string,
                       audio: MediaStreamTrack | undefined = undefined,
                       video: MediaStreamTrack | undefined = undefined)
    {
        super()
        this._id = id
        this._audio = audio
        this._video = video
    }

    public get id() {
        return this._id
    }

    public get audio() {
        return this._audio
    }

    public get video() {
        return this._video
    }

    public hasTrack(kind: msTypes.MediaKind) {
        if (kind === 'audio') {
            return this._audio !== undefined
        } else {
            return this._video !== undefined
        }
    }

    public setTrack(track: MediaStreamTrack) {        
        if (track.kind === 'audio') {
            return new Peer(this._id, track, this._video)
        } else {
            return new Peer(this._id, this._audio, track)
        }
    }

    public removeTrack(track: MediaStreamTrack) {
        if (track.kind === 'audio') {
            return new Peer(this._id, undefined, this._video)
        } else {
            return new Peer(this._id, this._audio, undefined)
        }
    }
}