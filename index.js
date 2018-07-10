// Import your code here
import './css/normalize.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import './css/style.css';

import $ from 'jquery';

import './js/jquery.custom-file-input';

//-----------------------------------------------
// Functional methods
//-----------------------------------------------
function identity(val) {
  return val;
}

/**
 * Compose functions with side effects
 * @return composed functions
 */
function sideEffectCompose(...fns) {
  return function composed(input) {
    fns.reduceRight((_, f) => {
      f(input);
    }, identity);
    return input;
  };
}

//-----------------------------------------------
// Util methods
//-----------------------------------------------
function uploadFile(file) {
  const formData = new FormData();
  formData.append('image', file);
  return $.ajax({
    url: 'https://idol.chuphinhthe.com/api/recognition',
    type: 'POST',
    data: formData,
    processData: false, // tell jQuery not to process the data
    contentType: false, // tell jQuery not to set contentType
  });
}

function getCanvas() {
  return document.getElementById('artboard');
}

function saveContext() {
  const ctx = getCanvas().getContext('2d');
  ctx.save();
}

function restoreContext() {
  const ctx = getCanvas().getContext('2d');
  ctx.restore();
}

function clearCanvas() {
  restoreContext();
  const canvas = getCanvas();
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawImage(file) {
  if (!file) return;
  const ctx = getCanvas().getContext('2d');
  console.log(file);
  const img = new Image();
  img.onload = function() {
    ctx.drawImage(img, 0, 0);
  };
  img.src = URL.createObjectURL(file);
}

function drawRect({ x, y, w, h }) {
  const ctx = getCanvas().getContext('2d');

  // Draw rect
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawName({ name, prob, x, y }) {
  const ctx = getCanvas().getContext('2d');

  // Draw text
  ctx.fillStyle = 'yellow';
  ctx.font = '20px Arial';
  ctx.fillText(`${name} - ${prob.toFixed(2)}`, x, y - 10);
}

//-----------------------------------------------
// Main methods
//-----------------------------------------------


$('#upload-form').on('submit', e => {
  e.preventDefault();
  const file = $('#uploader')[0].files[0];
  // Clear canvas and draw image
  clearCanvas();
  drawImage(file);

  // Upload file to get detection and draw result
  uploadFile(file).then(response => {
    response.data.forEach(sideEffectCompose(drawRect, drawName, saveContext));
  });
});
