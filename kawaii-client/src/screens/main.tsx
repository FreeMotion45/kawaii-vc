import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { VoiceRoom } from '../components/room'
import { useRecorder } from "../hooks/useRecorder";
import { AudioRecorder } from "../media/audioRecorder";


export function Main() {
    const { addHandler, removeHandler, audioRecorder } = useRecorder()
    const [record, setRecord] = useState(false)
    const socketRef = useRef(io("http://25.74.212.5:42069"));
    const socket = socketRef.current
    
    let chunks: BlobPart[] = []    

    const voiceTest = (ev: BlobEvent) => {
        chunks.push(ev.data)        
    }

    useEffect(() => {
        if (record) {
            addHandler(voiceTest)
        }

        return () => {
            if (record) {
                removeHandler(voiceTest)
            }
        }
    })

    if (!record) {
        /*
                        <button onClick={async (e) => {                    
                    await audioRecorder.start(1000)                    
                    setRecord(true)
                }}>
                    Voice check start!
                </button>
        */
        return (
            <div>
                <VoiceRoom socket={socket}/>     
            </div>
        );
    }

    return (
        <div>
            <VoiceRoom socket={socket}/>     
            <button onClick={() => {                                           
                audioRecorder.stop()   
                const au = new Audio(window.URL.createObjectURL(new Blob(chunks)))
                au.play()
                setRecord(false)
            }}>
                Voice check stop!
            </button>
        </div>
    );
}





