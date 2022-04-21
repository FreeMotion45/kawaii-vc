import React from "react";
import { io } from "socket.io-client";
import { VoiceRoom } from '../components/room'
import { AudioRecorder } from "../media/audioRecorder";


export function Main() {
    // const socket = io("http://localhost:42069");
    //const connectToServer = () => {socket.on("connect", () => console.log(socket.id))}
    // socket.on("connect", () => console.log(socket.id))    

    return (
        <div>
            <VoiceRoom />     
        </div>
    );
}





