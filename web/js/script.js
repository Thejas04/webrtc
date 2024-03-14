// web/js/script.js

var pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Use your ICE servers here
  });
  
  pc.ontrack = function(event) {
    var el = document.getElementById('webrtc-video');
    el.srcObject = event.streams[0];
    el.autoplay = true;
    el.controls = true;
  };
  
  // WebSocket connection for signaling
  var ws = new WebSocket('ws://localhost:8080'); // Adjusted to new port if necessary
  ws.onmessage = function(msg) {
    var signal = JSON.parse(msg.data);
    if (signal.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
        // If we received an offer, we need to reply with an answer
        if (pc.remoteDescription.type === 'offer') {
          pc.createAnswer().then(function(answer) {
            pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ 'sdp': answer }));
          });
        }
      });
    } else if (signal.ice) {
      pc.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
  };
  
  pc.onicecandidate = function(event) {
    if (event.candidate) {
      ws.send(JSON.stringify({ 'ice': event.candidate }));
    }
  };
  
  // Creating the offer
  pc.createOffer().then(function(offer) {
    return pc.setLocalDescription(offer);
  }).then(function() {
    // Send the offer to the signaling server
    ws.send(JSON.stringify({ 'sdp': pc.localDescription }));
  });
  