import React from "react";
import { io } from "socket.io-client";
import { ReactMediaRecorder } from "react-media-recorder";


export function Main() {
    const socket = io("http://localhost:42069");
    //const connectToServer = () => {socket.on("connect", () => console.log(socket.id))}
    socket.on("connect", () => console.log(socket.id))


    
    return (
        <h1>Hello world</h1>
    );
}


