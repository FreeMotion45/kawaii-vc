import React from "react";
import {Room, JoinButton} from './styles/room.styles';


const VoiceRoom = (props: any) => { 
    return (        
        <div className="room">
            <Room> 
                <JoinButton onClick={() => <h1>props.id</h1>}>join!</JoinButton>
            </Room>
        </div>
    );
}


export default VoiceRoom;