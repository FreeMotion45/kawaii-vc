import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SignallingChannel } from "../network/signallingChannel";
import { Device, types as msTypes } from "mediasoup-client";
import { Me } from "../components/me";
import CSS from 'csstype'
import { VoiceRoom } from "../components/room";
import { WebRtcConnection } from "../network/webRtcConnection";
import { If } from "../components/if";


const bodyStyle: CSS.Properties = {
    margin: "auto",    
    //width: '100vw',
    //height: '100vh',
}


export function Main() {
    const socketRef = useRef<Socket | undefined>(undefined);    
    const [signallingChannel, setSignallingChannel] = useState<SignallingChannel | undefined>(undefined)
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

    const joinRoom = async (name: string) => {
        return new Promise((res, rej) => {
            if (socketRef.current !== undefined) {
                socketRef.current.emit('join room', {
                    roomName: 'general'
                }, res)
            }
        })
    }

    useEffect(() => {
        const initWebRtc = async () => {
            const info = await navigator.mediaDevices.enumerateDevices()
            info.forEach(inf => {
                if (inf.kind === 'audioinput') {
                    console.log(`${inf.label}: ${inf.deviceId}`)
                }
            })

            socketRef.current = io("http://localhost:42069")
            setSignallingChannel(new SignallingChannel(socketRef.current))
        }

        initWebRtc()
    }, [])

    return (
        <div style={bodyStyle}>
            {
                signallingChannel !== undefined && <VoiceRoom joinRoom={joinRoom} signallingChannel={signallingChannel}/>
            }
            {
                signallingChannel === undefined && 
                <div style={{
                        padding: '2%'
                    }}>
                    <span style={{
                        color: 'white',
                        fontSize: '3.5rem',
                    }}>
                        Waiting for server connection...
                    </span>
                </div>
            }
        </div>
    )
}





