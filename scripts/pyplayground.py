from http import client
import socketio

sio = socketio.Client()
sio.connect('http://localhost:42069')

sio.emit('join voice channel', { 'voiceChannelName' : 'general' })
sio.emit('exit voice channel')