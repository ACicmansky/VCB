import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import ColoringCanvas, {
  type ColoringCanvasRef,
} from "../components/ColoringCanvas";
import ImageGenerator from "../components/ImageGenerator";
import ProgressBar from "../components/ProgressBar";

export default function ButterflyPage() {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<ColoringCanvasRef>(null);

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl);
    setProgress(0); // Reset progress when new image is generated
  };

  const handleReset = () => {
    canvasRef.current?.reset();
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 15px",
          backgroundColor: "#f9f9f9",
          borderBottom: "2px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
        }}
      >
        <Link
          to="/"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            backgroundColor: "#FF6B9D",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#E55A8D";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FF6B9D";
          }}
        >
          Go to Elsa
        </Link>
      </div>
      <ImageGenerator
        onImageGenerated={handleImageGenerated}
        showLoadElsa={false}
      />
      <div
        style={{
          padding: "10px 15px",
          backgroundColor: "#f9f9f9",
          borderBottom: "2px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
        }}
      >
        <ProgressBar progress={progress} />
        <button
          onClick={handleReset}
          disabled={!generatedImageUrl}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: !generatedImageUrl ? "#ccc" : "#FF6B6B",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: !generatedImageUrl ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            minWidth: "100px",
          }}
          onMouseEnter={(e) => {
            if (generatedImageUrl) {
              e.currentTarget.style.backgroundColor = "#E55A5A";
            }
          }}
          onMouseLeave={(e) => {
            if (generatedImageUrl) {
              e.currentTarget.style.backgroundColor = "#FF6B6B";
            }
          }}
        >
          Reset
        </button>
      </div>
      <ColoringCanvas
        ref={canvasRef}
        generatedImageUrl={generatedImageUrl}
        onProgressChange={setProgress}
      />
    </div>
  );
}
