import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { UserCameraDisplay as UserProfileDisplay } from "./peer";
import { roomStyle, videoCam, peerStyle } from "./styles";
import { WebRtcConnection } from "../network/webRtcConnection";
import { SignallingChannel } from "../network/signallingChannel";
import { Peer } from "../network/webRtcPeer";
import { setInterval } from "timers/promises";


export const VoiceRoom = (props: {
    joinRoom: (name: string) => Promise<any>,
    signallingChannel: SignallingChannel
}) => {    
    const { signallingChannel, joinRoom } = props; 
    const [peers, setPeers] = useState<Peer[]>([])
    const [webRtcConnection, setWebRtcConnection] = useState<WebRtcConnection>(new WebRtcConnection(signallingChannel))

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

    const getPeerById = (id: string) => {
        for (const peer of peers) {
            if (peer.id === id) {
                return peer
            }
        }
    }

    const onNewPeer = (data: any, cb: (res: any) => void) => {        
        setPeers([...peers, {
            id: data.peerId,
            audioTrack: null,
            videoTrack: null,
        }])

        cb({})
    }

    const onNewConsumer = async (data: any, cb: (res: any) => void) => {
        const {
            peerId,
            consumerId,
            producerId,
            kind,
            rtpParameters
        } = data

        const copyPeers = [...peers]
        
        for (const peer of copyPeers) {
            if (peer.id !== peerId) {
                continue
            }

            const consumer = await webRtcConnection.createReadyConsumer(
                consumerId,
                producerId,
                kind,
                rtpParameters
            )

            if (consumer !== undefined) {
                if (consumer.kind === 'audio') {
                    peer.audioTrack = consumer.track
                } else {
                    peer.videoTrack = consumer.track
                }
                await webRtcConnection.signallingChannel.resume(consumerId)
            }
        }

        cb({})
        setPeers(copyPeers)
    }

    const joinVc = async () => {
        await joinRoom("general")

        await webRtcConnection.load()
        setWebRtcConnection(webRtcConnection)

        const media = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        })
        console.log(media.getAudioTracks().length)
        console.log(media.getAudioTracks()[0].getSettings())

        const video: HTMLVideoElement = document.getElementById('myCamera') as HTMLVideoElement

        const videoProducer = await webRtcConnection.produceTrack({ track: media.getVideoTracks()[0] })
        const audioProducer = await webRtcConnection.produceTrack({
            track: media.getAudioTracks()[0],
            codecOptions: {                
                opusMaxAverageBitrate: 64000,
            }
        })
        if (videoProducer !== undefined && videoProducer.track !== null) {
            video.srcObject = new MediaStream([ videoProducer.track ])
            video.play()
        }

        const peers: Peer[] = []
        const consumePeer = async (peerId: string) => {
            const consumers = await webRtcConnection.consumePeer(peerId)

            let videoTrack: MediaStreamTrack | null = null
            let audioTrack: MediaStreamTrack | null = null

            for (const consumer of consumers) {
                if (consumer.kind === 'video') {
                    videoTrack = consumer.track                    
                } else if (consumer.kind === 'audio') {
                    audioTrack = consumer.track
                }
                await webRtcConnection.signallingChannel.resume(consumer.id)
            }

            peers.push({
                id: peerId,
                videoTrack,
                audioTrack
            })

            window.setInterval(async () => {
                printMap(await consumers[1]?.rtpReceiver?.getStats())
            }, 1000)
        }

        for (const peerId of await webRtcConnection.signallingChannel.getPeersInRoom()) {
            await consumePeer(peerId)
        }

        setPeers(peers)

        window.setInterval(async () => {
            // printMap(await audioProducer?.getStats())
        }, 1000)        
    }

    const showMyself = async () => {
        const cam = await navigator.mediaDevices.getUserMedia({
            video: true,
        })
        
        const ele = document.getElementById('myCamera') as HTMLVideoElement
        ele.srcObject = cam
        ele.play()
    }

    useEffect(() => {
        webRtcConnection.signallingChannel.on('new peer', onNewPeer)
        webRtcConnection.signallingChannel.on('new consumer', onNewConsumer)

        return () => {
            webRtcConnection.signallingChannel.off('new peer', onNewPeer)
            webRtcConnection.signallingChannel.off('new consumer', onNewConsumer)
        }
    })

    useEffect(() => {
        const inter = window.setInterval(() => {
            peers.forEach(async peer => {
                printMap(await webRtcConnection.consumers[0].getStats())
            })
        }, 1000)

        return () => {
            window.clearInterval(inter)
        }
    })

    return (
        <div>
            <div style={roomStyle}>        
                <div style={peerStyle}>
                    <video id="myCamera" style={videoCam}/>
                </div>
                {peers !== undefined && peers.map(peer => {
                    return <UserProfileDisplay key={`peer-profile-display-${peer}`} peerData={peer}/>
                })}
            </div>
            <button onClick={joinVc}>
                Join vc
            </button>
            <button onClick={showMyself}>
                Click here to see yourself :)
            </button>
        </div>
    );
}
