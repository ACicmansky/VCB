import { useCallback, useEffect, useRef, useState } from "react";
import { drawButterflyOutline } from "./Silhouette";

interface ColoringCanvasProps {
  color: string;
  generatedImageUrl?: string | null;
  onProgressChange?: (progress: number) => void;
}

export default function ColoringCanvas({
  color,
  generatedImageUrl,
  onProgressChange,
}: ColoringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const outlineImageRef = useRef<HTMLImageElement | null>(null);
  const silhouetteMaskRef = useRef<ImageData | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);

  // Extract outline from generated image
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

    // Extract only black/dark pixels (outline)
    // Threshold: pixels darker than this are considered outline
    const threshold = 80;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Calculate brightness
      const brightness = (r + g + b) / 3;

      // If pixel is dark enough and has sufficient opacity, keep it as outline
      // Otherwise make it transparent
      if (brightness > threshold || a < 200) {
        data[i + 3] = 0; // Make transparent
      } else {
        // Keep the dark pixel as outline (make it pure black)
        data[i] = 0; // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
        data[i + 3] = 255; // Full opacity
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

  // Initialize tracking canvas for progress calculation
  useEffect(() => {
    const trackingCanvas = document.createElement("canvas");
    trackingCanvasRef.current = trackingCanvas;
    return () => {
      trackingCanvasRef.current = null;
    };
  }, []);

  // Initialize and handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const trackingCanvas = trackingCanvasRef.current;
    if (!canvas || !trackingCanvas) return;

    const resizeCanvas = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 140; // Account for generator + color picker height

      canvas.width = newWidth;
      canvas.height = newHeight;
      trackingCanvas.width = newWidth;
      trackingCanvas.height = newHeight;

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

  // Calculate progress percentage
  const calculateProgress = () => {
    const canvas = canvasRef.current;
    const trackingCanvas = trackingCanvasRef.current;
    if (!canvas || !trackingCanvas || !silhouetteMaskRef.current) return 0;

    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    // Get current canvas image data
    const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = silhouetteMaskRef.current;

    let silhouettePixels = 0;
    let coloredPixels = 0;

    // Check if pixel is part of silhouette (not white in mask)
    const isSilhouettePixel = (r: number, g: number, b: number): boolean => {
      const brightness = (r + g + b) / 3;
      return brightness < 250; // Not white
    };

    // Check if pixel is colored (not white)
    const isColoredPixel = (r: number, g: number, b: number): boolean => {
      const brightness = (r + g + b) / 3;
      return brightness < 250; // Not white
    };

    for (let i = 0; i < maskData.data.length; i += 4) {
      const maskR = maskData.data[i];
      const maskG = maskData.data[i + 1];
      const maskB = maskData.data[i + 2];

      if (isSilhouettePixel(maskR, maskG, maskB)) {
        silhouettePixels++;
        const canvasR = canvasData.data[i];
        const canvasG = canvasData.data[i + 1];
        const canvasB = canvasData.data[i + 2];

        if (isColoredPixel(canvasR, canvasG, canvasB)) {
          coloredPixels++;
        }
      }
    }

    if (silhouettePixels === 0) return 0;
    return (coloredPixels / silhouettePixels) * 100;
  };

  // Draw silhouette whenever canvasKey changes (triggered by image load or resize)
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

      // Only draw the outline (not the full image with fills)
      const outlineImg = outlineImageRef.current;
      if (outlineImg) {
        ctx.drawImage(outlineImg, x, y, scaledWidth, scaledHeight);
      } else {
        // Fallback: draw the base image if outline extraction hasn't completed yet
        ctx.drawImage(loadedImage, x, y, scaledWidth, scaledHeight);
      }
    } else {
      // Draw default butterfly outline only (no fill)
      drawButterflyOutline(ctx, canvas.width, canvas.height);
    }

    // Calculate silhouette mask after drawing
    setTimeout(() => {
      calculateSilhouetteMask();
      if (onProgressChange) {
        onProgressChange(calculateProgress());
      }
    }, 100);
  }, [canvasKey, onProgressChange, calculateSilhouetteMask]);

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
  };

  const drawAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use destination-over so colors go behind existing content (outline)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Redraw outline on top after coloring
    redrawOutline();

    // Update progress
    if (onProgressChange) {
      const progress = calculateProgress();
      onProgressChange(progress);
    }
  };

  const redrawOutline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadedImage = loadedImageRef.current;

    if (loadedImage && outlineImageRef.current) {
      // Redraw outline for generated image
      const scale =
        Math.min(
          canvas.width / loadedImage.width,
          canvas.height / loadedImage.height
        ) * 0.9;

      const scaledWidth = loadedImage.width * scale;
      const scaledHeight = loadedImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(outlineImageRef.current, x, y, scaledWidth, scaledHeight);
    } else {
      // Redraw butterfly outline
      ctx.globalCompositeOperation = "source-over";
      drawButterflyOutline(ctx, canvas.width, canvas.height);
    }
  };

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
}
