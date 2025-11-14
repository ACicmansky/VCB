import { useEffect, useRef, useState } from "react";
import { drawButterfly } from "./Silhouette";

interface ColoringCanvasProps {
  color: string;
  generatedImageUrl?: string | null;
}

export default function ColoringCanvas({ color, generatedImageUrl }: ColoringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);

  // Initialize and handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 140; // Account for generator + color picker height
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      // Trigger redraw after resize
      setCanvasKey(prev => prev + 1);
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
      // Clear ref and trigger redraw to show butterfly
      loadedImageRef.current = null;
      // Use queueMicrotask to defer state update (makes it async)
      queueMicrotask(() => setCanvasKey(prev => prev + 1));
      return;
    }

    const img = new Image();
    img.onload = () => {
      loadedImageRef.current = img;
      // Trigger redraw via state update in callback (async, so allowed)
      setCanvasKey(prev => prev + 1);
    };
    img.onerror = () => {
      console.error('Failed to load generated image');
      loadedImageRef.current = null;
      setCanvasKey(prev => prev + 1);
    };
    img.src = generatedImageUrl;
  }, [generatedImageUrl]);

  // Draw silhouette whenever canvasKey changes (triggered by image load or resize)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas first
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw generated image if available, otherwise draw butterfly
    const loadedImage = loadedImageRef.current;
    if (loadedImage) {
      // Center and scale the image
      const scale = Math.min(
        canvas.width / loadedImage.width,
        canvas.height / loadedImage.height
      ) * 0.9; // 90% of available space
      
      const scaledWidth = loadedImage.width * scale;
      const scaledHeight = loadedImage.height * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(loadedImage, x, y, scaledWidth, scaledHeight);
    } else {
      // Draw default butterfly silhouette
      drawButterfly(ctx, canvas.width, canvas.height);
    }
  }, [canvasKey]);

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

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
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
