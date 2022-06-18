"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const kawaiiServer_1 = require("./kawaiiServer");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const loginHandler_1 = require("./login/loginHandler");
const memoryDb_1 = require("./login/dal/memoryDb");
const [HTTPS_PORT, HTTP_PORT] = [443, 80];
const getPort = (defaultPort) => {
    if (process.env.PORT !== undefined && process.env.PORT !== null) {
        return Number(process.env.PORT);
    }
    return defaultPort;
};
const startHttpServer = async () => {
    const app = (0, express_1.default)();
    let httpServer, tls;
    try {
        console.log('starting with HTTPS!');
        tls = {
            cert: fs_1.default.readFileSync('./src/cert/public.crt'),
            key: fs_1.default.readFileSync('./src/cert/private.key')
        };
        const port = getPort(HTTPS_PORT);
        console.log(`LISTENING ON PORT ${port}`);
        httpServer = https_1.default.createServer(tls, app).listen(port);
    }
    catch (error) {
        console.log('failed to start HTTPS server, starting HTTP server instead.');
        httpServer = http_1.default.createServer(app).listen(getPort(HTTP_PORT));
    }
    console.log('Starting in ' + process.cwd());
    app.use(express_1.default.static("./static"));
    registerHttpEndpoints(app);
    await startSocketIOServer(httpServer, app);
};
const registerHttpEndpoints = (app) => {
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    (0, loginHandler_1.registerLoginEndpoints)(app, new memoryDb_1.MemoryDB());
};
const startSocketIOServer = async (httpServer, app) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*'
        }
    });
    await (0, kawaiiServer_1.registerKawaiiServerSocketIO)(io);
    app.get('/', (req, res) => {
        res.send('<h1>Hello World!</h1>');
    });
};
startHttpServer();
//# sourceMappingURL=index.js.map