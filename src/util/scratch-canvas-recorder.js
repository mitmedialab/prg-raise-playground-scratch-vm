class ScratchCanvasRecorder {
    constructor(canvas) {
        this.canvas = canvas;
    }

    startCapturing() {
        this.mediaSource = new MediaSource();
        this.mediaSource.addEventListener('sourceopen', this.handleSourceOpen.bind(this), false);
        this.browserMediaRecorder = undefined;
        this.recordedBlobs = undefined;
        this.sourceBuffer = undefined;
        this.recording = false;
        this.video = document.createElement('video');
        this.video.width = 500;
        this.video.height = 500;
        this.video.style.pointerEvents = 'none';
        this.video.style.position = 'fixed';
        this.video.style.top = '0';
        this.video.style.left = '0';
        this.video.style.opacity = '0';
        document.body.appendChild(this.video);
        this.stream = this.canvas.captureStream(); // frames per second
        console.log('Started stream capture from canvas element: ', this.stream);
    }

    handleSourceOpen(event) {
        console.log('MediaSource opened');
        this.sourceBuffer = this.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        console.log('Source buffer: ', this.sourceBuffer);
    }

    handleDataAvailable(event) {
        if (event.data && event.data.size > 0) {
            this.recordedBlobs.push(event.data);
        }
    }

    handleStop(event) {
        console.log('Recorder stopped: ', event);
        const superBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
        this.video.src = window.URL.createObjectURL(superBuffer);
    }

    // The nested try blocks will be simplified when Chrome 47 moves to Stable
    startRecording() {
        this.startCapturing();
        this.recording = true;
        let options = { mimeType: 'video/webm' };
        this.recordedBlobs = [];
        try {
            this.browserMediaRecorder = new MediaRecorder(this.stream, options);
        } catch (e0) {
            console.log('Unable to create MediaRecorder with options Object: ', e0);
            try {
                options = { mimeType: 'video/webm,codecs=vp9' };
                this.browserMediaRecorder = new MediaRecorder(this.stream, options);
            } catch (e1) {
                console.log('Unable to create MediaRecorder with options Object: ', e1);
                try {
                    options = 'video/vp8'; // Chrome 47
                    this.browserMediaRecorder = new MediaRecorder(this.stream, options);
                } catch (e2) {
                    alert('MediaRecorder is not supported by this browser.\n\n' +
                        'Try Firefox 29 or later, or Chrome 47 or later, ' +
                        'with Enable experimental Web Platform features enabled from chrome://flags.');
                    console.error('Exception while creating MediaRecorder:', e2);
                    return;
                }
            }
        }
        console.log('Created MediaRecorder', this.browserMediaRecorder, 'with options', options);
        // TODO: Toggle turn off state
        // recordButton.textContent = 'Stop Recording';
        // playButton.disabled = true;
        // downloadButton.disabled = true;
        this.browserMediaRecorder.onstop = this.handleStop.bind(this);
        this.browserMediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
        this.browserMediaRecorder.start(100); // collect 100ms of data
        console.log('MediaRecorder started', this.browserMediaRecorder);
    }

    stopRecording() {
        this.browserMediaRecorder.stop();
        console.log('Recorded Blobs: ', this.recordedBlobs);
        this.video.controls = true;
        this.recording = false;

    }

    play() {
        this.video.play();
    }

    isRecording() {
        return this.recording;
    }

    sendLastClipToGfy() {
        if (this.lastBlob) {
            this.sendBlobAsBase64(this.lastBlob);
        }
    }

    loadLastClipOnGfy() {
        if (this.lastGfy) {
            this.loadPage(this.lastGfy);
        }
    }

    sendBlobAsBase64(blob) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const dataUrl = reader.result;
            const base64EncodedData = dataUrl.split(',')[1];
            console.log(base64EncodedData)
            this.sendDataToBackend(base64EncodedData);
        });
        reader.readAsDataURL(blob);
    }

    sendDataToBackend(base64EncodedData) {
        const body = JSON.stringify({
            data: base64EncodedData
        });
        nets({
            url: 'https://project-clip-train.glitch.me/gfy',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            encoding: undefined,
            body
        }, (err, resp, body) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Got a response!");
            console.log(resp);
            const url = JSON.parse(body).url;
            this.lastGfy = url;
            console.log(url);
        })
    }


    loadPage(url) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
    }

    download() {
        const blob = new Blob(this.recordedBlobs, { type: 'video/webm' });
        this.lastBlob = blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.target = "_blank";

        const a2 = document.createElement('a');
        a2.style.display = 'none';
        a2.href = url;
        a2.download = 'MyRecording.webm';

        document.body.appendChild(a2);
        document.body.appendChild(a);

        a.click();
        a2.click();
        setTimeout(() => {
            document.body.removeChild(a);
            document.body.removeChild(a2);
            // window.URL.revokeObjectURL(url);
        }, 100);
    }
}

module.exports = ScratchCanvasRecorder;