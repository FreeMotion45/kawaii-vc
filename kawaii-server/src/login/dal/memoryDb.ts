export interface LoginDB {    
    tryLoginUser(username: string, password: string) : boolean,
    tryRegister(username: string, password: string) : boolean,
}

export type User = {
    username: string,
    password: string,
}

export class MemoryDB implements LoginDB {
    private users: User[] = []

    private getUser(username: string): User {
        return this.users.find(user => user.username === username)
    }

    public tryLoginUser(username: string, password: string) {
        const user = this.getUser(username)
        return user !== undefined && user.password === password
    }

    public tryRegister(username: string, password: string) {
        if (this.getUser(username) !== undefined) {
            return false
        }

        this.users.push({
            username,
            password,
        })

        return true
    }
}