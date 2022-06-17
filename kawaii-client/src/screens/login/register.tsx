import React, { useRef, useState } from "react"
import Button from "react-bootstrap/Button"
import Spinner from "react-bootstrap/Spinner"
import Form from "react-bootstrap/Form"
import axios from "axios"

type RegisterState = 'not registered' | 'waiting server register reply' | 'registered'

export interface RegisterScreenProps {
    returnToLoginScreen: () => void,
}

const RegisterScreen = (props: RegisterScreenProps) => {
    const { returnToLoginScreen } = props

    const [state, setState] = useState<RegisterState>('not registered')
    const registerUsernameRef = useRef<HTMLInputElement>(null)
    const registerPasswordRef = useRef<HTMLInputElement>(null)

    const register = async () => {
        if (state !== 'not registered') return

        setState('waiting server register reply')

        const res = await axios.post('http://localhost:80/register', {
                username: registerUsernameRef.current?.value,
                password: registerPasswordRef.current?.value
        })

        setTimeout(async () => {
            setState('registered')
            console.log('registered!')
            returnToLoginScreen()
        }, 2000)
    }

    if (state === 'waiting server register reply') {
        return (
            <>
                <div className="center-content">
                    <Spinner animation="border"/>
                </div>
            </>
        )
    }

    return (
        <>
            <Form>
                <Form.Group>
                    <Form.Label>Username:</Form.Label>
                    <Form.Control ref={registerUsernameRef} type="input"  placeholder="Username"/>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Password:</Form.Label>
                    <Form.Control ref={registerPasswordRef} type="password" placeholder="Password"/>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Validate password:</Form.Label>
                    <Form.Control type="password" placeholder="Password"/>
                </Form.Group>

                <div className="center-content">
                    <Button
                        className="login-screen-button"
                        variant="light"
                        onClick={(e) => {
                            returnToLoginScreen()
                        }}>
                        Back
                    </Button>

                    <Button 
                        className="login-screen-button" 
                        type="submit"
                        variant="light"
                        onClick={(e) => {
                            e.preventDefault()
                            register()
                        }}>
                        Complete Registration
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default RegisterScreen