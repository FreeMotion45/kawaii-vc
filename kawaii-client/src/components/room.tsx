import React, { useState } from "react";
import {Room, JoinButton, LeaveButton} from './styles/room.styles';
import { io, Socket } from "socket.io-client";
import { ReactMediaRecorder, useReactMediaRecorder} from "react-media-recorder";


export const VoiceRoom = (props: any) => {
    const { socket } = props
    const [id, setId] = useState("not joined");
    const {status, startRecording, stopRecording} = useReactMediaRecorder({ audio: true });
    console.log(status)
    return (        
        <div className="room">
            <Room> 
                <JoinButton onClick={(e) => joinVoiceChannel(socket)}>join!</JoinButton>
                <h1 >your id is: {id} </h1>
                <LeaveButton onClick={stopRecording}> work? </LeaveButton>
            </Room>
        </div>
    );
}

const joinVoiceChannel = (socket: Socket) => {
    socket.emit('join voice channel', 'general')
    console.log('Joined voice channel General!')
}
