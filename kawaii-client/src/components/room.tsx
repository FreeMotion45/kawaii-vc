import React, { useState } from "react";
import {Room, JoinButton, LeaveButton} from './styles/room.styles';
import { io } from "socket.io-client";
import { ReactMediaRecorder, useReactMediaRecorder} from "react-media-recorder";


const VoiceRoom = (props: any) => {
    const connectionId = props.connection
    const [id, setId] = useState("not joined");
    const {status, startRecording, stopRecording} = useReactMediaRecorder({ audio: true });
    console.log(status)
    return (        
        <div className="room">
            <Room> 
                <JoinButton onClick={voiceStream}>join!</JoinButton>
                <h1 >your id is: {id} </h1>
                <LeaveButton onClick={stopRecording}> work? </LeaveButton>
            </Room>
        </div>
    );
}

const voiceStream = (props:any) => {
    props.connection.emit("send_recording", props.startRecording)
}

export default VoiceRoom;