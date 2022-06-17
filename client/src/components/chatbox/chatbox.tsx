import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import "./chatbox.css"
import { socketSend } from "../../network/signallingChannel";

export interface ChatBoxProps {
    socket: Socket
}

export const ChatBox = (props: ChatBoxProps) => {
    const MAX_MESSAGE_HISTORY = 15

    const { socket } = props
    const [messages, setMessages] = useState<string[]>([
        `Joined chat as ${socket.id}`
    ])
    const chatInputRef = useRef<HTMLInputElement>(null)
    const chatMessagesContainer = useRef<HTMLDivElement>(null)

    const addChatMessage = (message: string) => {
        if (messages.length >= MAX_MESSAGE_HISTORY) {
            setMessages(messages
                .slice(-MAX_MESSAGE_HISTORY)
                .concat(message))
        } else {
            setMessages(messages.concat(message))
        }
    }

    const sendChatMessage = () => {
        if (chatInputRef.current !== null) {
            const messageToSend = chatInputRef.current.value

            socketSend(socket, "chat message", {
                message: messageToSend,
            })
            addChatMessage("You: " + messageToSend)
            
            chatInputRef.current.value = ""
        }
    }

    const constructMessage = (message: string, index: Number) => {
        return (
            <div 
                key={`${index}`} 
                className="chat-message">
                <span>
                    {message}
                </span>
            </div>
        )
    }

    const onNewChatMessage = (chatMessageData: any) => {
        const { message } = chatMessageData
        addChatMessage(message)
    }

    useEffect(() => {
        socket.on('chat message', onNewChatMessage)
        
        return () => {
            socket.off('chat message', onNewChatMessage)
        }
    })

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'enter') {
                sendChatMessage()
            }
        }

        if (chatInputRef.current !== null) {
            chatInputRef.current.addEventListener("keydown", onKeyDown)
        }

        return () => {
            if (chatInputRef.current !== null) {
                chatInputRef.current.removeEventListener("keydown", onKeyDown)
            }
        }
    })

    useEffect(() => {
        if (chatMessagesContainer.current !== null) {
            chatMessagesContainer.current.scrollTop = chatMessagesContainer.current.clientHeight
        }
    })

    return (
        <div className="chatbox-container">
            <div
                ref={chatMessagesContainer} 
                className="chat-messages-container">
                {messages.map((message, index) => constructMessage(message, index))}
            </div>

            <InputGroup className="chat-message-form">
                <Form.Control
                    ref={chatInputRef}
                    placeholder="Type a message, then hit <ENTER> to send it."
                />
            </InputGroup>
        </div>
    )
}