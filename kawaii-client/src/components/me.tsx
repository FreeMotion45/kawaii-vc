import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { peerStyle, videoCam } from "./styles";
import { If, True, False } from "./if"
import defaultProfileImage from '../imgs/defaultProfileImage.jpg'

interface MeProps {
    videoTrack: MediaStreamTrack | undefined,
}

export const Me = (props: MeProps) => {
    const { videoTrack } = props

    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const startLocalVideoPlayback = async () => {
            if (videoRef.current !== null && videoTrack !== undefined) {
                videoRef.current.srcObject = new MediaStream([ videoTrack ])
            }
        }

        startLocalVideoPlayback()
    })

    return (
        <div style={peerStyle}>
            <If expr={videoTrack !== undefined}>
                <True>
                    <video ref={videoRef} style={videoCam} autoPlay/>
                </True>
                <False>
                    <img src={defaultProfileImage}/>
                </False>
            </If>
        </div>
    );
}
