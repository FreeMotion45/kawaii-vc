# Kawaii-VC

Kawaii-VC is a personal WebRTC project that I have made
over the course of a few weeks.

The server, can handle multiple rooms. Each room, is a conference VoIP, which also supports video (through a webcam).
Every peer, sees the currently available rooms on the server, and can join any of them (he can not be in two rooms simultaneously.)

There is also a very minimal login / register system I made out of pure curiosity.

# Note
This application works, but its not production worthy. The server can't handle corrupted client/server state.

# Installation
Dependencies:
- Node >= 16.13.2
- npm >= 8.1.2
- python3 >= 3.8 - (required by `mediasoup`)
- pip3 - (required by `mediasoup`)
- cmake - (required by `mediasoup`)


Clone the repo, then run `npm install` to install all the necessary packages. You might need to install `python3`, `pip3` and `cmake`, since they are required to install and build the `mediasoup` package.

# Running the application
Open you terminal and navigate to `kawaii-vc/client` and run `npm run build`. This will build the react app, and move it to `server/static`. The next step is to run the server. Navigate to `kawaii-vc/server` and run `npm start` to run the server. You can also start the server over HTTPS by putting your private key and public certificate into the `server/src/cert` folder.

# Final notes
I have achieved all I wanted in this repo, I successfully created a working voice and video chat. I have even used it to talk and see my family while they were ill with the Covid-19 virus! Since the main goal of this little project has been achieved, I have stopped developing it. If you stumble upon this, I hope it helps you :)

Until next time
    ~ FreeMotion45