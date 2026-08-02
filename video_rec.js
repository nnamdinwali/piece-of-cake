
let _captureStarted = false;
let _recordNotSupported = false;
let _rec;
let streaming = false;
let _recChunks = [];
let _canvas = null;

async function negotiateConnectionWithClientOffer(
  peerConnection,
  endpoint
) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  let ofr = await waitToCompleteICEGathering(peerConnection);
  if (!ofr) {
    throw Error("failed to gather ICE candidates for offer");
  }
  /**
   * As long as the connection is open, attempt to...
   */
  while (peerConnection.connectionState !== "closed") {

    let response = await postSDPOffer(endpoint, ofr.sdp);
    if (response.status === 201) {
      let answerSDP = await response.text();
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: answerSDP })
      );
      return response.headers.get("Location");
    } else if (response.status === 405) {
      console.error("Update the URL passed into the WHIP or WHEP client");
    } else {
      const errorMessage = await response.text();
      console.error(errorMessage);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}
async function postSDPOffer(endpoint, data) {
  return await fetch(endpoint, {
    method: "POST",
    mode: "cors",
    headers: {
      "content-type": "application/sdp",
    },
    body: data,
  });
}
async function waitToCompleteICEGathering(peerConnection) {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve(peerConnection.localDescription);
    }, 1000);
    peerConnection.onicegatheringstatechange = (ev) =>
      peerConnection.iceGatheringState === "complete" &&
      resolve(peerConnection.localDescription);
  });
}

let _endpoint;
let _peerConnection;
let _localStream;

function startStream(endpoint, stream) {
  _endpoint = endpoint;
  _peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.cloudflare.com:3478",
      },
    ],
    bundlePolicy: "max-bundle",
  });
  _peerConnection.addEventListener("negotiationneeded", async (ev) => {
    console.log("Connection negotiation starting");
    await negotiateConnectionWithClientOffer(
      _peerConnection,
      endpoint
    );
    console.log("Connection negotiation ended");
  });
  _localStream = stream;
  stream.getTracks().forEach((track) => {
    const transceiver = _peerConnection.addTransceiver(track, {
      direction: "sendonly",
    });
    if (track.kind == "video" && transceiver.sender.track) {
      transceiver.sender.track.applyConstraints({
      });
    }
  });
}

async function stopStream() {
  var _a;
  _peerConnection.close();
  (_a = _localStream) === null || _a === void 0
    ? void 0
    : _a.getTracks().forEach((track) => track.stop());
  _peerConnection = null;
  _localStream = null;
  _endpoint = null;
}

function downloadBlob(blob, name = 'file.txt') {
  // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
  const blobUrl = URL.createObjectURL(blob);

  // Create a link element
  const link = document.createElement("a");

  // Set link's href to point to the Blob URL
  link.href = blobUrl;
  link.download = name;

  // Append link to the body
  document.body.appendChild(link);

  // Dispatch click event on the link
  // This is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
  );

  // Remove link from body
  document.body.removeChild(link);
}

function getCanvasStream(framerate, resolution_size) {
  if (!_canvas) {
    _canvas = document.getElementById('canvas');
    _ctx = _canvas.getContext('2d');
  }

  // Переходим на запись без уменьшения разрешения в случае, если браузер не поддерживает эту функцию
  if (typeof MediaStreamTrackProcessor === 'undefined') {
    return _canvas.captureStream(framerate);
  }

  try {
    const stream = _canvas.captureStream(framerate); // Захватываем поток с канваса
    const [videoTrack] = stream.getVideoTracks();
    const processor = new MediaStreamTrackProcessor(videoTrack);
    const generator = new MediaStreamTrackGenerator({ kind: 'video' });
    const reader = processor.readable.getReader();
    const writer = generator.writable.getWriter();

    let resolution_width, resolution_height;
    if (_canvas.width > _canvas.height) { // Альбомная ориентация
      resolution_width = resolution_size;
      resolution_height = _canvas.height * (resolution_size / _canvas.width);
    } else { // Портретная ориентация
      resolution_height = resolution_size;
      resolution_width = _canvas.width * (resolution_height / _canvas.height);
    }
    resolution_width = Math.floor(resolution_width);
    resolution_height = Math.floor(resolution_height);
    if (resolution_width % 2 !== 0) { resolution_width--; }
    if (resolution_height % 2 !== 0) { resolution_height--; }
    const offscreenCanvas = new OffscreenCanvas(resolution_width, resolution_height); // Размер выходного видео
    const offscreenCtx = offscreenCanvas.getContext('2d');
    async function processFrame() {
      const { value, done } = await reader.read();
      if (done) { writer.close(); return; }
      const frame = value;
      offscreenCtx.drawImage(frame, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
      const newFrame = new VideoFrame(offscreenCanvas, { timestamp: frame.timestamp });
      await writer.write(newFrame);
      frame.close();
      newFrame.close();
      processFrame();
    }
    processFrame();
    return new MediaStream([generator]);
  } catch (e) {
    _recordNotSupported = true;
    console.log(`Could not start recording! Error: ${e}`);
  }

  return stream
}

async function captureStartAndDownload(video_format, video_codec, framerate, bitrate, timeslice, resolution_size) {
  if (_recordNotSupported) { return; }

  _recChunks = [];

  if (!_rec) {
    try {
      const stream = getCanvasStream(framerate, resolution_size);
      if (!stream || stream === 'undefined') {
        console.error("No streams available")
        return
      }

      const options = {
        mimeType: `video/${video_format}`,
        videoBitsPerSecond: bitrate
      };

      _rec = new MediaRecorder(resizedStream, options);
      _rec.ondataavailable = event => {
        if (event.data.size > 0) {
          _recChunks.push(event.data);
        }
      };
    } catch (e) {
      console.error('Recording not supported:', e);
      _recordNotSupported = true;
      return;
    }
  }
  _rec.start(timeslice);
  _captureStarted = true;
}


function startServerStreaming(url, framerate, resolution_size) {
  if (_recordNotSupported) { return; }

  _recChunks = [];

  try {
    const stream = getCanvasStream(framerate, resolution_size);
    if (!stream || stream === 'undefined') {
      console.error("No streams available")
      return
    }
    startStream(url, stream);
  } catch (e) {
    console.error('Recording not supported:', e);
    _recordNotSupported = true;
    return;
  }

  _captureStarted = true;
}

function stopServerStreaming() {
  stopStream();
}


function captureStop() {
  if (_recordNotSupported) {
    return Promise.resolve();
  }
  if (!_captureStarted) {
    return Promise.resolve();
  }

  _captureStarted = false;

  return new Promise((resolve, reject) => {
    _rec.onstop = e => {
      resolve();
    };
    _rec.stop()
  });
}

function generate_video_name(api_type, api_uid) {
  const date = new Date();
  let dateString = date.getUTCDate() + "." + date.getUTCMonth() + "." + date.getUTCFullYear() + "T" + date.getUTCHours() + "." + date.getUTCMinutes();
  let name = `playtest-${dateString}-${api_type}-${api_uid}.webm`;
  return name;
}

function downloadRecording(api_type, api_uid) {
  var blob = new Blob(_recChunks, {
    type: 'video/webm'
  });

  downloadBlob(blob, generate_video_name(api_type, api_uid));
}