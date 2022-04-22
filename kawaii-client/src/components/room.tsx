import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useRecorder } from "../hooks/useRecorder";
import { AudioRecorder } from "../media/audioRecorder";
import { Room, JoinButton, LeaveButton } from './styles/room.styles';


function blobToBase64(blob: Blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = function(e) {
            const srcUrl = reader.result
            resolve(srcUrl)
        };
        reader.readAsDataURL(blob);
    });
}


export const VoiceRoom = (props: { socket: Socket }) => {
    const { socket } = props    
    const { addHandler, removeHandler, audioRecorder } = useRecorder()   
    const [isConnected, setIsConnected] = useState(false)
    const [isRecording, setIsRecording] = useState(false)    

    const streamVoice = async (ev: BlobEvent) => {        
        socket.emit('voice', ev.data)
        console.log('Voice emitted.')
    }

    const receiveVoice = async (userId: string, audioBlob: ArrayBuffer) => {
        const au = new Audio(window.URL.createObjectURL(new Blob([audioBlob])))
        await au.play()
    }

    const joinVoiceChannel = () => {
        socket.emit('join voice channel', 'general', (response: any) => {
            if (response.status !== 'ok') {
                console.log('Error while joining voice channel. Server response was NOT ok!')
                return
            }
    
            setIsConnected(true)            
            console.log('Connected and ready to transmit voice!')
        })
    }

    const exitVoiceChannel = () => {
        socket.emit('exit voice channel', (response: any) => {
            if (response.status !== 'ok') {
                console.log('Error while exiting voice channel. Server response was NOT ok!')
                return
            }
    
            setIsConnected(false)
            audioRecorder.stop()
            console.log('Disconnected from VC')
        })
    }

    useEffect(() => {
        if (isConnected) {
            socket.on('voice', receiveVoice)
            addHandler(streamVoice)

            return () => {
                socket.off('voice', receiveVoice)
                removeHandler(streamVoice)                
            }
        }
    })
    
    if (isConnected && !isRecording) {
        return (
            <div className="room">
                <Room>                
                    <LeaveButton onClick={() => exitVoiceChannel()}>
                        Exit voice channel
                    </LeaveButton>
                </Room>     
                <button onClick={async () => {
                    await audioRecorder.start()
                    setIsRecording(true)
                }}>
                    Recording your beautiful voice!
                </button>       
            </div>
        )
    }

    if (isConnected && isRecording) {
        return (
            <div className="room">
                <Room>
                    <LeaveButton onClick={() => exitVoiceChannel()}>
                        Exit voice channel
                    </LeaveButton>
                </Room>
                <button onClick={() => {
                    audioRecorder.stop()
                    setIsRecording(false)
                }}>
                    Stop recording and send!
                </button>
            </div>
        )
    }

    return (
        <div className="room">
            <Room> 
                <JoinButton onClick={() => joinVoiceChannel()}>
                    Join!
                </JoinButton>
            </Room>
        </div>
    );
}




