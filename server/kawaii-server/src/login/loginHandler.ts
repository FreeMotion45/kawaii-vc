import express from 'express'
import { LoginDB } from './dal/memoryDb'
import { v4 as uuidv4 } from 'uuid';

type Token = {
    token: string,
    expirationDate: number,    
}

type LoginError = 'bad username' | 'bad password'

type LoginResult = {
    success: boolean,
    error?: LoginError,
    token?: Token,
}

class LoginHandler {
    private db: LoginDB
    private tokens: Map<string, Token> = new Map()
    private invalidationTimeout: Map<string, NodeJS.Timeout> = new Map()
    private tokenTimeoutInSeconds: number

    public constructor(db: LoginDB, tokenTimeoutInSeconds: number = 10) {
        this.db = db
        this.tokenTimeoutInSeconds = tokenTimeoutInSeconds
    }

    private generateToken() {
        return uuidv4()
    }

    private invalidateTokenForUser(username: string) {
        if (this.tokens.has(username)) {
            const tokenToDelete = this.tokens.get(username)
            this.tokens.delete(username)
            this.invalidationTimeout.delete(tokenToDelete.token)
        }
    }

    private issueTokenForUser(username: string) : Token {
        const token = this.tokens.get(username)
        if (token !== undefined) {
            clearTimeout(this.invalidationTimeout.get(token.token))
        }

        const newToken = {
            token: this.generateToken(),
            expirationDate: Date.now() + this.tokenTimeoutInSeconds * 1000,
        }

        const invalidationTimeout = setTimeout(() => this.invalidateTokenForUser(username), this.tokenTimeoutInSeconds * 1000)
        this.invalidationTimeout.set(newToken.token, invalidationTimeout)

        this.tokens.set(username, newToken)
        return newToken
    }

    private renewToken(token: string) {
        const tokenTimeout = this.invalidationTimeout.get(token)
        if (tokenTimeout !== undefined) {
            clearTimeout(tokenTimeout)
        }

        for (const [username, associatedToken] of this.tokens.entries()) {
            if (associatedToken.token === token) {
                const invalidationTimeout = setTimeout(() => this.invalidateTokenForUser(username), this.tokenTimeoutInSeconds * 1000)
                this.invalidationTimeout.set(token, invalidationTimeout)
                break
            }
        }
    }

    public tryLogin(username: string, password: string) : LoginResult {
        const user = this.db.getUserCredentials(username)
        if (user === undefined) return { success: false, error: 'bad username' }
        if (user.password !== password) return { success: false, error: 'bad password' }
        return { success: true, token: this.issueTokenForUser(username)}
    }

    public tryTokenLogin(token: string) : boolean {
        if (!this.invalidationTimeout.has(token)) return false

        this.renewToken(token)
        return true
    }

    public tryRegister(username: string, password: string) : boolean {
        return this.db.tryRegister(username, password)
    }
}

export const registerLoginEndpoints = (app: express.Application, loginDB: LoginDB) => {
    const loginHandler = new LoginHandler(loginDB)

    app.post('/tokenLogin', (req, res) => {
        const { token } = req.body
        const isLoginSuccessfull = loginHandler.tryTokenLogin(token)

        if (isLoginSuccessfull) {
            console.log(`Succesfully renewed token: ${token}`)
        }

        return res.json({
            success: isLoginSuccessfull
        })
    })

    app.post('/login', (req, res) => {
        const { username, password } = req.body
        const loginResult = loginHandler.tryLogin(username, password)
        
        if (loginResult.success) {
            console.log(`Sucessfull login for user: ${username}`)
            res.json({
                success: true,
                token: loginResult.token,
            })
        } else {
            console.log(`Unsuccessfull login attempt to user: ${username}`)
            res.json({
                success: false,
                error: loginResult.error
            })
        }
    })

    app.post('/register', (req, res) => {
        const { username, password } = req.body
        const success = loginHandler.tryRegister(username, password)
        if (success) {
            console.log(`Registered ${username}`)
        }
        res.json({
            success,
        })
    })
}