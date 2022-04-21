import { useEffect, useRef, useState } from "react";
import { AudioRecorder } from "../media/audioRecorder";
import { Room, JoinButton, LeaveButton } from './styles/room.styles';


export const VoiceRoom = (props: any) => {
    const [id, setId] = useState("not joined")

    const [cnt, setCnt] = useState(1)
    const audioRecorderRef = useRef(new AudioRecorder())
    const audioRecorder = audioRecorderRef.current

    const streamVoice = (ev: BlobEvent) => {
        console.log(`Voice ${cnt}`)
        setCnt((prev) => prev + 1)
    }

    useEffect(() => {
        audioRecorder.start(100)
        audioRecorder.addHandler(streamVoice)

        return () => {
            audioRecorder.removeHandler(streamVoice)
        }
    })

    return (
        <div className="room">
            <Room> 
                <JoinButton onClick={() => audioRecorder.start(1000)}>join!</JoinButton>
                <h1 >your id is: {id} </h1>
                <LeaveButton>Exit voice channel</LeaveButton>
            </Room>
        </div>
    );
}
