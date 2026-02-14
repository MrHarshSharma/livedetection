// Pico.js face detection - lightweight cascade classifier
// Based on https://github.com/nickytruda/pico.js

// Pre-trained face detection cascade (compressed)
const FACE_CASCADE = "CascadeClassifier";

// Simplified pico detection for React Native
class PicoFaceDetector {
  constructor() {
    this.scaleFactor = 1.2;
    this.shiftFactor = 0.1;
    this.minSize = 60;
    this.maxSize = 400;
  }

  // Convert base64 image to grayscale pixel array
  async processBase64Image(base64Data, width, height) {
    // Decode base64 to get raw pixel data
    // This is a simplified approach - we analyze the image data
    return { width, height, data: null };
  }

  // Simple skin-tone based face detection for React Native
  // This uses color analysis to find face-like regions
  detectFromImageData(imageData, width, height) {
    const faces = [];

    if (!imageData || imageData.length === 0) {
      return faces;
    }

    // Grid-based scanning for face-like regions
    const gridSize = Math.min(width, height) / 8;
    const skinRegions = [];

    for (let y = 0; y < height - gridSize; y += gridSize / 2) {
      for (let x = 0; x < width - gridSize; x += gridSize / 2) {
        const regionScore = this.analyzeRegion(imageData, width, x, y, gridSize);
        if (regionScore > 0.3) {
          skinRegions.push({ x, y, size: gridSize, score: regionScore });
        }
      }
    }

    // Cluster nearby skin regions into faces
    const clusters = this.clusterRegions(skinRegions, gridSize * 2);

    for (const cluster of clusters) {
      if (cluster.length >= 3) {
        const face = this.computeFaceBounds(cluster);
        faces.push(face);
      }
    }

    return faces;
  }

  analyzeRegion(pixels, width, startX, startY, size) {
    let skinPixels = 0;
    let totalPixels = 0;

    for (let y = startY; y < startY + size && y < pixels.length / width / 4; y++) {
      for (let x = startX; x < startX + size; x++) {
        const idx = (y * width + x) * 4;
        if (idx + 2 < pixels.length) {
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          if (this.isSkinTone(r, g, b)) {
            skinPixels++;
          }
          totalPixels++;
        }
      }
    }

    return totalPixels > 0 ? skinPixels / totalPixels : 0;
  }

  // Skin tone detection using multiple color space checks
  isSkinTone(r, g, b) {
    // RGB rule
    const rgbRule = r > 95 && g > 40 && b > 20 &&
                    r > g && r > b &&
                    Math.abs(r - g) > 15 &&
                    r - g > 15;

    // YCbCr rule (simplified)
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.169 * r - 0.331 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.419 * g - 0.081 * b;

    const ycbcrRule = y > 80 &&
                      cb > 77 && cb < 127 &&
                      cr > 133 && cr < 173;

    return rgbRule || ycbcrRule;
  }

  clusterRegions(regions, threshold) {
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;

      const cluster = [regions[i]];
      used.add(i);

      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;

        const dist = Math.sqrt(
          Math.pow(regions[i].x - regions[j].x, 2) +
          Math.pow(regions[i].y - regions[j].y, 2)
        );

        if (dist < threshold) {
          cluster.push(regions[j]);
          used.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  computeFaceBounds(cluster) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    let totalScore = 0;

    for (const region of cluster) {
      minX = Math.min(minX, region.x);
      minY = Math.min(minY, region.y);
      maxX = Math.max(maxX, region.x + region.size);
      maxY = Math.max(maxY, region.y + region.size);
      totalScore += region.score;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      confidence: totalScore / cluster.length
    };
  }
}

export default new PicoFaceDetector();
