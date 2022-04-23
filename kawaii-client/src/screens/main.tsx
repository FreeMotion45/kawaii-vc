import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { VoiceRoom } from '../components/room'
import { useRecorder } from "../hooks/useRecorder";
import { AudioRecorder } from "../media/audioRecorder";


export function Main() {
    const socketRef = useRef(io("http://localhost:42069"));
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const socket = socketRef.current

    const connections = new Map<string, RTCPeerConnection>()
    const audios = new Map<string, HTMLAudioElement>()

    const getInputAudioStream = async () => {
        return await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: '3d4293bf8707ec16377db6b175335dce4775456082ad340257a02a19e461aebb'
            }
        })
    }

    const onRemoteStreamAddedTrack = async (peer: string, ev: RTCTrackEvent) => {
        console.log(`RTC: Received new media tracks from ${peer}`)
        if (!audios.has(peer)) {
            audios.set(peer, new Audio())
        }
        
        const audio = audios.get(peer)
        if (audio !== undefined) {
            audio.srcObject = ev.streams[0]
        }
    }

    const addLocalStreamToPeerConnection = (localStream: MediaStream, peerConnection: RTCPeerConnection) => {
        localStream.getTracks().forEach(localTrack => {
            peerConnection.addTrack(localTrack, localStream)
        })
    }

    const onPeerConnectionStateChange = async (peerConnection: RTCPeerConnection, peer: string, ev: any) => {
        if (peerConnection.connectionState === 'connected') {
            console.log(`ICE: Established ICE connection with ${peer}!`)
            const audio = audios.get(peer)
            if (audio !== undefined) {
                await audio.play()
            }
        }
    }

    const onICECandidate = (peer: string, iceCandidate: RTCIceCandidate | null) => {
        if (iceCandidate !== null) {
            console.log(`ICE: Found suitable ICE candidate for ${peer}`)            
            socket.emit('send ice candidate', peer, iceCandidate)
        }
    }

    const joinVc = async () => {
        socket.emit('join voice channel', 'general', async (channelData: { peers: string[] }) => {
            const { peers } = channelData
            for (const peer of peers) {
                console.log(`RTC: Offerring connection to peer: ${peer}`)
                
                const mediaStream = await getInputAudioStream()
                const peerConnection = new RTCPeerConnection(configuration)
                addLocalStreamToPeerConnection(mediaStream, peerConnection)

                peerConnection.onconnectionstatechange = (ev) => onPeerConnectionStateChange(peerConnection, peer, ev)
                peerConnection.onicecandidate = (ev) => onICECandidate(peer, ev.candidate)
                peerConnection.ontrack = ev => onRemoteStreamAddedTrack(peer, ev)

                const offer = await peerConnection.createOffer()
                await peerConnection.setLocalDescription(offer)

                connections.set(peer, peerConnection)

                socket.emit('send rtc offer', peer, offer, async (answer: RTCSessionDescriptionInit) => {
                    console.log(`RTC: Established connection with peer: ${peer}`)
                    console.log(answer)
                    await peerConnection.setRemoteDescription(answer)
                })                
            }
        })
    }

    const receiveOfferAndAnswer = async (callerID: string, offer: RTCSessionDescriptionInit, returnServerAnswer: (answer: RTCSessionDescriptionInit) => any) => {        
        console.log(`RTC: Got offer from: ${callerID}`)
        console.log(offer)

        const mediaStream = await getInputAudioStream()
        const peerConnection = new RTCPeerConnection(configuration)
        addLocalStreamToPeerConnection(mediaStream, peerConnection)

        peerConnection.onicecandidate = (ev) => onICECandidate(callerID, ev.candidate)
        peerConnection.onconnectionstatechange = (ev) => onPeerConnectionStateChange(peerConnection, callerID, ev)        
        peerConnection.ontrack = ev => onRemoteStreamAddedTrack(callerID, ev)      

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        console.log(`RTC: Answering to offer from ${callerID}`)
        returnServerAnswer(answer)

        connections.set(callerID, peerConnection)                
    }

    const receiveICECandidates = async (peer: string, iceCandidate: RTCIceCandidate) => {
        if (connections.has(peer)) {
            const peerConnection = connections.get(peer)
            if (peerConnection !== undefined) {
                await peerConnection.addIceCandidate(iceCandidate)
                console.log(`ICE: received good candidate from ${peer}`)
            }
        }
    }

    useEffect(() => {
        socket.on('rtc offer', receiveOfferAndAnswer)
        socket.on('ice candidate', receiveICECandidates)
        return () => {
            socket.off('rtc offer', receiveOfferAndAnswer)
            socket.off('ice candidate', receiveICECandidates)
        }
    })

    return (
        <div>
            <VoiceRoom socket={socket}/>  
            <button onClick={() => joinVc()}>
                Playback
            </button>         
        </div>
    );
}





