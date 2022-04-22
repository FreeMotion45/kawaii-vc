export class AudioRecorder {
    private isRecording: boolean
    private media: MediaRecorder | undefined
    private onDataHandlers: ((ev: BlobEvent) => any)[]

    constructor() {
        this.isRecording = false
        this.onDataHandlers = []
    }

    public isCurrentlyRecording() {
        return this.isRecording
    }

    public async start(timeslice?: number) {
        if (this.isRecording) return

        console.log(navigator.mediaDevices)

        const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: '3d4293bf8707ec16377db6b175335dce4775456082ad340257a02a19e461aebb' },            
        })        

        this.media = new MediaRecorder(audioStream)
        this.media.ondataavailable = (ev: BlobEvent) => {
            console.log('ACTUAL DATA')
            console.log(ev.data)
            this.onData(ev)
        }

        if (timeslice !== undefined)
            this.media.start(timeslice)
        else
            this.media.start() 

        this.isRecording = true
    }

    public stop() {
        if (this.media === undefined || !this.isRecording) return
        this.media.stop()
        this.isRecording = false
    }

    public addHandler(onDataHandler: (ev: BlobEvent) => any) {
        this.onDataHandlers.push(onDataHandler)
    }

    public removeHandler(onDataHandler: (ev: BlobEvent) => any) {        
        this.onDataHandlers.splice(this.onDataHandlers.indexOf(onDataHandler), 1)        
    }

    private onData(ev: BlobEvent) {        
        for (const handler of this.onDataHandlers) {
            handler(ev)
        }
    }
}
