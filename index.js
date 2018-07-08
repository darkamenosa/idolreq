// Import your code here
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';

import $ from 'jquery';

$(document).ready(function() {
  //-----------------------------------------------
  // Util methods
  //-----------------------------------------------
  function uploadFile(file) {
    const formData = new FormData();
    formData.append('image', file);
    return $.ajax({
      url : 'https://idol.chuphinhthe.com/api/recognition',
      type : 'POST',
      data : formData,
      processData: false,  // tell jQuery not to process the data
      contentType: false,  // tell jQuery not to set contentType
    });
  }

  function getCanvas() {
    return document.getElementById('artboard');
  }

  function drawImage(file) {
    const ctx = getCanvas().getContext('2d');

    const img = new Image()
    img.onload = function() {
      ctx.drawImage(img, 0, 0);
    }

    img.src = URL.createObjectURL(file);
  }

  function drawRect({ x, y, w, h }) {
    const ctx = getCanvas().getContext('2d');

    // Draw rect
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
  $('#upload-form').on('submit', (e) => {
    e.preventDefault();
    const file = $('#uploader')[0].files[0];
    drawImage(file); 
    uploadFile(file)
      .then((response) => {
        response
          .data
          .forEach((item) => {
            drawRect(item);
            drawName(item);
          })
      })
  });

});
