import React, { useRef, useState } from "react"
import { Button } from "react-bootstrap"
import Form from "react-bootstrap/Form"
import axios from "axios"
import "./loginPage.css"
import { If, True, False } from "../../components/if"
import LoginScreen from "./login"
import RegisterScreen from "./register"
import "./loginPage.css"

type ScreenType = 'login' | 'register'

export interface LoginPageProps {
    continueToApp: () => void,
}

const LoginPage = (props: LoginPageProps) => {
    const { continueToApp } = props
    
    const [screenType, setScreenType] = useState<ScreenType>('login')

    const switchToRegisterPage = () => {
        setScreenType('register')
    }

    const returnToLoginPage = () => {
        setScreenType('login')
    }

    return (
        <>
            <If expr={screenType === 'login'}>
                <True>
                    <LoginScreen 
                        switchToRegisterPage={switchToRegisterPage}
                        loggedIn={continueToApp}/>
                </True>
                <False>
                    <RegisterScreen returnToLoginScreen={returnToLoginPage}/>
                </False>
            </If>
        </>
    )
}

export default LoginPage