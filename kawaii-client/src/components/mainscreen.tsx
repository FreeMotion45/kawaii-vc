import React, { useEffect, useState } from "react"
import { Socket } from "socket.io-client"
import { SignallingChannel } from "../network/signallingChannel"
import CSS from 'csstype'
import Button from 'react-bootstrap/Button'


const channelListContainerStyle: CSS.Properties = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center'
}

const channelContainerStyle: CSS.Properties = {
    display: 'flex',
    flexDirection: 'column',
    margin: '2%',
    padding: '2%',
    borderWidth: '1%',
    borderStyle: 'dashed',
    borderColor: '#E2CFEA',
    borderRadius: '10px',    
}

const channelNameStyle: CSS.Properties = {
    color: '#E2CFEA',
    fontSize: '1.25em',
}

const channelDescriptionStyle: CSS.Properties = {
    color: '#E2CFEA',
    fontSize: '.75em',
}

const joinButtonStyle: CSS.Properties = {
    //justifySelf: 'center'
}

export type MainScreenParameters = {
    signal: SignallingChannel,
    currentConnectedChannel: string | undefined,
    joinRoom: (channelName: string) => void,    
}

export const MainScreen = (props: MainScreenParameters) => {
    const { signal, joinRoom, currentConnectedChannel } = props

    const [availableChannels, setAvailableChannels] = useState<string[]>([
        'test1',
        'test2',
        'test3',
        'test4',
    ])

    const onJoinClick = (channelName: string) => {
        joinRoom(channelName)
    }

    useEffect(() => {
        // if (signal === undefined) return

        const fetchAvailableChannels = async () => {
            const response: any = await signal.send('get voice channels')
            const { channelNames } = response
            setAvailableChannels(channelNames)
        }
        fetchAvailableChannels()
    }, [])

    return (
        <div style={channelListContainerStyle}>
            {
                availableChannels.map(channelName => {
                    return (
                        <div key={channelName} style={channelContainerStyle}>
                            <span style={channelNameStyle}>
                                Name: {`${channelName}`}
                            </span>

                            <span style={channelDescriptionStyle}>
                                Description: None
                            </span>
                            
                            <Button disabled={channelName === currentConnectedChannel}
                                    variant="light"
                                    style={joinButtonStyle} 
                                    onClick={() => onJoinClick(channelName)}>
                                { channelName === currentConnectedChannel ? 'You are currently in this channel' : 'Join' }
                            </Button>
                        </div>
                    )
                })
            }
        </div>
    )
}