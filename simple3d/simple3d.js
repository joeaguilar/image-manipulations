
simple_3d = function (chunk, opts) {
  
  // type: draw

  /*

  Chunk is assumed to be a Uint8Array containing the images
  pixels in RGBA format. This is what you get returned when you 
  do 
  var canvasContext = canavs.getContext('2d');
  var imageData = canvasContext.getImageData(0,0, width, height);
  var data = imageData.data // << Thats the Uint8Array

  This function expects an options object that looks like this
    {
      size: {
        h: img.height,
        w: img.width
      },
      draw: {
        weight: depth,
        xspace: xaxis,
        yspace: yaxis
      }
    }

  The function sets up the defaults so you don't have to worry 
  about the draw portion but you must have a size or this 
  will be broken :(

  */
  var options = opts || {};
  // defaults
  opts.draw = opts.draw || { xspace: 10, yspace:1, weight: 5, stroke: 5 };
  opts.render = "source-poisson-subtract";
  var xspace = opts.draw.xspace, 
      yspace = opts.draw.yspace,
      weight = opts.draw.weight;

  var h = opts.size.height, w = opts.size.width;

  var x, y;
  var rgb = "r";

  // These are good default numbers
  if (xspace < 10) xspace = 10; 
  if (yspace < 10) yspace = 10;
  if (weight > 5) weight = 5;

  // Checks for big-endian or little-endian architecture
  function isLSB() {
    var b = new Uint8Array([255, 0]);
    return ((new Uint16Array(b, b.buffer))[0] === 255);
  }

  // Home-grown version of Processing's Brightness function
  // Least significant byte or little endian
  function extractBrightnessLSB(u32c) {
    var r,g,b; 
    r = (u32c &0xFF);
    g = (u32c >> 8) &0xFF;
    b = (u32c >> 16) &0xFF;
    m = r;
    (m < g) && (m = g);
    (m < b) && (m = b);
    return m;
  }
  // Most significant byte or big-endian
  function extractBrightnessMSB(u32c) {
    var r,g,b; 
    b = (u32c >>  8) &0xFF;
    g = (u32c >> 16) &0xFF;
    r = (u32c >> 24) &0xFF;
    m = r;
    (m < g) && (m = g);
    (m < b) && (m = b);
    return m;
  }


  var data = new Uint32Array(chunk.buffer);
  var clone = new Uint32Array(data.length);
  var dupBuffer = new Uint8Array(clone.buffer);
  var length = data.length;
  var isLittleEndian = isLSB();

  if (isLittleEndian) { // check once, saves cpu cycles :D
    for (var x = 0; x < h; x+= (xspace+weight)  ) {
      for (var y = 0; y < w; y+=(yspace+weight)  ) {
        var index = x * w +y;
        var col = data[index];
        var chan = extractBrightnessLSB(col);

        // draw
        for (dz = 0; dz < weight; dz++) {
          for (dx = 0; dx < xspace; dx++) {
            for (dy = 0; dy < yspace; dy++) {
              // console.log(dz)
              var nchan = Math.max(0, Math.min(255, Math.round(chan*dz)));
              col =  (255 << 24) | (  nchan << 16) | (  nchan <<  8) | nchan;
              
              var step = index + ((dx * w + dy) + ( (dz * w) + dz) );

              clone[step] = col;
              
            }
          }
        }
      }
    }  
  } else { // Big-Endian
    for (var x = 0; x < h; x+= (xspace+weight)  ) {
      for (var y = 0; y < w; y+=(yspace+weight)  ) {
        var index = x * w +y;
        var col = data[index];
        var chan = extractBrightnessMSB(col);

        // draw
        for (dz = 0; dz < weight; dz++) {
          for (dx = 0; dx < xspace; dx++) {
            for (dy = 0; dy < yspace; dy++) {
              // console.log(dz)
              var nchan = Math.max(0, Math.min(255, Math.round(chan*dz)));
              col =  (nchan << 24) | (  nchan << 16) | (  nchan <<  8) | 255;
              
              var step = index + ((dx * w + dy) + ( (dz * w) + dz) );

              clone[step] = col;
              
            }
          }
        }
      }
    }
  }


  // ArrayBuffer.slice may not be supported in your browser,
  // if not, copy the data over with a manual for-loop
  var copyOfSource = [];
  if (ArrayBuffer.prototype.slice) {
    copyOfSource = chunk.slice(0); 
  } else {
    for (var i = 0, l = chunk.length; i < l; i++) copyOfSource[i] = chunk[i];
  }
  finalEffects(chunk, dupBuffer, opts);
  finalEffects(chunk, copyOfSource, opts);
  
  /*

  The idea is that you have 3 copies of the image,
  the image is poisson blended with the effect, 
  then poisson blended back with the original image 
  to ragain the original color

  */

}

/*

  This is where cool stuff happens, 
  changing opts.render will change the mode
  'source-poisson-subtract' is the most desireable
  result, but the others are cool too :D


*/

function finalEffects (chunk, dupBuffer, options) {
  var renderIntent = options.render || 'normal';
  switch (renderIntent) {
    case 'normal'     : 
      var i = 0;
      while (i < chunk.length) {
        chunk[++i] = dupBuffer[i];
      }
      break;
    case 'source-poisson-add':
      // var extraBuffer = new ArrayBuffer(Uint8ClampedArray.BYTES_PER_ELEMENT * chunk.length);
      // var comparator = new Uint8ClampedArray(chunk);
      for (var x=0,x1=1,h = options.size.height, h1 = options.size.height-1; x1 < h1; x++, x1++) {
        for (var y=0,y1=1,w = options.size.width, w1 = options.size.width-1; y1 < w1; y++, y1++) {
          // starting at 1,1
          var index = (x1*w+y1)*4; 
          // movement kernel
          var m = [
            index-((w*4) + 4), index-(w*4), index-(w*4) + 4,
            index-4, index, index+4,
            index+((w*4) -4), index+ (w*4), index+(w*4) + 4
          ];
          var ml = m.length;
          var avgRed = 0, avgBlue = 0, avgGreen = 0;

          for (var k = 0; k < ml; k++) {
            avgRed +=   chunk[ m[k] + 0 ] - dupBuffer[ m[k] + 0];
            avgBlue +=  chunk[ m[k] + 1 ] - dupBuffer[ m[k] + 1];
            avgGreen += chunk[ m[k] + 2 ] - dupBuffer[ m[k] + 2];
          }

          chunk[index+0] = chunk[index+0] + (avgRed   / ml);
          chunk[index+1] = chunk[index+1] + (avgBlue  / ml);
          chunk[index+2] = chunk[index+2] + (avgGreen / ml);

        }
      }
      break;
    // Optimal image blending!
    case 'source-poisson-subtract':
      // var extraBuffer = new ArrayBuffer(Uint8ClampedArray.BYTES_PER_ELEMENT * chunk.length);
      // var comparator = new Uint8ClampedArray(chunk);
      for (var x=0,x1=1,h = options.size.height, h1 = options.size.height-1; x1 < h1; x++, x1++) {
        for (var y=0,y1=1,w = options.size.width, w1 = options.size.width-1; y1 < w1; y++, y1++) {
          // starting at 1,1
          var index = (x1*w+y1)*4; 
          // movement kernel
          var m = [
            index-((w*4) + 4), index-(w*4), index-(w*4) + 4,
            index-4, index, index+4,
            index+((w*4) -4), index+ (w*4), index+(w*4) + 4
          ];
          var ml = m.length;
          var avgRed = 0, avgBlue = 0, avgGreen = 0;

          for (var k = 0; k < ml; k++) {
            avgRed +=   chunk[ m[k] + 0 ] - dupBuffer[ m[k] + 0];
            avgBlue +=  chunk[ m[k] + 1 ] - dupBuffer[ m[k] + 1];
            avgGreen += chunk[ m[k] + 2 ] - dupBuffer[ m[k] + 2];
          }

          chunk[index+0] = chunk[index+0] - (avgRed   / ml);
          chunk[index+1] = chunk[index+1] - (avgBlue  / ml);
          chunk[index+2] = chunk[index+2] - (avgGreen / ml);

        }
      }
      break;
    case 'sample-poisson-add':
      // var extraBuffer = new ArrayBuffer(Uint8ClampedArray.BYTES_PER_ELEMENT * chunk.length);
      // var comparator = new Uint8ClampedArray(chunk);
      for (var x=0,x1=1,h = options.size.height, h1 = options.size.height-1; x1 < h1; x++, x1++) {
        for (var y=0,y1=1,w = options.size.width, w1 = options.size.width-1; y1 < w1; y++, y1++) {
          // starting at 1,1
          var index = (x1*w+y1)*4; 
          // movement kernel
          var m = [
            index-((w*4) + 4), index-(w*4), index-(w*4) + 4,
            index-4, index, index+4,
            index+((w*4) -4), index+ (w*4), index+(w*4) + 4
          ];
          var ml = m.length;
          var avgRed = 0, avgBlue = 0, avgGreen = 0;

          for (var k = 0; k < ml; k++) {
            avgRed +=   chunk[ m[k] + 0 ] - dupBuffer[ m[k] + 0];
            avgBlue +=  chunk[ m[k] + 1 ] - dupBuffer[ m[k] + 1];
            avgGreen += chunk[ m[k] + 2 ] - dupBuffer[ m[k] + 2];
          }

          chunk[index+0] = dupBuffer[index+0] + (avgRed   / ml);
          chunk[index+1] = dupBuffer[index+1] + (avgBlue  / ml);
          chunk[index+2] = dupBuffer[index+2] + (avgGreen / ml);

        }
      }
      break;
    case 'sample-poisson-subtract':
      // var extraBuffer = new ArrayBuffer(Uint8ClampedArray.BYTES_PER_ELEMENT * chunk.length);
      // var comparator = new Uint8ClampedArray(chunk);
      // console.log(options);
      // var now = performance.now();
      for (var x=0,x1=1,h = options.size.height, h1 = options.size.height-1; x1 < h1; x++, x1++) {
        for (var y=0,y1=1,w = options.size.width, w1 = options.size.width-1; y1 < w1; y++, y1++) {
          // starting at 1,1
          var index = (x1*w+y1)*4; 
          // movement kernel
          var m = [
            index-((w*4) + 4), index-(w*4), index-(w*4) + 4,
            index-4, index, index+4,
            index+((w*4) -4), index+ (w*4), index+(w*4) + 4
          ];
          var ml = m.length;
          var avgRed = 0, avgBlue = 0, avgGreen = 0;

          for (var k = 0; k < ml; k++) {
            avgRed +=   chunk[ m[k] + 0 ] - dupBuffer[ m[k] + 0];
            avgBlue +=  chunk[ m[k] + 1 ] - dupBuffer[ m[k] + 1];
            avgGreen += chunk[ m[k] + 2 ] - dupBuffer[ m[k] + 2];
          }

          chunk[index+0] = dupBuffer[index+0] - (avgRed   / ml);
          chunk[index+1] = dupBuffer[index+1] - (avgBlue  / ml);
          chunk[index+2] = dupBuffer[index+2] - (avgGreen / ml);

        }
      }
      // var end = performance.now();
      // console.log("that took %f ms", end - now);
      break;
    case 'crunch' :
      var skip = options.threshold || 50;
      var numEl = options.numel || 4;
      var skippy = skip * numEl;
      for (var i = 0, l = chunk.length; i < l; i++) {
        if (i&skippy) {
          chunk[i] = chunk[i];
        } else {
          chunk[i] = dupBuffer[i];
        }
      }
      break;
    case 'deplace' :
      var depth = options.threshold || 50;
      var w = options.size.width, h = options.size.height;
      var w1 = w-1, h1 = h - 1;
      var index, target;
      var x, y,shiftx, shifty;
      var a = 50; b = 120;
      var mx = 0, my = 0;
          mx += (Math.cos(a) > 0 ? Math.cos(a) * 2 : Math.abs(Math.cos(a)) );
          my += (Math.sin(b) > 0 ? Math.sin(b) * 2 : Math.abs(Math.sin(b)) );
      for(y = 0; y < h; y++) {
        for(x = 0; x < w; x++) {
          index = y * w + x << 2; // interesting
          shiftx = x + chunk[index] / 255 * -mx * depth >> 0;
          shifty = y + chunk[index] / 255 * -my * depth >> 0;
          // clamp
          if(shiftx < 0){
              shiftx = 0
          } else if(shiftx > w1){
              shiftx = w1
          }
          if(shifty < 0){
              shifty = 0
          } else if(shifty > h1){
              shifty = h1
          }

          target = shifty * w + shiftx << 2;
          chunk[index]   = dupBuffer[target];
          chunk[index+1] = dupBuffer[target+1];
          chunk[index+2] = dupBuffer[target+2];
        }
      }
      break;
    default: 
      var i = 0;
      while (i < chunk.length) {
        chunk[++i] = dupBuffer[i];
      }
      break;
  }
}
