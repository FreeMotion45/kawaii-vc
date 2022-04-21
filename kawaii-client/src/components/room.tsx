import { useEffect, useState } from "react";
import {Room, JoinButton, LeaveButton} from './styles/room.styles';

type RecorderState = {
    state: string,
    media: MediaRecorder | undefined,
}

const initialState: RecorderState = {
    state: 'stopped',
    media: undefined,
}

const useRecorder = () => {    
    const [recorderState, setRecorderState] = useState(initialState)
    let { media, state } = recorderState

    const startRecord = async (onData: (ev: BlobEvent) => any, timeslice: number = -1) => {
        if (state !== 'stopped') return

        const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        })

        media = new MediaRecorder(audioStream)
        media.ondataavailable = onData

        if (timeslice > 0)
            media.start(timeslice)
        else
            media.start()        
            
        state = 'recording'
    }

    const stopRecord = () => {        
        if (state !== 'recording' || media === undefined) return        
        state = 'stopped'
        media.stop()             
    }  

    return {
        startRecord: startRecord,
        stopRecord: stopRecord,
        changeCallback: (onData: (ev: BlobEvent) => any) => {
            if (media === undefined) return
            media.ondataavailable = onData
        }     
    }
}


export const VoiceRoom = (props: any) => {
    const [id, setId] = useState("not joined")
    const [cnt, setCnt] = useState(1)
    const { stopRecord, startRecord, changeCallback } = useRecorder()
    

    const streamVoice = (ev: BlobEvent) => {
        console.log(`Voice`)
    }

    useEffect(() => {
        startRecord(streamVoice, 1000)

        return () => {
            stopRecord()            
        }
    })

    return (
        <div className="room">
            <Room> 
                <JoinButton onClick={(e) => setId('joined')}>join!</JoinButton>
                <h1 >your id is: {id} </h1>
                <LeaveButton>Exit voice channel</LeaveButton>
            </Room>
        </div>
    );
}
