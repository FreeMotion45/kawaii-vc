import { useEffect, useRef, useState } from "react";
import { AudioRecorder } from "../media/audioRecorder";
import { Room, JoinButton, LeaveButton } from './styles/room.styles';


const useRecorder = () => {
    const audioRecorderRef = useRef(new AudioRecorder())
    const audioRecorder = audioRecorderRef.current
    const handlers: ((ev: BlobEvent) => any)[] = []

    useEffect(() => {
        return () => {
            for (const handler of handlers) {
                audioRecorder.removeHandler(handler)
                console.log('removed handler')
            }
        }
    })

    return {
        addHandler: (handler: (ev: BlobEvent) => any) => {
            handlers.push(handler)
            audioRecorder.addHandler(handler)
            console.log('added handler')
        },

        removeHandler: (handler: (ev: BlobEvent) => any) => {
            handlers.splice(handlers.indexOf(handler))
            audioRecorder.removeHandler(handler)
        },

        audioRecorder: audioRecorder,
    }
}


export const VoiceRoom = (props: any) => {
    const [id, setId] = useState("not joined")
    const [cnt, setCnt] = useState(1)
    const { addHandler, removeHandler, audioRecorder } = useRecorder()    

    const streamVoice = (ev: BlobEvent) => {
        console.log(`Voice ${cnt}`)
        setCnt((prev) => prev + 1)
    }

    useEffect(() => {
        addHandler(streamVoice)
        return () => removeHandler(streamVoice)
    })

    return (
        <div className="room">
            <Room> 
                <JoinButton onClick={() => audioRecorder.start(1000)}>join!</JoinButton>
                <h1 >your id is: {id} </h1>
                <LeaveButton onClick={() => audioRecorder.stop()}>Exit voice channel</LeaveButton>
            </Room>
        </div>
    );
}
