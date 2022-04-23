import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { VoiceRoom } from '../components/room'
import { useRecorder } from "../hooks/useRecorder";
import { AudioRecorder } from "../media/audioRecorder";


export function Main() {
    const socketRef = useRef(io("http://localhost:42069"));
    const socket = socketRef.current

    return (
        <div>
            <VoiceRoom socket={socket}/>           
        </div>
    );
}





