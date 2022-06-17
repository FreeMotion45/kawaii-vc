import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SignallingChannel } from "../network/signallingChannel";
import CSS from 'csstype'
import { VoiceRoom } from "../components/room/room";
import { MainScreen } from "../components/mainscreen";
import Button from 'react-bootstrap/Button'
import { SideBar } from "../components/sidebar";
import { ChatBox } from "../components/chatbox/chatbox";
import LoginPage from "./login/loginPage";
import { useLoginToken } from "../hooks/useLoginToken";

const leaveRoomButtonContainerStyle: CSS.Properties = {
    display: 'flex',
    justifyContent: 'center',
}

const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
const socket = io("https://192.168.1.21")


export function Main() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
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

    const continueToApp = () => {
        setIsLoggedIn(true)
    }

    useEffect(() => {
        const initWebRtc = async () => {
            const info = await navigator.mediaDevices.enumerateDevices()
            info.forEach(inf => {
                if (inf.kind === 'audioinput') {
                    console.log(`${inf.label}: ${inf.deviceId}`)
                }
            })

            setSignallingChannel(new SignallingChannel(socket))
        }

        initWebRtc()
    }, [])

    useEffect(() => {
        const onConnect = () => {
            setIsConnected(true)
        }

        socket.on("connect", onConnect)

        return () => {
            socket.off("connect", onConnect)
        }
    }, [])

    if (!isLoggedIn) {
        return (
            <div style={{
                margin: 'auto',
                width: '35%',
                marginTop: '25vh',
                backgroundColor: '#F3F3F3',
                padding: '10px',
                border: 'solid 15px #F3F3F3',
                borderRadius: '20px',
            }}>
                <LoginPage continueToApp={continueToApp}/>
            </div>
        )
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

                {
                    socket.connected &&
                    <ChatBox socket={socket}/>
                }
            </div>
        </div>
    )
}





