import React, { useRef, useState } from "react"
import Button from "react-bootstrap/Button"
import Spinner from "react-bootstrap/Spinner"
import Form from "react-bootstrap/Form"
import Alert from "react-bootstrap/Alert"
import axios from "axios"

type RegisterState = 'not registered' | 'waiting server register reply' | 'registered'

export interface RegisterScreenProps {
    returnToLoginScreen: () => void,
}

const RegisterScreen = (props: RegisterScreenProps) => {
    const { returnToLoginScreen } = props

    const [state, setState] = useState<RegisterState>('not registered')
    const [error, setError] = useState<string>('')
    const registerUsernameRef = useRef<HTMLInputElement>(null)
    const registerPasswordRef = useRef<HTMLInputElement>(null)
    const registerPasswordValidateRef = useRef<HTMLInputElement>(null)

    const register = async () => {
        if (state !== 'not registered') return
        
        const username = registerUsernameRef.current?.value
        const password = registerPasswordRef.current?.value
        const passwordValidate = registerPasswordValidateRef.current?.value

        if (password !== passwordValidate) {
            setError('Password and validated password must match.')
            return
        }

        setState('waiting server register reply')

        const res = await axios.post('/register', {
                username,
                password, 
        })

        if (res.data.success) {
            setTimeout(async () => {
                setState('registered')
                returnToLoginScreen()
            }, 2000)
        } else {
            setError('User with this username already exists!')
            setTimeout(() => {
                setState('not registered')
            }, 1000)
        }
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
                    <Form.Control ref={registerPasswordValidateRef} type="password" placeholder="Password"/>
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

            {
                error !== "" &&                
                <Alert className="center-content" variant="danger">
                    <span>
                        {error}
                    </span>
                </Alert>
            }
        </>
    )
}

export default RegisterScreen