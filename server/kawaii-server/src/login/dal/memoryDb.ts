export type User = {
    username: string,
    password: string,
}
export interface LoginDB {    
    getUserCredentials(username: string) : User,
    tryRegister(username: string, password: string) : boolean,
}


export class MemoryDB implements LoginDB {
    private users: User[] = []

    private getUser(username: string): User {
        return this.users.find(user => user.username === username)
    }

    public getUserCredentials(username: string) {
        return this.getUser(username)
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