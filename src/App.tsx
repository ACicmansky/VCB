import { useState } from 'react'
import ColoringCanvas from './components/ColoringCanvas'
import ColorPicker from './components/ColorPicker'

function App() {
  const [selectedColor, setSelectedColor] = useState('#FF6B6B')

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, overflow: 'hidden' }}>
      <ColorPicker selectedColor={selectedColor} onColorSelect={setSelectedColor} />
      <ColoringCanvas color={selectedColor} />
    </div>
  )
}

export default App
