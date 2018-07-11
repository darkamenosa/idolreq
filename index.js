// Import your code here
import './css/normalize.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import './css/style.css';

import $ from 'jquery';

const $box = $('.box'),
  $form = $('#upload-form'),
  $input = $box.find('input[type="file"]'),
  $btnSubmit = $('.box__button'),
  $btnReset = $('.reset__button'),
  $boxDropFile = $('.box__drop_file'),
  $boxCanvas = $('.box__canvas'),
  $toast = $('#snackbar');
let droppedFiles = false;

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
  const canvas = getCanvas();

  const img = new Image();
  img.onload = function() {
    // TODO: integrate scale image
    // const { xStart, yStart, renderableWidth, renderableHeight } = fitImageOn(
    //   canvas,
    //   img,
    // );
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
  };
  img.src = URL.createObjectURL(file);
}

function fitImageOn(canvas, imageObj) {
  var imageAspectRatio = imageObj.width / imageObj.height;
  var canvasAspectRatio = canvas.width / canvas.height;
  let renderableHeight, renderableWidth, xStart, yStart, biggerRatio;

  // image's aspect ratio is less than canvas
  if (imageAspectRatio < canvasAspectRatio) {
    renderableHeight = canvas.height;
    renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
    xStart = (canvas.width - renderableWidth) / 2;
    yStart = 0;
    biggerRatio = 'canvas';
  }

  // image's aspect ratio is greater than canvas
  else if (imageAspectRatio > canvasAspectRatio) {
    renderableWidth = canvas.width;
    renderableHeight = imageObj.height * (renderableWidth / imageObj.width);
    xStart = 0;
    yStart = (canvas.height - renderableHeight) / 2;
    biggerRatio = 'img';
  }

  // Happy path - keep aspect ratio
  else {
    renderableHeight = canvas.height;
    renderableWidth = canvas.width;
    xStart = 0;
    yStart = 0;
    biggerRatio = 'canvas';
  }

  return {
    renderableHeight,
    renderableWidth,
    xStart,
    yStart,
    biggerRatio,
  };
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

function showFiles(files) {
  if (!files || !files.length) return;

  clearCanvas();
  $boxCanvas.removeClass('hidden');
  $boxDropFile.addClass('hidden');
  drawImage(files[0]);
}

function resetFiles() {
  $boxCanvas.addClass('hidden');
  $btnReset.addClass('hidden');
  $boxDropFile.removeClass('hidden');
  $btnSubmit.removeClass('hidden');
  clearCanvas();
  droppedFiles = false;
}

function toast(text) {
  $toast.html(text).addClass('show');
  setTimeout(function() {
    $toast.removeClass('show');
  }, 3000);
}
//-----------------------------------------------
// site effect drag drop
//-----------------------------------------------

const isAdvancedUpload = (function() {
  const div = document.createElement('div');
  return (
    ('draggable' in div || ('ondragstart' in div && 'ondrop' in div)) &&
    'FormData' in window &&
    'FileReader' in window
  );
})();

$input
  .on('focus', function() {
    $input.addClass('has-focus');
  })
  .on('blur', function() {
    $input.removeClass('has-focus');
  });

if (isAdvancedUpload) {
  $box
    .on('drag dragstart dragend dragover dragenter dragleave drop', function(
      e,
    ) {
      e.preventDefault();
      e.stopPropagation();
    })
    .on('dragover dragenter', function() {
      $box.addClass('is-dragover');
    })
    .on('dragleave dragend drop', function() {
      $box.removeClass('is-dragover');
    })
    .on('drop', function(e) {
      droppedFiles = e.originalEvent.dataTransfer.files;
      showFiles(droppedFiles);
    });
}

//-----------------------------------------------
// Main methods
//-----------------------------------------------

$input.on('change', e => showFiles(e.target.files));

$btnReset.on('click', resetFiles);

$form.on('submit', e => {
  e.preventDefault();

  let file = $input[0].files[0];
  if (isAdvancedUpload && droppedFiles) {
    file = droppedFiles[0];
  }
  // prevent empty file
  if (!file) {
    toast('Please select your idol!');
    $form.removeClass('is-uploading');
    return;
  }
  // prevent multi check
  if ($form.hasClass('is-uploading')) return false;

  $form.addClass('is-uploading');

  // Upload file to get detection and draw result
  uploadFile(file)
    .then(response => {
      response.data.forEach(sideEffectCompose(drawRect, drawName, saveContext));
      setTimeout(() => {
        $form.removeClass('is-uploading');
        $btnSubmit.addClass('hidden');
        $btnReset.removeClass('hidden');
      }, 1000);
    })
    .catch(err => {
      console.log(err);
      $form.removeClass('is-uploading');
    });
});
