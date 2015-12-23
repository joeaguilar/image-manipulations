// Save as blob shim
if (!HTMLCanvasElement.prototype.toBlob) {
 Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: function (callback, type, quality) {

    var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
        len = binStr.length,
        arr = new Uint8Array(len);

    for (var i=0; i<len; i++ ) {
     arr[i] = binStr.charCodeAt(i);
    }

    callback( new Blob( [arr], {type: type || 'image/png'} ) );
  }
 });
}

function isLSB() {
    var b = new Uint8Array([255, 0]);
    return ((new Uint16Array(b, b.buffer))[0] === 255);
}

function hex2Rgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}




var attachDiv = document.createElement('div');
var selectFile = document.createElement('input');
    selectFile.setAttribute('type', 'file');
    selectFile.setAttribute('id', 'file-chooser');
var barwidthLabel = document.createElement('label');
    barwidthLabel.setAttribute('for', 'barwidth');
    barwidthLabel.innerText = "Bar width";
var barwidthChooser = document.createElement('input');
    barwidthChooser.setAttribute('type', 'text');
    barwidthChooser.setAttribute('id', 'barwidth');
    barwidthChooser.setAttribute('value', '6');
var minbrightLabel = document.createElement('label');
    minbrightLabel.setAttribute('for', 'minbright');
    minbrightLabel.innerText = "Minimum Brightness";
var minbrightChooser = document.createElement('input');
    minbrightChooser.setAttribute('type', 'text');
    minbrightChooser.setAttribute('id', 'minbright');
    minbrightChooser.setAttribute('value', '20');

var zigzagLabel = document.createElement('label');
    zigzagLabel.setAttribute('for', 'zigheight');
    zigzagLabel.innerText = "Zig Zag Height";
var zigheightChooser = document.createElement('input');
    zigheightChooser.setAttribute('type', 'text');
    zigheightChooser.setAttribute('id', 'zigheight');
    zigheightChooser.setAttribute('value', '40');

var bothsidesLabel = document.createElement('label');
    bothsidesLabel.setAttribute('for', 'bothsides');
    bothsidesLabel.innerText = "Both sides";
var bothsidesChooser = document.createElement('input');
    bothsidesChooser.setAttribute('type', 'checkbox');
    bothsidesChooser.setAttribute('checked', 'true');
    bothsidesChooser.setAttribute('id', 'bothsides');

var colorpicker1Label = document.createElement('label');
    colorpicker1Label.setAttribute('for', 'color1');
    colorpicker1Label.innerText = "Color 1";
var colorpicker1 = document.createElement('input');
    colorpicker1.setAttribute('id', 'color1');
    colorpicker1.setAttribute('value', '#000000');
    colorpicker1.setAttribute('type', 'color');

var colorpicker2Label = document.createElement('label');
    colorpicker2Label.setAttribute('for', 'color1');
    colorpicker2Label.innerText = "Color 2";
var colorpicker2 = document.createElement('input');
    colorpicker2.setAttribute('id', 'color2');
    colorpicker2.setAttribute('value', '#FFFFFF');
    colorpicker2.setAttribute('type', 'color');



// var rerunButton = document.createElement('input');
//     rerunButton.setAttribute('type', 'button');
//     rerunButton.setAttribute('id', 'rerun');
//     rerunButton.setAttribute('value', 'Re-run');

var canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'panada-bruh');
var ctx = canvas.getContext('2d');

attachDiv.appendChild(selectFile);
attachDiv.appendChild(canvas);
attachDiv.appendChild(barwidthLabel);
attachDiv.appendChild(barwidthChooser);
attachDiv.appendChild(minbrightLabel);
attachDiv.appendChild(minbrightChooser);
attachDiv.appendChild(zigzagLabel);
attachDiv.appendChild(zigheightChooser);
attachDiv.appendChild(bothsidesLabel);
attachDiv.appendChild(bothsidesChooser);
attachDiv.appendChild(colorpicker1Label);
attachDiv.appendChild(colorpicker1);
attachDiv.appendChild(colorpicker2Label);
attachDiv.appendChild(colorpicker2);


// attachDiv.appendChild(rerunButton);

document.body.appendChild(attachDiv);


function handleImage (e) {
    // console.log('Loading image...')
    var reader = new FileReader();
    reader.onload = function (event) {
      try {
        var img = new Image();
        // console.log("image created!", img);
        img.onload = function makeLikeAPanda() {
            // Teisu Darusen's zig zag algorithm
            var canvas = document.querySelector('#panada-bruh');
            var ctx = canvas.getContext('2d');
            var barwidthValue  = parseInt(document.querySelector('#barwidth').value, 10);
            var minbrightValue = parseInt(document.querySelector('#minbright').value, 10);
            var zigheightValue = parseInt(document.querySelector('#zigheight').value, 10);
            var color1 = document.querySelector('#color1').value.slice(1);
            var color2 = document.querySelector('#color2').value.slice(1);
            var bothsides = document.querySelector('#bothsides').checked;
            var barwidth  = !isNaN(barwidthValue) ? barwidthValue :  6;
            var minbright = !isNaN(minbrightValue) ? minbrightValue : 20;
            var zigheight = !isNaN(zigheightValue) ? zigheightValue :  40;
            var picspace = 2;
            var lumin = 1.618;
            var drctn = -1; // dir is sometimes a function
            var h,w;
            // var bothsides = true;
            canvas.width = w = img.width;
            canvas.height = h = img.height;
            console.log("VARIABLES: barwidth %d, minbright %d, zigheight %d, picspace %d", barwidth, minbright, zigheight, picspace);
            ctx.drawImage(img, 0, 0);
            // console.log('Image was drawn', ctx);
            var imgData = ctx.getImageData(0, 0, img.width, img.height);
            var pixels = new Uint32Array(imgData.data.buffer), pl = pixels.length;
            // var pixels = imgData.data, pl = pixels.length;
            var isLittleEndian = isLSB();
            var bw = true;
            var c1, c2;

            if (isLittleEndian) {
              c1 = (255 << 24) | ( parseInt(color1.slice(4,6),16) << 16 ) | ( parseInt(color1.slice(2,4),16) << 8) | parseInt(color1.slice(0,2),16);
              c2 = (255 << 24) | ( parseInt(color2.slice(4,6),16) << 16 ) | ( parseInt(color2.slice(2,4),16) << 8) | parseInt(color2.slice(0,2),16);
            } else {
              c1 = ( parseInt(color1.slice(0,2),16) << 24) | ( parseInt(color1.slice(2,4),16) << 16 ) | ( parseInt(color1.slice(4,6),16) << 8) | 255;
              c2 = ( parseInt(color2.slice(0,2),16) << 24) | ( parseInt(color2.slice(2,4),16) << 16 ) | ( parseInt(color2.slice(4,6),16) << 8) | 255;
            }
            console.log("color1 %d, color2 %d", c1, c2);
              for (var y = 0; y < h; y++) {
                if (y % zigheight === 0 ) drctn = -drctn;
                // console.log("Direction:", drctn);
                for (var x = 0; x < w; x+=barwidth) {
                  for (var i = 0; i < barwidth; i++) {
                    
                    if (isLittleEndian) {
                      var pos = (x+(drctn*y))+ i + y * w;
                      if (pos >= pl) continue;
                      var currentColor = pixels[pos];
                      var r = (currentColor >> 16)&0xFF;
                      var g = (currentColor >> 8)&0xFF;
                      var b = (currentColor &0xFF);
                      if (!bw) {
                        // pixels[pos] = (255 << 24) | (0 << 16 ) | (0 << 8) | 0;
                        pixels[pos] = c1;
                      } else {
                        if ( ( bothsides && ( i < 0 + picspace || i >= barwidth-picspace ) ) || ( !bothsides && i < 0 + picspace ) ) {
                          var brite = Math.max.apply(null, [r,g,b]);
                              brite = Math.max(Math.min(255, ( minbright + (brite*lumin) )), 0);
                          pixels[pos] = (255 << 24) | (brite << 16 ) | (brite << 8) | brite;
                        } else {
                          // pixels[pos] = (255 << 24) | (255 << 16 ) | (255 << 8) | 255;
                          pixels[pos] = c2;
                        }
                      } 
                      if ( i == barwidth -1 ){
                        bw = !bw;
                      }
                    } else { // Big Endian
                      var pos = (x+(drctn*y))+i +y *w;
                      if (pos >= pl) continue;
                      var currentColor = pixels[pos];
                      var r = (currentColor >> 16)&0xFF;
                      var g = (currentColor >> 8)&0xFF;
                      var b = (currentColor &0xFF);

                      if (bw) {
                        pixels[pos] = c1;
                        // pixels[pos] = (0 << 24) | (0 << 16 ) | (0 << 8) | 255;
                      } else {
                        if ( ( bothsides && ( i < 0 + picspace || i >= barwidth-picspace ) ) || ( !bothsides && i < 0 + picspace ) ) {
                          var brite = Math.max.apply(null, [r,g,b]);
                              brite = Math.max(Math.min(255, ( minbright + (brite*lumin) )), 0)
                          pixels[pos] = (brite << 24) | (brite << 16 ) | (brite << 8) | 255;
                        } else {
                          pixels[pos] = c2;
                          // pixels[pos] = (255 << 24) | (255 << 16 ) | (255 << 8) | 255;
                        }
                        if ( i === barwidth -1){
                          bw = !bw;
                        }
                      } 
                    }
                  }
                }
              }


            ctx.putImageData(imgData, 0, 0);
            

            // Boilerplate to save the canvas to a lossless png
            canvas.toBlob(function(blob) {
              var imgAnchor = document.createElement('a');
                  imgAnchor.setAttribute('data-downloaded', 'false');
              var newImg = document.createElement("img");
                  newImg.height = canvas.height / 8;
                  newImg.width  = canvas.width / 8;
                  newImg.setAttribute('class', 'completed-image')
                  var imgMaterial = canvas.toDataURL('image/png'),
                      url = URL.createObjectURL(blob);
              var newDiv = document.createElement('div');
                  console.log(newImg, imgMaterial, url);
              
              
                  imgAnchor.setAttribute('href', imgMaterial);
                  imgAnchor.setAttribute('download', 'Zigzag'+ new Date().toISOString().slice(17,19) + (Math.random()).toString().slice(2) +'.png');
              var fileName = 'Zigzag'+ new Date().toISOString().slice(14,19).replace(':', "-" ) + (Math.random()).toString().slice(2) +'.png';
              
              


              newImg.onload = function() {
                // no longer need to read the blob so it's revoked
                // With this disabled, each image stays on the HTML document, creating a "memory leak", but you wont be able to save the images otherwise :(
                // URL.revokeObjectURL(url);
              };
              newImg.src = url;
              imgAnchor.appendChild(newImg);
              newDiv.appendChild(imgAnchor);
              
              
              document.body.appendChild(newDiv);
              
            });

        }
        img.src = event.target.result;
      } catch (err) {
        alert('There was an error!', err);
      }
    }
    reader.readAsDataURL(e.target.files[0]);
}

selectFile.addEventListener('change', handleImage, false);




