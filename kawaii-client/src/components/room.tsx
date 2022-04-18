import React from "react";
import {Room, JoinButton} from './styles/room.styles';

function VoiceRoom(){

    return (        
        <div className="room">
            <Room> 
                <JoinButton>join!</JoinButton>
            </Room>
        </div>
    );
}

export default VoiceRoom;