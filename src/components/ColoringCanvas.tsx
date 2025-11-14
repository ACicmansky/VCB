import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { drawButterflyOutline } from "./Silhouette";

interface ColoringCanvasProps {
  generatedImageUrl?: string | null;
  onProgressChange?: (progress: number) => void;
}

export interface ColoringCanvasRef {
  reset: () => void;
}

const ColoringCanvas = (
  { generatedImageUrl, onProgressChange }: ColoringCanvasProps,
  ref: React.Ref<ColoringCanvasRef>
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const whiteFillCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const outlineImageRef = useRef<HTMLImageElement | null>(null);
  const silhouetteMaskRef = useRef<ImageData | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Extract outline from generated image - only outer boundary
  // This extracts ONLY the outer boundary to prevent revealing original image underneath
  const extractOutline = (img: HTMLImageElement) => {
    // Create a temporary canvas to process the image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw the image
    tempCtx.drawImage(img, 0, 0);

    // Get image data
    const imageData = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    const data = imageData.data;
    const width = tempCanvas.width;
    const height = tempCanvas.height;

    // Helper function to get pixel index
    const getPixelIndex = (x: number, y: number): number => {
      if (x < 0 || x >= width || y < 0 || y >= height) return -1;
      return (y * width + x) * 4;
    };

    // Helper function to check if pixel is background (white/very light)
    const isBackgroundPixel = (idx: number): boolean => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Check if pixel is transparent or very light (background)
      if (a < 128) return true;

      // Calculate brightness
      const brightness = (r + g + b) / 3;

      // Consider pixels with brightness > 240 as background (white/very light)
      return brightness > 240;
    };

    // Create a mask to identify foreground (non-background) pixels
    const foregroundMask = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = getPixelIndex(x, y);
        foregroundMask[y * width + x] = isBackgroundPixel(idx) ? 0 : 1;
      }
    }

    // Extract only outer boundary pixels
    // A pixel is a boundary if it's foreground AND has at least one background neighbor
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = getPixelIndex(x, y);
        const isForeground = foregroundMask[y * width + x] === 1;

        if (!isForeground) {
          // Background pixel - make transparent
          data[idx + 3] = 0;
          continue;
        }

        // Check if this pixel is on the outer boundary
        // Check 8-connected neighbors (including diagonals for better boundary detection)
        const neighbors = [
          [x - 1, y - 1], // top-left
          [x, y - 1], // top
          [x + 1, y - 1], // top-right
          [x - 1, y], // left
          [x + 1, y], // right
          [x - 1, y + 1], // bottom-left
          [x, y + 1], // bottom
          [x + 1, y + 1], // bottom-right
        ];

        let isBoundary = false;
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            // Edge of image - this is a boundary pixel
            isBoundary = true;
            break;
          }
          const neighborIdx = ny * width + nx;
          if (foregroundMask[neighborIdx] === 0) {
            // Neighbor is background - this is a boundary pixel
            isBoundary = true;
            break;
          }
        }

        if (isBoundary) {
          // Keep this pixel as outline (pure black)
          data[idx] = 0; // R
          data[idx + 1] = 0; // G
          data[idx + 2] = 0; // B
          data[idx + 3] = 255; // Full opacity
        } else {
          // Internal pixel, not on boundary - make transparent
          // This prevents internal details from showing through
          data[idx + 3] = 0;
        }
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    // Create image from processed canvas
    const outlineImg = new Image();
    outlineImg.onload = () => {
      outlineImageRef.current = outlineImg;
      setCanvasKey((prev) => prev + 1);
    };
    outlineImg.src = tempCanvas.toDataURL();
  };

  // Initialize tracking canvas for progress calculation and white fill canvas
  useEffect(() => {
    const trackingCanvas = document.createElement("canvas");
    trackingCanvasRef.current = trackingCanvas;

    const whiteFillCanvas = document.createElement("canvas");
    whiteFillCanvasRef.current = whiteFillCanvas;

    return () => {
      trackingCanvasRef.current = null;
      whiteFillCanvasRef.current = null;
    };
  }, []);

  // Initialize and handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const trackingCanvas = trackingCanvasRef.current;
    const whiteFillCanvas = whiteFillCanvasRef.current;
    if (!canvas || !trackingCanvas || !whiteFillCanvas) return;

    const resizeCanvas = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 90; // Account for generator + progress bar height (color picker hidden)

      canvas.width = newWidth;
      canvas.height = newHeight;
      trackingCanvas.width = newWidth;
      trackingCanvas.height = newHeight;
      whiteFillCanvas.width = newWidth;
      whiteFillCanvas.height = newHeight;

      // Reset silhouette mask
      silhouetteMaskRef.current = null;

      // Trigger redraw after resize
      setCanvasKey((prev) => prev + 1);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Load generated image when URL changes
  useEffect(() => {
    if (!generatedImageUrl) {
      // Clear refs and trigger redraw to show butterfly
      loadedImageRef.current = null;
      outlineImageRef.current = null;
      // Use queueMicrotask to defer state update (makes it async)
      queueMicrotask(() => setCanvasKey((prev) => prev + 1));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImageRef.current = img;

      // Extract outline from the image
      extractOutline(img);

      // Trigger redraw via state update in callback (async, so allowed)
      setCanvasKey((prev) => prev + 1);
    };
    img.onerror = () => {
      console.error("Failed to load generated image");
      loadedImageRef.current = null;
      outlineImageRef.current = null;
      setCanvasKey((prev) => prev + 1);
    };
    img.src = generatedImageUrl;
  }, [generatedImageUrl]);

  // Simple flood fill implementation
  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    targetColor: number[],
    fillColor: number[]
  ) => {
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    const getPixel = (x: number, y: number): number[] => {
      const idx = (y * width + x) * 4;
      return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    };

    const setPixel = (x: number, y: number, color: number[]) => {
      const idx = (y * width + x) * 4;
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = color[3];
    };

    const colorsMatch = (c1: number[], c2: number[]): boolean => {
      return (
        Math.abs(c1[0] - c2[0]) < 10 &&
        Math.abs(c1[1] - c2[1]) < 10 &&
        Math.abs(c1[2] - c2[2]) < 10 &&
        Math.abs(c1[3] - c2[3]) < 10
      );
    };

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) {
        continue;
      }

      const pixel = getPixel(x, y);
      if (!colorsMatch(pixel, targetColor)) {
        continue;
      }

      visited.add(key);
      setPixel(x, y, fillColor);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Draw filled butterfly for mask calculation
  const drawButterflyFilled = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.4;

    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // Left wing (top)
    ctx.beginPath();
    ctx.ellipse(
      centerX - scale * 0.3,
      centerY - scale * 0.2,
      scale * 0.4,
      scale * 0.5,
      -0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Left wing (bottom)
    ctx.beginPath();
    ctx.ellipse(
      centerX - scale * 0.3,
      centerY + scale * 0.2,
      scale * 0.4,
      scale * 0.5,
      0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Right wing (top)
    ctx.beginPath();
    ctx.ellipse(
      centerX + scale * 0.3,
      centerY - scale * 0.2,
      scale * 0.4,
      scale * 0.5,
      0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Right wing (bottom)
    ctx.beginPath();
    ctx.ellipse(
      centerX + scale * 0.3,
      centerY + scale * 0.2,
      scale * 0.4,
      scale * 0.5,
      -0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, scale * 0.08, scale * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - scale * 0.5, scale * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - scale * 0.5);
    ctx.lineTo(centerX - scale * 0.1, centerY - scale * 0.65);
    ctx.moveTo(centerX, centerY - scale * 0.5);
    ctx.lineTo(centerX + scale * 0.1, centerY - scale * 0.65);
    ctx.stroke();

    // Antennae tips
    ctx.beginPath();
    ctx.arc(
      centerX - scale * 0.1,
      centerY - scale * 0.65,
      scale * 0.02,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      centerX + scale * 0.1,
      centerY - scale * 0.65,
      scale * 0.02,
      0,
      Math.PI * 2
    );
    ctx.fill();
  };

  // Calculate silhouette mask for progress tracking
  const calculateSilhouetteMask = useCallback(() => {
    const canvas = canvasRef.current;
    const trackingCanvas = trackingCanvasRef.current;
    if (!canvas || !trackingCanvas) return;

    const ctx = canvas.getContext("2d");
    const trackingCtx = trackingCanvas.getContext("2d");
    if (!ctx || !trackingCtx) return;

    // Clear tracking canvas
    trackingCtx.fillStyle = "white";
    trackingCtx.fillRect(0, 0, trackingCanvas.width, trackingCanvas.height);

    const loadedImage = loadedImageRef.current;

    if (loadedImage && outlineImageRef.current) {
      // For generated images, create mask from outline
      const scale =
        Math.min(
          canvas.width / loadedImage.width,
          canvas.height / loadedImage.height
        ) * 0.9;

      const scaledWidth = loadedImage.width * scale;
      const scaledHeight = loadedImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      // Draw outline to tracking canvas
      trackingCtx.drawImage(
        outlineImageRef.current,
        x,
        y,
        scaledWidth,
        scaledHeight
      );

      // Find a point inside the silhouette (center of the image)
      const centerX = Math.floor(trackingCanvas.width / 2);
      const centerY = Math.floor(trackingCanvas.height / 2);

      // Simple flood fill to mark silhouette area
      floodFill(
        trackingCtx,
        centerX,
        centerY,
        [255, 255, 255, 255],
        [200, 200, 200, 255]
      );

      silhouetteMaskRef.current = trackingCtx.getImageData(
        0,
        0,
        trackingCanvas.width,
        trackingCanvas.height
      );
    } else {
      // For butterfly, draw filled version to tracking canvas
      drawButterflyFilled(
        trackingCtx,
        trackingCanvas.width,
        trackingCanvas.height
      );

      silhouetteMaskRef.current = trackingCtx.getImageData(
        0,
        0,
        trackingCanvas.width,
        trackingCanvas.height
      );
    }
  }, []);

  // Create white fill mask that covers inner content (inside outline)
  const createWhiteFillMask = useCallback(() => {
    const canvas = canvasRef.current;
    const whiteFillCanvas = whiteFillCanvasRef.current;
    if (!canvas || !whiteFillCanvas || !silhouetteMaskRef.current) return;

    const whiteFillCtx = whiteFillCanvas.getContext("2d");
    if (!whiteFillCtx) return;

    // Clear white fill canvas
    whiteFillCtx.fillStyle = "transparent";
    whiteFillCtx.fillRect(0, 0, whiteFillCanvas.width, whiteFillCanvas.height);

    const mask = silhouetteMaskRef.current;
    const maskData = mask.data;
    const width = mask.width;
    const height = mask.height;

    // Create image data for white fill
    const fillImageData = whiteFillCtx.createImageData(width, height);
    const fillData = fillImageData.data;

    // Fill inner area (inside silhouette) with white
    for (let i = 0; i < maskData.length; i += 4) {
      const maskR = maskData[i];
      const maskG = maskData[i + 1];
      const maskB = maskData[i + 2];

      // Check if pixel is inside silhouette (not white in mask)
      const brightness = (maskR + maskG + maskB) / 3;
      if (brightness < 250) {
        // Inside silhouette - fill with white
        fillData[i] = 255; // R
        fillData[i + 1] = 255; // G
        fillData[i + 2] = 255; // B
        fillData[i + 3] = 255; // A (opaque white)
      } else {
        // Outside silhouette - transparent
        fillData[i] = 0;
        fillData[i + 1] = 0;
        fillData[i + 2] = 0;
        fillData[i + 3] = 0;
      }
    }

    whiteFillCtx.putImageData(fillImageData, 0, 0);
  }, []);

  // Calculate progress percentage - based on revealed pixels (white layer erased)
  const calculateProgress = () => {
    const canvas = canvasRef.current;
    const whiteFillCanvas = whiteFillCanvasRef.current;
    if (!canvas || !whiteFillCanvas || !silhouetteMaskRef.current) return 0;

    const whiteFillCtx = whiteFillCanvas.getContext("2d");
    if (!whiteFillCtx) return 0;

    // Get white fill canvas image data
    const whiteFillData = whiteFillCtx.getImageData(
      0,
      0,
      whiteFillCanvas.width,
      whiteFillCanvas.height
    );
    const maskData = silhouetteMaskRef.current;

    let silhouettePixels = 0;
    let revealedPixels = 0;

    // Check if pixel is part of silhouette (not white in mask)
    const isSilhouettePixel = (r: number, g: number, b: number): boolean => {
      const brightness = (r + g + b) / 3;
      return brightness < 250; // Not white
    };

    // Check if pixel is revealed (white layer is transparent/erased)
    const isRevealedPixel = (
      r: number,
      g: number,
      b: number,
      a: number
    ): boolean => {
      // Pixel is revealed if it's transparent or not white (erased)
      return a < 128 || (r + g + b) / 3 < 250;
    };

    for (let i = 0; i < maskData.data.length; i += 4) {
      const maskR = maskData.data[i];
      const maskG = maskData.data[i + 1];
      const maskB = maskData.data[i + 2];

      if (isSilhouettePixel(maskR, maskG, maskB)) {
        silhouettePixels++;
        const fillR = whiteFillData.data[i];
        const fillG = whiteFillData.data[i + 1];
        const fillB = whiteFillData.data[i + 2];
        const fillA = whiteFillData.data[i + 3];

        if (isRevealedPixel(fillR, fillG, fillB, fillA)) {
          revealedPixels++;
        }
      }
    }

    if (silhouettePixels === 0) return 0;
    return (revealedPixels / silhouettePixels) * 100;
  };

  // Draw layers whenever canvasKey changes (triggered by image load or resize)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas first
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw generated image if available, otherwise draw butterfly
    const loadedImage = loadedImageRef.current;
    if (loadedImage) {
      // Center and scale the image
      const scale =
        Math.min(
          canvas.width / loadedImage.width,
          canvas.height / loadedImage.height
        ) * 0.9; // 90% of available space

      const scaledWidth = loadedImage.width * scale;
      const scaledHeight = loadedImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      // Layer 1: Draw original image as base layer
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(loadedImage, x, y, scaledWidth, scaledHeight);

      // Layer 2: Draw white fill mask (middle layer, covers inner content)
      const whiteFillCanvas = whiteFillCanvasRef.current;
      if (whiteFillCanvas) {
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(whiteFillCanvas, 0, 0);
      }

      // Layer 3: Draw outline on top
      const outlineImg = outlineImageRef.current;
      if (outlineImg) {
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(outlineImg, x, y, scaledWidth, scaledHeight);
      }
    } else {
      // Draw default butterfly outline only (no fill)
      drawButterflyOutline(ctx, canvas.width, canvas.height);
    }

    // Calculate silhouette mask and white fill after drawing
    setTimeout(() => {
      calculateSilhouetteMask();
      createWhiteFillMask();
      if (onProgressChange) {
        onProgressChange(calculateProgress());
      }
    }, 100);
  }, [
    canvasKey,
    onProgressChange,
    calculateSilhouetteMask,
    createWhiteFillMask,
  ]);

  const getCoordinates = (
    e: MouseEvent | TouchEvent
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if (e instanceof MouseEvent) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    } else if (e instanceof TouchEvent) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return null;
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e.nativeEvent);
    if (coords) {
      lastPointRef.current = { x: coords.x, y: coords.y };
      drawAt(coords.x, coords.y);
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCoordinates(e.nativeEvent);
    if (coords) {
      drawAt(coords.x, coords.y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const drawAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const whiteFillCanvas = whiteFillCanvasRef.current;
    if (!canvas || !whiteFillCanvas) return;

    const ctx = canvas.getContext("2d");
    const whiteFillCtx = whiteFillCanvas.getContext("2d");
    if (!ctx || !whiteFillCtx) return;

    // Check if the click is inside the silhouette before drawing
    if (!isInsideSilhouette(x, y)) {
      lastPointRef.current = null; // Reset last point if outside silhouette
      return; // Don't draw outside the silhouette
    }

    const brushRadius = 15;

    // Erase white fill layer using destination-out composite operation
    whiteFillCtx.globalCompositeOperation = "destination-out";
    whiteFillCtx.fillStyle = "rgba(255, 255, 255, 1)";
    whiteFillCtx.strokeStyle = "rgba(255, 255, 255, 1)";
    whiteFillCtx.lineWidth = brushRadius * 2;
    whiteFillCtx.lineCap = "round";
    whiteFillCtx.lineJoin = "round";

    whiteFillCtx.beginPath();

    if (lastPointRef.current) {
      // Draw a line from the last point to the current point
      whiteFillCtx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      whiteFillCtx.lineTo(x, y);
      whiteFillCtx.stroke();
    }

    // Always draw a circle at the current point to ensure coverage
    whiteFillCtx.beginPath();
    whiteFillCtx.arc(x, y, brushRadius, 0, Math.PI * 2);
    whiteFillCtx.fill();

    // Update last point
    lastPointRef.current = { x, y };

    // Redraw layers: base image → white fill (with erased areas) → outline
    const loadedImage = loadedImageRef.current;
    if (loadedImage) {
      const scale =
        Math.min(
          canvas.width / loadedImage.width,
          canvas.height / loadedImage.height
        ) * 0.9;
      const scaledWidth = loadedImage.width * scale;
      const scaledHeight = loadedImage.height * scale;
      const imgX = (canvas.width - scaledWidth) / 2;
      const imgY = (canvas.height - scaledHeight) / 2;

      // Clear and redraw layers
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Layer 1: Original image
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(loadedImage, imgX, imgY, scaledWidth, scaledHeight);

      // Layer 2: White fill (with erased areas)
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(whiteFillCanvas, 0, 0);

      // Layer 3: Outline
      const outlineImg = outlineImageRef.current;
      if (outlineImg) {
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(outlineImg, imgX, imgY, scaledWidth, scaledHeight);
      }
    }

    // Update progress
    if (onProgressChange) {
      const progress = calculateProgress();
      onProgressChange(progress);
    }
  };

  // Check if a point is inside the silhouette
  const isInsideSilhouette = (x: number, y: number): boolean => {
    const mask = silhouetteMaskRef.current;
    if (!mask) return false; // If no mask, allow drawing (fallback)

    const canvas = canvasRef.current;
    if (!canvas) return false;

    // Convert canvas coordinates to mask coordinates
    const maskX = Math.floor(x);
    const maskY = Math.floor(y);

    // Check bounds
    if (maskX < 0 || maskX >= mask.width || maskY < 0 || maskY >= mask.height) {
      return false;
    }

    // Get pixel from mask
    const idx = (maskY * mask.width + maskX) * 4;
    const r = mask.data[idx];
    const g = mask.data[idx + 1];
    const b = mask.data[idx + 2];

    // Check if pixel is part of silhouette (not white in mask)
    const brightness = (r + g + b) / 3;
    return brightness < 250; // Inside silhouette if not white
  };

  // Reset function to restore white fill layer
  const reset = useCallback(() => {
    // Recreate white fill mask
    createWhiteFillMask();

    // Redraw all layers
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadedImage = loadedImageRef.current;
    if (loadedImage) {
      const scale =
        Math.min(
          canvas.width / loadedImage.width,
          canvas.height / loadedImage.height
        ) * 0.9;
      const scaledWidth = loadedImage.width * scale;
      const scaledHeight = loadedImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      // Clear canvas
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Layer 1: Original image
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(loadedImage, x, y, scaledWidth, scaledHeight);

      // Layer 2: White fill (restored)
      const whiteFillCanvas = whiteFillCanvasRef.current;
      if (whiteFillCanvas) {
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(whiteFillCanvas, 0, 0);
      }

      // Layer 3: Outline
      const outlineImg = outlineImageRef.current;
      if (outlineImg) {
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(outlineImg, x, y, scaledWidth, scaledHeight);
      }
    }

    // Reset progress
    if (onProgressChange) {
      onProgressChange(0);
    }
  }, [createWhiteFillMask, onProgressChange]);

  // Expose reset function via ref
  useImperativeHandle(ref, () => ({
    reset,
  }));

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      style={{
        display: "block",
        cursor: "crosshair",
        touchAction: "none",
      }}
    />
  );
};

export default React.forwardRef(ColoringCanvas);
