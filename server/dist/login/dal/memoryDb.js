"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryDB = void 0;
class MemoryDB {
    users = [];
    getUser(username) {
        return this.users.find(user => user.username === username);
    }
    getUserCredentials(username) {
        return this.getUser(username);
    }
    tryRegister(username, password) {
        if (this.getUser(username) !== undefined) {
            return false;
        }
        this.users.push({
            username,
            password,
        });
        return true;
    }
}
exports.MemoryDB = MemoryDB;
//# sourceMappingURL=memoryDb.js.map