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
            
            var canvas = document.querySelector('#panada-bruh');
            var ctx = canvas.getContext('2d');
            var barwidthValue  = parseInt(document.querySelector('#barwidth').value, 10);
            var minbrightValue = parseInt(document.querySelector('#minbright').value, 10);
            var zigheightValue = parseInt(document.querySelector('#zigheight').value, 10);
            var color1 = parseInt(document.querySelector('#color1').value.slice(1), 8);
            var color2 = parseInt(document.querySelector('#color2').value.slice(1), 8);
            var barwidth  = !isNaN(barwidthValue) ? barwidthValue :  6;
            var minbright = !isNaN(minbrightValue) ? minbrightValue : 20;
            var zigheight = !isNaN(zigheightValue) ? zigheightValue :  40;
            var picspace = 2;
            var drctn = -1; // dir is sometimes a function
            var bothsides = true;
            canvas.width = img.width;
            canvas.height = img.height;
            console.log("VARIABLES: barwidth %d, minbright %d, zigheight %d, picspace %d", barwidth, minbright, zigheight, picspace);
            ctx.drawImage(img, 0, 0);
            // console.log('Image was drawn', ctx);
            var imgData = ctx.getImageData(0, 0, img.width, img.height);
            var pixels = new Uint32Array(imgData.data.buffer), pl = pixels.length;
            // var pixels = imgData.data, pl = pixels.length;
            var isLittleEndian = isLSB();
            var bw = true;
              for (var y = 0; y < h; y++) {
                if (y % zigheight === 0 ) drctn = -drctn;
                // console.log("Direction:", drctn);
                for (var x = 0; x < w; x+=barwidth) {
                  for (var i = 0; i < barwidth; i++) {
                    
                    if (isLittleEndian) {
                      var pos = (x+(drctn*y))+ i + y * w;
                      if (pos >= cl) continue;
                      var currentColor = data[pos];
                      var r = (currentColor >> 16)&0xFF;
                      var g = (currentColor >> 8)&0xFF;
                      var b = (currentColor &0xFF);
                      if (!bw) {
                        data[pos] = color1;
                        // data[pos] = (255 << 24) | (0 << 16 ) | (0 << 8) | 0;
                      } else {
                        if ( ( i < 0 + picspace || i >= barwidth-picspace ) ) {
                          var brite = Math.max.apply(null, [r,g,b]);
                              brite = Math.max(Math.min(255, ( minbright + (brite*lumin) )), 0);
                          data[pos] = (255 << 24) | (brite << 16 ) | (brite << 8) | brite;
                        } else {
                          data[pos] = color2;
                          // data[pos] = (255 << 24) | (255 << 16 ) | (255 << 8) | 255;
                        }
                      } 
                      if ( i == barwidth -1 ){
                        bw = !bw;
                      }
                    } else { // Big Endian
                      var pos = (x+(drctn*y))+i +y *w;
                      if (pos >= cl) continue;
                      var currentColor = data[pos];
                      var r = (currentColor >> 16)&0xFF;
                      var g = (currentColor >> 8)&0xFF;
                      var b = (currentColor &0xFF);
                      var brite = Math.max.apply(null, [r,g,b]);
                          // brite = ( minbright + (brite*lumin) ) ;
                          brite = Math.max(Math.min(255, ( minbright + (brite*lumin) )), 0)
                      var c = (brite << 24) | (brite << 16 ) | (brite << 8) | 255;

                      if (bw) {
                        data[pos] = (0 << 24) | (0 << 16 ) | (0 << 8) | 255;
                      } else {
                        if ( ( bothsides && ( i < 0 + picspace || i >= barwidth-picspace ) ) || ( !bothsides && i < 0 + picspace ) ) {
                          data[pos] = c;
                        } else {
                          data[pos] = (255 << 24) | (255 << 16 ) | (255 << 8) | 255;
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




