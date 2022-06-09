import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SignallingChannel } from "../network/signallingChannel";
import CSS from 'csstype'
import { VoiceRoom } from "../components/room";
import { MainScreen } from "../components/mainscreen";
import Button from 'react-bootstrap/Button'
import { SideBar } from "../components/sidebar";

const leaveRoomButtonContainerStyle: CSS.Properties = {
    display: 'flex',
    justifyContent: 'center',
}

const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
const socket = io("http://localhost:42069")


export function Main() {
    const socketRef = useRef<Socket | undefined>(undefined);    
    const [signallingChannel, setSignallingChannel] = useState<SignallingChannel | undefined>(undefined)
    const [audioInputDeviceId, setAudioInputDeviceId] = useState<string>()
    const [currentConnectedChannel, setCurrentConnectedChannel] = useState<string | undefined>()

    const leaveCurrentRoom = async () => {
        if (signallingChannel !== undefined && currentConnectedChannel !== undefined) {
            await signallingChannel.send('leave room')
            setCurrentConnectedChannel(undefined)
        }
    }

    const joinRoom = async (channelName: string) => {        
        if (signallingChannel !== undefined) {
            await leaveCurrentRoom()
            await signallingChannel.send('join room', {
                roomName: channelName,
            })

            setCurrentConnectedChannel(channelName)
        }
    }

    useEffect(() => {
        const initWebRtc = async () => {
            const info = await navigator.mediaDevices.enumerateDevices()
            info.forEach(inf => {
                if (inf.kind === 'audioinput') {
                    console.log(`${inf.label}: ${inf.deviceId}`)
                }
            })

            socketRef.current = socket
            setSignallingChannel(new SignallingChannel(socketRef.current))
        }

        initWebRtc()
    }, [])

    const k = (g: string) => {        
        console.log('changed to: ')
        console.log(g)
        setAudioInputDeviceId(g)
    }

    return (
        <div style={{
            display: 'flex',
        }}>
            <SideBar/>
            <div style={{
                width: '100%',
            }}>
                {/* <DeviceSelectionWindow selectedDeviceId={audioInputDeviceId} setSelectedDeviceId={k}/> */}

                { 
                    signallingChannel !== undefined && 
                    <MainScreen                    
                        currentConnectedChannel={currentConnectedChannel} 
                        joinRoom={joinRoom}                    
                        signal={signallingChannel as SignallingChannel}/> 
                }

                {
                    currentConnectedChannel !== undefined &&
                    <div style={leaveRoomButtonContainerStyle}>
                        <Button variant="light" onClick={leaveCurrentRoom}>
                            Leave Room.
                        </Button>
                    </div>
                }

                {
                    currentConnectedChannel !== undefined && 
                    signallingChannel !== undefined &&
                    <VoiceRoom signallingChannel={signallingChannel}/>
                }
            </div>
        </div>
    )
}





