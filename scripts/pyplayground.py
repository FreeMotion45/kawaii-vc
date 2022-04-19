from http import client
import socketio

sio = socketio.Client()
sio.connect('http://localhost:42069')

sio.emit('join voice channel', 'general')

sio.emit('voice', 'voice...')
sio.emit('voice', 'voice...')
sio.emit('voice', 'voice...')

sio.emit('exit voice channel')
