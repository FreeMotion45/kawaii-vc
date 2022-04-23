import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useRecorder } from "../hooks/useRecorder";
import { AudioRecorder } from "../media/audioRecorder";
import { Room, JoinButton, LeaveButton } from './styles/room.styles';


export const VoiceRoom = (props: { socket: Socket }) => {
    const { socket } = props

    return (
        <div className="room">
            <Room> 
                <JoinButton onClick={() => {}}>
                    Join!
                </JoinButton>
                <LeaveButton onClick={() => {}}>
                    Exit voice channel
                </LeaveButton>
            </Room>
        </div>
    );
}




