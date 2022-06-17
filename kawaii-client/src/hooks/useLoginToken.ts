import axios from "axios"
import { useEffect, useState } from "react"

export type LoginInfo = {
    username: string,
    token: string,
}

export const useLoginToken = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    
    const tryLoginWithSavedToken = async () => {
        const loginInfoJSON = localStorage.getItem('loginToken')
        if (loginInfoJSON === null) return false

        const loginInfo: LoginInfo = JSON.parse(loginInfoJSON)
        const res = await axios.post('http://localhost:80/tokenLogin', {
            token: loginInfo.token,
        })

        if (res.data.success) {
            setIsLoggedIn(true)
            return true
        }

        localStorage.removeItem('loginToken')
        return false
    }

    const setLoginInfo = (loginInfo: LoginInfo) => {
        localStorage.setItem('loginToken', JSON.stringify(loginInfo))
        setIsLoggedIn(true)
    }

    useEffect(() => {
        const firstTry = async () => {
            setIsLoggedIn(await tryLoginWithSavedToken())
        }
        firstTry()
    }, [])

    return {
        getIsLoggedIn: () => isLoggedIn,
        setLoginInfo,
    }
}