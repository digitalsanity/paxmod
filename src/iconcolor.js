let iconColor = (() => { // eslint-disable-line no-unused-vars
  const NS_XHTML = 'http://www.w3.org/1999/xhtml';
  const minLightness = 68;
  const defaultColor = [220, 220, 220];

  function labToRgb(lab) {
    let y = (lab[0] + 16) / 116;
    let x = lab[1] / 500 + y;
    let z = y - lab[2] / 200;
    x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
    y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
    z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let b = x * 0.0557 + y * -0.2040 + z * 1.0570;
    r = (r > 0.0031308) ? (1.055 * (r ** (1 / 2.4)) - 0.055) : 12.92 * r;
    g = (g > 0.0031308) ? (1.055 * (g ** (1 / 2.4)) - 0.055) : 12.92 * g;
    b = (b > 0.0031308) ? (1.055 * (b ** (1 / 2.4)) - 0.055) : 12.92 * b;
    return [
      Math.max(0, Math.min(1, r)) * 255,
      Math.max(0, Math.min(1, g)) * 255,
      Math.max(0, Math.min(1, b)) * 255,
    ];
  }

  function rgbToLab(rgb) {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;
    r = (r > 0.04045) ? (((r + 0.055) / 1.055) ** 2.4) : r / 12.92;
    g = (g > 0.04045) ? (((g + 0.055) / 1.055) ** 2.4) : g / 12.92;
    b = (b > 0.04045) ? (((b + 0.055) / 1.055) ** 2.4) : b / 12.92;
    let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    x = (x > 0.008856) ? (x ** (1 / 3)) : (7.787 * x) + 16 / 116;
    y = (y > 0.008856) ? (y ** (1 / 3)) : (7.787 * y) + 16 / 116;
    z = (z > 0.008856) ? (z ** (1 / 3)) : (7.787 * z) + 16 / 116;
    return [
      (116 * y) - 16,
      500 * (x - y),
      200 * (y - z),
    ];
  }

  function pseudoSaturation(rgb) {
    return Math.max(...rgb) - Math.min(...rgb);
  }

  function pixelColors(img) {
    let canvas = document.createElementNS(NS_XHTML, 'canvas');
    let context = canvas.getContext('2d');
    canvas.width = Math.min(img.width, 64);
    canvas.height = canvas.width;
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    let colors = context.getImageData(0, 0, canvas.width, canvas.height).data;
    canvas.remove();
    return colors;
  }

  function adjustLightness(rgb) {
    let lab = rgbToLab(rgb);
    // Set a minimum lightness to ensure that all colors are visible on a dark
    // background
    lab[0] = Math.max(lab[0], minLightness);
    return labToRgb(lab).map(Math.round);
  }

  function dominantColor(img) {
    let mostColorful = defaultColor;
    let freqs = {};
    let values = pixelColors(img);
    for (let i = 0; i < values.length; i += 4) {
      let r = values[i];
      let g = values[i + 1];
      let b = values[i + 2];
      let a = values[i + 3];
      let rgb = [r, g, b];
      // Skip transparent and greyish tones
      if (a < 1 || (r === g && r === b) || pseudoSaturation([r, g, b]) < 40) {
        continue;
      }
      freqs[rgb] = freqs[rgb] ? (freqs[rgb] + 1) : 1;
      if (pseudoSaturation(mostColorful) < pseudoSaturation(rgb)) {
        mostColorful = rgb;
      }
    }
    let sortedFreqs = Object.keys(freqs).sort((a, b) => freqs[b] - freqs[a]);
    let best;
    if (Object.keys(freqs).length === 0) {
      best = defaultColor;
    } else if (freqs[sortedFreqs[0]] > freqs[mostColorful] * 2) {
      // Choose most frequent color
      best = sortedFreqs[0].split(',').map(Number);
    } else {
      best = mostColorful;
    }
    return adjustLightness(best);
  }

  function rgbToString(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  function calculateIconColor(img) {
    return rgbToString(dominantColor(img));
  }

  return calculateIconColor;
})();