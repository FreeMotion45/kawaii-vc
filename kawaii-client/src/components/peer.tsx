import React, { useEffect, useRef, useState } from "react";
import { Peer } from "../network/webRtcPeer";
import { peerStyle, videoCam } from "./styles";


export const UserCameraDisplay = (props: {
    peerData: Peer,
}) => {
    const { peerData } = props
    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {        
        const startRemoteMedia = async () => {
            if (videoRef.current !== null && peerData.videoTrack !== null) {
                videoRef.current.srcObject = new MediaStream([ peerData.videoTrack])
            }
    
            if (audioRef.current !== null && peerData.audioTrack !== null) {
                audioRef.current.srcObject = new MediaStream([ peerData.audioTrack ])
            }
        }

        startRemoteMedia()

    })

    return (
        <div id={`peer-display-${peerData.id}`} style={peerStyle}>
            <video ref={videoRef} style={videoCam} autoPlay/>
            <audio ref={audioRef} autoPlay playsInline/>
        </div>
    );
}
