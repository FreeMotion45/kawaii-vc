export class AudioRecorder {
    private isRecording: boolean
    private media: MediaRecorder | undefined
    private onDataHandlers: ((ev: BlobEvent) => any)[]

    constructor() {
        this.isRecording = false
        this.onDataHandlers = []
    }

    public async start(timeslice: number) {
        if (this.isRecording) return

        const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        })

        this.media = new MediaRecorder(audioStream)
        this.media.ondataavailable = (ev: BlobEvent) => this.onData(ev)

        if (timeslice > 0)
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
