import { useState } from 'react'
import ColoringCanvas from './components/ColoringCanvas'
import ColorPicker from './components/ColorPicker'
import ImageGenerator from './components/ImageGenerator'
import ProgressBar from './components/ProgressBar'

function App() {
  const [selectedColor, setSelectedColor] = useState('#FF6B6B')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl)
    setProgress(0) // Reset progress when new image is generated
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, overflow: 'hidden' }}>
      <ImageGenerator onImageGenerated={handleImageGenerated} />
      <ColorPicker selectedColor={selectedColor} onColorSelect={setSelectedColor} />
      <ProgressBar progress={progress} />
      <ColoringCanvas color={selectedColor} generatedImageUrl={generatedImageUrl} onProgressChange={setProgress} />
    </div>
  )
}

export default App
