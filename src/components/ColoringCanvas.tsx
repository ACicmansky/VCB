import { useEffect, useRef, useState } from "react";
import { drawButterfly } from "./Silhouette";

interface ColoringCanvasProps {
  color: string;
}

export default function ColoringCanvas({ color }: ColoringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSilhouette, setHasDrawnSilhouette] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80; // Account for color picker height

      // Redraw silhouette if it was already drawn
      if (hasDrawnSilhouette) {
        drawButterfly(ctx, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [hasDrawnSilhouette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasDrawnSilhouette) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw silhouette on first render
    drawButterfly(ctx, canvas.width, canvas.height);
    setHasDrawnSilhouette(true);
  }, [hasDrawnSilhouette]);

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
