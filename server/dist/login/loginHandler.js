"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLoginEndpoints = void 0;
const uuid_1 = require("uuid");
class LoginHandler {
    db;
    tokens = new Map();
    invalidationTimeout = new Map();
    tokenTimeoutInSeconds;
    constructor(db, tokenTimeoutInSeconds = 10) {
        this.db = db;
        this.tokenTimeoutInSeconds = tokenTimeoutInSeconds;
    }
    generateToken() {
        return (0, uuid_1.v4)();
    }
    invalidateTokenForUser(username) {
        if (this.tokens.has(username)) {
            const tokenToDelete = this.tokens.get(username);
            this.tokens.delete(username);
            this.invalidationTimeout.delete(tokenToDelete.token);
        }
    }
    issueTokenForUser(username) {
        const token = this.tokens.get(username);
        if (token !== undefined) {
            clearTimeout(this.invalidationTimeout.get(token.token));
        }
        const newToken = {
            token: this.generateToken(),
            expirationDate: Date.now() + this.tokenTimeoutInSeconds * 1000,
        };
        const invalidationTimeout = setTimeout(() => this.invalidateTokenForUser(username), this.tokenTimeoutInSeconds * 1000);
        this.invalidationTimeout.set(newToken.token, invalidationTimeout);
        this.tokens.set(username, newToken);
        return newToken;
    }
    renewToken(token) {
        const tokenTimeout = this.invalidationTimeout.get(token);
        if (tokenTimeout !== undefined) {
            clearTimeout(tokenTimeout);
        }
        for (const [username, associatedToken] of this.tokens.entries()) {
            if (associatedToken.token === token) {
                const invalidationTimeout = setTimeout(() => this.invalidateTokenForUser(username), this.tokenTimeoutInSeconds * 1000);
                this.invalidationTimeout.set(token, invalidationTimeout);
                break;
            }
        }
    }
    tryLogin(username, password) {
        const user = this.db.getUserCredentials(username);
        if (user === undefined)
            return { success: false, error: 'bad username' };
        if (user.password !== password)
            return { success: false, error: 'bad password' };
        return { success: true, token: this.issueTokenForUser(username) };
    }
    tryTokenLogin(token) {
        if (!this.invalidationTimeout.has(token))
            return false;
        this.renewToken(token);
        return true;
    }
    tryRegister(username, password) {
        return this.db.tryRegister(username, password);
    }
}
const registerLoginEndpoints = (app, loginDB) => {
    const loginHandler = new LoginHandler(loginDB);
    app.post('/tokenLogin', (req, res) => {
        const { token } = req.body;
        const isLoginSuccessfull = loginHandler.tryTokenLogin(token);
        if (isLoginSuccessfull) {
            console.log(`Succesfully renewed token: ${token}`);
        }
        return res.json({
            success: isLoginSuccessfull
        });
    });
    app.post('/login', (req, res) => {
        const { username, password } = req.body;
        const loginResult = loginHandler.tryLogin(username, password);
        if (loginResult.success) {
            console.log(`Sucessfull login for user: ${username}`);
            res.json({
                success: true,
                token: loginResult.token,
            });
        }
        else {
            console.log(`Unsuccessfull login attempt to user: ${username}`);
            res.json({
                success: false,
                error: loginResult.error
            });
        }
    });
    app.post('/register', (req, res) => {
        const { username, password } = req.body;
        const success = loginHandler.tryRegister(username, password);
        if (success) {
            console.log(`Registered ${username}`);
        }
        res.json({
            success,
        });
    });
};
exports.registerLoginEndpoints = registerLoginEndpoints;
//# sourceMappingURL=loginHandler.js.map