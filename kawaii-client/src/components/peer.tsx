import React, { useEffect, useRef, useState } from "react";
import { Peer, PeerTrackData, RtcEvent } from "../network/webRtcPeer";
import { If, True, False } from "./if";
import { peerStyle, videoCam } from "./styles";
import defaultProfileImage from "../imgs/defaultProfileImage.png"
import { types as msTypes } from "mediasoup-client";


export const PeerDisplay = (props: {    
    initialPeerState: Peer
}) => {
    const { initialPeerState } = props

    const [peer, setPeer] = useState(initialPeerState)
    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {        
        const startRemoteMedia = () => {
            if (videoRef.current !== null && peer.video !== undefined) {
                videoRef.current.srcObject = new MediaStream([ peer.video ])
            }
    
            if (audioRef.current !== null && peer.audio !== undefined) {
                audioRef.current.srcObject = new MediaStream([ peer.audio ])
            }
        }

        startRemoteMedia()
    })

    useEffect(() => {
        const addTrack = (track: MediaStreamTrack) => {
            setPeer(peer.setTrack(track))
        }

        const removeTrack = (track: MediaStreamTrack) => {
            setPeer(peer.removeTrack(track))
        }

        initialPeerState.on(RtcEvent.peerAddedTrack, addTrack)
        initialPeerState.on(RtcEvent.peerRemovedTrack, removeTrack)

        return () => {
            initialPeerState.off(RtcEvent.peerAddedTrack, addTrack)
            initialPeerState.off(RtcEvent.peerRemovedTrack, removeTrack)
        }
    })

    return (
        <div id={`peer-display-${peer.id}`} style={peerStyle}>
            <If expr={peer.video !== undefined}>
                <True>
                    <video ref={videoRef} style={videoCam} autoPlay/>
                </True>
                <False>
                    <img src={defaultProfileImage}/>
                </False>
            </If>            
            <audio ref={audioRef} autoPlay playsInline/>
        </div>
    );
}
