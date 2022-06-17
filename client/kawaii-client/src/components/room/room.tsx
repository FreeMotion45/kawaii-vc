import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { PeerDisplay } from "../peer";
import { roomStyle, videoCam, peerStyle } from "../styles";
import { WebRtcConnection } from "../../network/webRtcConnection";
import { SignallingChannel } from "../../network/signallingChannel";
import { Peer, PeerTrackData, RtcEvent } from "../../network/webRtcPeer";
import { setInterval } from "timers/promises";
import { False, If, True } from "../if";
import Button from "react-bootstrap/Button"
import { Me } from "../me";
import "./room.css"


type ConnectionStatus = 'connected' | 'connecting' | 'not connected'


const printMap = (map: RTCStatsReport | undefined) => {
    console.log('--------------------')
    map?.forEach((v, k) => {
        if (v.type === 'inbound-rtp' || v.type === 'outbound-rtp') {
            console.log(`----- ${k} -----`)
            Object.keys(v).forEach(property => {
                console.log(`${property}: ${v[property]}`)
            })
        }            
    })
}


export const VoiceRoom = (props: {
    signallingChannel: SignallingChannel
}) => {    
    const { signallingChannel } = props; 

    const [isLocalMuted, setIsLocalMuted] = useState(true)
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | undefined>(undefined)    
    const [peers, setPeers] = useState<Map<string, Peer>>(new Map())
    const [connectionStatus, setConnnectionStatus] = useState<ConnectionStatus>('not connected')
    const webRtcConnectionRef = useRef<WebRtcConnection>(new WebRtcConnection(signallingChannel))
    const webRtcConnection = webRtcConnectionRef.current

    const getPeer = (id: string) => peers.get(id) as Peer

    const addPeer = (id: string) => {
        peers.set(id, new Peer(id))
        setPeers(new Map(peers))
    }

    const removePeer = (id: string) => {
        peers.delete(id)
        setPeers(new Map(peers))
    }

    const toggleMic = async () => {
        if (isLocalMuted) {
            const media = await navigator.mediaDevices.getUserMedia({ audio: true })
            const track = media.getAudioTracks()[0]
            await webRtcConnection.produceTrack({ track })
            setIsLocalMuted(false)
        } else {
            await webRtcConnection.stopProducingTrack('audio')
            setIsLocalMuted(true)
        }
    }

    const toggleVideo = async () => {
        if (localVideoTrack === undefined) {
            try {
                const media = await navigator.mediaDevices.getUserMedia({ video: true })
                const videoTrack = media.getVideoTracks()[0]            
                await webRtcConnection.produceTrack({ track: videoTrack })
                setLocalVideoTrack(videoTrack)
            } catch (err) {
                console.log('Couldnt start a video stream. You probably dont have a camera.')
            }
        } else {
            setLocalVideoTrack(undefined)            
            await webRtcConnection.stopProducingTrack('video')
        }
    }

    const peerAddedTrack = (evData: PeerTrackData) => {
        getPeer(evData.peerId).emit(RtcEvent.peerAddedTrack, evData.track)
    }

    const peerRemovedTrack = (evData: PeerTrackData) => {
        getPeer(evData.peerId).emit(RtcEvent.peerRemovedTrack, evData.track)
    }

    useEffect(() => {        
        webRtcConnection.on('new peer', addPeer)
        webRtcConnection.on('peer left', removePeer)
        webRtcConnection.on(RtcEvent.peerAddedTrack, peerAddedTrack)
        webRtcConnection.on(RtcEvent.peerRemovedTrack, peerRemovedTrack)

        return () => {
            webRtcConnection.off('new peer', addPeer)
            webRtcConnection.off('peer left', removePeer)
            webRtcConnection.off(RtcEvent.peerAddedTrack, peerAddedTrack)
            webRtcConnection.off(RtcEvent.peerRemovedTrack, peerRemovedTrack)
        }
    })

    useEffect(() => {
        const connect = async () => {
            setPeers(await webRtcConnection.connect())
            setConnnectionStatus('connected')
        }

        connect()

        return () => {
            webRtcConnection.disconnect()
        }
    }, [])

    return (
        <div>
            <If expr={connectionStatus === 'not connected'}>
                <True>
                    <span>
                        Connecting...
                    </span>
                </True>
                <False>

                    <div style={{margin: 'auto'}}>
                        <Me videoTrack={localVideoTrack}/>
                    </div>

                    <div className="media-button-container">
                        <Button className="media-button" variant="light" onClick={() => toggleMic()}>
                            { isLocalMuted ? "Enable audio" : "Disable audio" }
                        </Button>

                        <Button className="media-button" variant="light" onClick={() => toggleVideo()}>
                            { localVideoTrack === undefined ? "Enable video" : "Disable video" }
                        </Button>
                    </div>

                    <div style={roomStyle}>
                        {Array.from(peers.entries()).map(([id, peer], _)=> {
                            return <PeerDisplay key={`peer-profile-display-${id}`} initialPeerState={peer}/>
                        })}
                    </div>
                </False>
            </If>
        </div>
    );
}
