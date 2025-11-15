import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import ColoringCanvas, {
  type ColoringCanvasRef,
} from "../components/ColoringCanvas";
import ProgressBar from "../components/ProgressBar";
import elsaImage from "../assets/elsa.jpg";

export default function ElsaPage() {
  const [generatedImageUrl] = useState<string | null>(elsaImage);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<ColoringCanvasRef>(null);

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
          to="/paint"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            backgroundColor: "#4ECDC4",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#3DBDB3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4ECDC4";
          }}
        >
          Go to Butterfly
        </Link>
      </div>
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
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#FF6B6B",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
            minWidth: "100px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#E55A5A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FF6B6B";
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
