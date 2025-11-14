interface ProgressBarProps {
  progress: number; // 0-100
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      style={{
        padding: "10px 15px",
        backgroundColor: "#f9f9f9",
        borderBottom: "2px solid #ddd",
        display: "flex",
        alignItems: "center",
        gap: "15px",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#333", minWidth: "80px" }}>
        Progress: {Math.round(clampedProgress)}%
      </div>
      <div
        style={{
          flex: 1,
          height: "20px",
          backgroundColor: "#e0e0e0",
          borderRadius: "10px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${clampedProgress}%`,
            height: "100%",
            backgroundColor: "#4ECDC4",
            transition: "width 0.3s ease",
            borderRadius: "10px",
          }}
        />
      </div>
    </div>
  );
}

