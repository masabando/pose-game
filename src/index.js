import * as bootstrap from 'bootstrap';

let canvas = document.querySelector('#canvas');
let ctx = canvas.getContext('2d');
let video = document.querySelector('#video');
let threshold = 0.7;

class Target {
  constructor() {
    this.show = false;
    this.radius = 15;
    this.color = 'yellow';
  }
  set() {
    this.x = ~~(Math.random() * canvas.width * 0.8) + canvas.width * 0.1;
    this.y = ~~(Math.random() * canvas.height * 0.8) + canvas.height * 0.1;
    this.show = true;
  }
  draw() {
    if (this.show) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }
  }
}

let target = new Target();


navigator.mediaDevices.getUserMedia({
  audio: false, video: {
    facingMode: "user",
  }
}).then(
  stream => {
    video.srcObject = stream;
    video.onloadedmetadata = (e) => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      posenet.load().then(net => {
        setInterval(() => { detectAndDraw(net) }, 50);
        target.set();
      });
    };
    video.play();
  }
)


function detectAndDraw(net) {
  ctx.globalAlpha = 0.8;
  ctx.drawImage(video, 0, 0);
  target.draw();
  net.estimateMultiplePoses(canvas, {
    flipHorizontal: false
  }).then(poses => {
    poses.forEach(pose => {
      drawKeypoints(pose.keypoints);
      drawSkeleton(pose.keypoints);
    });
  });
}

function drawKeypoints(keypoints) {
  let points = keypoints.filter(keypoint => keypoint.score > threshold);
  for (let i = 0; i < points.length; i++) {
    let point = points[i];
    let x = point.position.x;
    let y = point.position.y;
    switch (point.part) {
      case "leftWrist":
      case "rightWrist":
      case "leftAnkle":
      case "rightAnkle":
        if (Math.abs(x - target.x) < target.radius
          && Math.abs(y - target.y) < target.radius) {
          target.set();
        }
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        break;
      // case "leftEye":
      // case "rightEye":
      //   ctx.font = "20px serif";
      //   ctx.textAlign = "center";
      //   ctx.baseLine = "middle";
      //   ctx.fillText("★", x, y + 5);
      //   break;
      default:
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        break;
    }
  }
}

function drawSkeleton(keypoints) {
  let skeleton = posenet.getAdjacentKeyPoints(keypoints, threshold);
  for (let i = 0; i < skeleton.length; i++) {
    let partA = skeleton[i][0];
    let partB = skeleton[i][1];
    ctx.beginPath();
    ctx.moveTo(partA.position.x, partA.position.y);
    ctx.lineTo(partB.position.x, partB.position.y);
    ctx.strokeStyle = 'red';
    ctx.stroke();
  }
}

