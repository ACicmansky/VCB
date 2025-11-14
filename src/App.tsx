import { useState } from 'react'
import ColoringCanvas from './components/ColoringCanvas'
import ColorPicker from './components/ColorPicker'
import ImageGenerator from './components/ImageGenerator'

function App() {
  const [selectedColor, setSelectedColor] = useState('#FF6B6B')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, overflow: 'hidden' }}>
      <ImageGenerator onImageGenerated={handleImageGenerated} />
      <ColorPicker selectedColor={selectedColor} onColorSelect={setSelectedColor} />
      <ColoringCanvas color={selectedColor} generatedImageUrl={generatedImageUrl} />
    </div>
  )
}

export default App
