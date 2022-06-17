import React, { useEffect, useRef, useState } from "react"
import { Button } from "react-bootstrap"
import Form from "react-bootstrap/Form"
import Spinner from "react-bootstrap/Spinner"
import Alert from "react-bootstrap/Alert"
import axios from "axios"
import { useLoginToken } from "../../hooks/useLoginToken"

export interface LoginProps {
    switchToRegisterPage: () => void,
    loggedIn: () => void,
}

type LoginState = 'not logged in' | 'logging in' | 'logged in'

const LoginScreen = (props: LoginProps) => {
    const { switchToRegisterPage, loggedIn } = props

    const [error, setError] = useState('')
    const [state, setState] = useState<LoginState>('not logged in')
    const { getIsLoggedIn, setLoginInfo } = useLoginToken()
    const loginUsernameRef = useRef<HTMLInputElement>(null)
    const loginPasswordRef = useRef<HTMLInputElement>(null)

    const login = async () => {
        if (state !== 'not logged in') return

        const username = loginUsernameRef.current?.value as string
        const password = loginPasswordRef.current?.value as string

        setState('logging in')

        const res = await axios.post('/login', {
            username,
            password,
        })

        setTimeout(() => {
            if (res.data.success) {
                setState('logged in')
                setLoginInfo({
                    username: username,
                    token: res.data.token.token,
                })
                loggedIn()
            } else {
                setState('not logged in')
                if (res.data.error === 'bad username') {
                    setError('A user with that username doesnt exist.')
                } else if (res.data.error === 'bad password') {
                    setError('The password you entered is incorrect!')
                }
            }
        }, 1000)
    }

    useEffect(() => {
        if (getIsLoggedIn()) {
            loggedIn()
        }
    })

    if (state === 'logging in') {
        return (
            <div className="center-content">
                <Spinner animation="border"/>
            </div>
        )
    }

    return (
        <>
            <Form>
                <Form.Group>
                    <Form.Label>Username:</Form.Label>
                    <Form.Control ref={loginUsernameRef} type="input"  placeholder="Username"/>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Password:</Form.Label>
                    <Form.Control ref={loginPasswordRef} type="password" placeholder="Password"/>
                </Form.Group>

                <div className="center-content">
                    <Button
                        className="login-screen-button"
                         variant="light"
                         type="submit"
                         onClick={(e) => {
                            e.preventDefault()
                            login()
                        }}>
                        Login
                    </Button>

                    <Button 
                        className="login-screen-button"                        
                        variant="light"
                        onClick={switchToRegisterPage}>
                        Register
                    </Button>
                </div>
            </Form>

            {
                error !== '' &&
                <Alert variant="danger">
                    {error}
                </Alert>
            }
        </>
    )
}

export default LoginScreen