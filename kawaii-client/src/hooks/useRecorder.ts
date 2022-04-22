import { useEffect, useRef } from "react"
import { AudioRecorder } from "../media/audioRecorder"

export const useRecorder = () => {
    const audioRecorderRef = useRef(new AudioRecorder())
    const audioRecorder = audioRecorderRef.current
    const handlers: ((ev: BlobEvent) => any)[] = []

    useEffect(() => {
        return () => {
            for (const handler of handlers) {
                audioRecorder.removeHandler(handler)                
            }
        }
    })

    return {
        addHandler: (handler: (ev: BlobEvent) => any) => {
            handlers.push(handler)
            audioRecorder.addHandler(handler)            
        },

        removeHandler: (handler: (ev: BlobEvent) => any) => {
            handlers.splice(handlers.indexOf(handler))
            audioRecorder.removeHandler(handler)
        },

        audioRecorder: audioRecorder,
    }
}
