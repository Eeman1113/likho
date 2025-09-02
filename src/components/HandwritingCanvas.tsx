'use client'

import { useEffect, useRef, useState } from 'react'

export default function HandwritingCanvas() {
  const canvasRef = useRef<SVGSVGElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSaveButton, setShowSaveButton] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [speed, setSpeed] = useState(2.49)
  const [bias, setBias] = useState(0.75)
  const [strokeWidth, setStrokeWidth] = useState(0.75)
  const [selectedStyle, setSelectedStyle] = useState('-')
  
  // Global variables for the handwriting algorithm
  const globalVars = useRef<any>({})

  useEffect(() => {
    // Load the model and initialize the handwriting system
    loadModel()
  }, [])

  const loadModel = async () => {
    try {
      const response = await fetch('/d.bin')
      const arrayBuffer = await response.arrayBuffer()
      
      // Initialize the model with the loaded data
      globalVars.current.$ = parseModel(arrayBuffer)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load model:', error)
    }
  }

  const parseModel = (buffer: ArrayBuffer) => {
    // This is the model parsing logic from the original code
    let offset = 0
    const weights: any = {}
    const dataView = new DataView(buffer)
    
    const loadWeights = () => {
      while (offset < dataView.byteLength) {
        // Read layer name length
        const nameLength = dataView.getUint8(offset)
        offset += 1
        
        // Read layer name
        const nameBytes = new Uint8Array(nameLength)
        for (let i = 0; i < nameLength; i++) {
          nameBytes[i] = dataView.getUint8(offset)
          offset += 1
        }
        const layerName = String.fromCharCode(...nameBytes)
        
        // Read sparse flag
        const isSparse = dataView.getUint8(offset)
        offset += 1
        
        // Read weight count
        const weightCount = dataView.getUint32(offset, true)
        offset += 4
        
        // Read weights
        const weights_data = new Float32Array(weightCount)
        for (let i = 0; i < weightCount; i++) {
          weights_data[i] = dataView.getFloat32(offset, true)
          offset += 4
        }
        
        let indices_data: Uint8Array | undefined
        if (isSparse) {
          indices_data = new Uint8Array(weightCount)
          for (let i = 0; i < weightCount; i++) {
            indices_data[i] = dataView.getUint16(offset, true)
            offset += 1
          }
        }
        
        // Read shape length
        const shapeLength = dataView.getUint8(offset)
        offset += 1
        
        // Read shape
        const shape = new Uint16Array(shapeLength)
        for (let i = 0; i < shapeLength; i++) {
          shape[i] = dataView.getUint16(offset, true)
          offset += 2
        }
        
        // Process weights based on type
        if (['y', 'w', 'r', 'l'].includes(layerName)) {
          weights[layerName] = createSparseMatrix(weights_data, indices_data!, shape)
        } else if (isSparse) {
          weights[layerName] = createDenseFromSparse(weights_data, indices_data!, shape)
        } else {
          weights[layerName] = weights_data
        }
      }
    }
    
    loadWeights()
    return weights
  }

  const createSparseMatrix = (values: Float32Array, indices: Uint8Array, shape: Uint16Array) => {
    // Sparse matrix creation logic
    const [rows, cols] = shape
    const result = new Float32Array(rows * cols)
    
    let valueIndex = 0
    const rowPointers = [0]
    let currentRow = 0
    
    for (let i = 0; i < indices.length; i++) {
      const col = indices[i]
      if (col === 0 && i > 0) {
        currentRow++
        rowPointers.push(valueIndex)
      }
      if (valueIndex < values.length) {
        result[currentRow * cols + col] = values[valueIndex]
        valueIndex++
      }
    }
    
    return [shape, values, indices, rowPointers]
  }

  const createDenseFromSparse = (values: Float32Array, indices: Uint8Array, shape: Uint16Array) => {
    // Dense matrix creation from sparse data
    const totalSize = shape.reduce((a, b) => a * b, 1)
    const result = new Float32Array(totalSize)
    
    let valueIndex = 0
    for (let i = 0; i < indices.length; i++) {
      result[valueIndex += indices[i]] = values[i]
    }
    
    return result
  }

  const generateHandwriting = () => {
    if (!globalVars.current.$ || !textInput.trim()) return
    
    setShowSaveButton(true)
    
    // Clear previous paths
    const canvas = canvasRef.current
    if (canvas) {
      while (canvas.lastChild) {
        canvas.removeChild(canvas.lastChild)
      }
    }
    
    // Convert text to character codes
    const charMap: { [key: string]: number } = {
      '': 0, '': 2, ' ': 8, '"': 4, '&': 84, '(': 66, '*': 80, ',': 37, '.': 7,
      '0': 62, '2': 63, '4': 68, '6': 71, '8': 76, ':': 74,
      'B': 47, 'D': 52, 'F': 53, 'H': 41, 'J': 64, 'L': 48, 'N': 38, 'P': 46, 'R': 55, 'T': 31, 'V': 39, 'X': 79, 'Z': 78,
      'b': 32, 'd': 27, 'f': 35, 'h': 30, 'j': 43, 'l': 26, 'n': 15, 'p': 29, 'r': 6, 't': 21, 'v': 34, 'x': 44, 'z': 10,
      '': 1, '': 3, '!': 72, '#': 56, "'": 16, ')': 67, '+': 82, '-': 40, '/': 77,
      '1': 59, '3': 69, '5': 61, '7': 70, '9': 60, ';': 73, '?': 51,
      'A': 9, 'C': 57, 'E': 42, 'G': 45, 'I': 23, 'K': 58, 'M': 5, 'O': 36, 'Q': 75, 'S': 18, 'U': 65, 'W': 54, 'Y': 50, '[': 81, ']': 83,
      'a': 14, 'c': 20, 'e': 19, 'g': 33, 'i': 13, 'k': 28, 'm': 12, 'o': 25, 'q': 49, 's': 17, 'u': 11, 'w': 24, 'y': 22
    }
    
    const text = textInput.trim().replace(/\\s+/g, ' ')
    const chars = text.split('').map(char => char in charMap ? charMap[char] : 1)
    const sequence = [2, ...chars, 3] // Add start and end tokens
    
    // Generate handwriting using the neural network
    generatePath(sequence)
  }

  const generatePath = (sequence: number[]) => {
    // This would contain the complex neural network logic
    // For now, we'll create a simple placeholder path
    const canvas = canvasRef.current
    if (!canvas) return
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    
    // Simple placeholder path generation
    let pathData = 'M 100 200'
    const textLength = sequence.length
    
    for (let i = 0; i < textLength * 20; i++) {
      const x = 100 + i * 15
      const y = 200 + Math.sin(i * 0.1) * 20 + (Math.random() - 0.5) * 10
      pathData += ` L ${x} ${y}`
    }
    
    path.setAttribute('d', pathData)
    path.style.stroke = 'black'
    path.style.strokeWidth = strokeWidth.toString()
    path.style.fill = 'none'
    
    canvas.appendChild(path)
  }

  const downloadSVG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const bbox = canvas.getBBox()
    const viewBox = [
      (bbox.x - 3).toFixed(3),
      (bbox.y - 3).toFixed(3),
      (bbox.width + 6).toFixed(3),
      (bbox.height + 6).toFixed(3)
    ].join(' ')
    
    canvas.setAttribute('viewBox', viewBox)
    const svgData = new XMLSerializer().serializeToString(canvas)
    canvas.removeAttribute('viewBox')
    
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${textInput.toLowerCase().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-').trim()}.svg`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      generateHandwriting()
    }
  }

  return (
    <div>
      {isLoading && (
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
          Loading...
        </div>
      )}
      
      {showSaveButton && (
        <div 
          style={{ position: 'absolute', top: '20px', left: '20px', cursor: 'pointer' }}
          onClick={downloadSVG}
        >
          <svg height="25" width="25" viewBox="0 0 512 512">
            <title>Download</title>
            <path d="m409.8 278.5-153.8 153.8-153.8-153.8 28.3-28.3 105.5 105.5v-355.7h40v355.7l105.5-105.5zm102.2 193.5h-512v40h512zm0 0" fill="#666" />
          </svg>
        </div>
      )}
      
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'right', justifyContent: 'right' }}>
        <div style={{ marginLeft: 'auto', paddingLeft: '30px', display: 'flex' }}>
          <div style={{ marginRight: '5px' }}>Speed:</div>
          <div style={{ paddingTop: '3px' }}>
            <input 
              type="range" 
              min="0.6" 
              max="9.51" 
              step="0.1" 
              value={speed} 
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
        </div>
        
        <div style={{ marginLeft: 'auto', paddingLeft: '30px', display: 'flex' }}>
          <div style={{ marginRight: '5px' }}>Legibility:</div>
          <div style={{ paddingTop: '3px' }}>
            <input 
              type="range" 
              min="0.15" 
              max="2.5" 
              step="0.02" 
              value={bias} 
              onChange={(e) => setBias(parseFloat(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
        </div>
        
        <div style={{ marginLeft: 'auto', paddingLeft: '30px', display: 'flex' }}>
          <div style={{ marginRight: '5px' }}>Stroke Width:</div>
          <div style={{ paddingTop: '3px' }}>
            <input 
              type="range" 
              min="0.1" 
              max="1.5" 
              step="0.02" 
              value={strokeWidth} 
              onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
        </div>
        
        <div style={{ marginLeft: 'auto', paddingLeft: '30px', display: 'flex' }}>
          <div style={{ marginRight: '5px' }}>Style:</div>
          <select 
            value={selectedStyle} 
            onChange={(e) => setSelectedStyle(e.target.value)}
            style={{ fontSize: '16px', height: '25px', border: '1px solid #969ba0' }}
          >
            <option value="-">–</option>
            <option value="44">1</option>
            <option value="54">2</option>
            <option value="23">3</option>
            <option value="1">4</option>
            <option value="19">5</option>
            <option value="6">6</option>
            <option value="30">7</option>
            <option value="11">8</option>
            <option value="21">9</option>
          </select>
        </div>
      </div>
      
      <svg 
        ref={canvasRef}
        style={{ width: '100vw', height: 'calc(100vh - 70px)', display: 'block' }}
      >
      </svg>
      
      <div style={{ border: '1px solid #969ba0', display: 'flex', height: '70px' }}>
        <input 
          type="text" 
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter text here" 
          maxLength={50}
          autoFocus
          style={{ 
            width: '100%', 
            height: '100%', 
            fontSize: '22px', 
            outline: 'none', 
            paddingLeft: '30px', 
            fontFamily: 'Courier, monospace', 
            fontWeight: 400, 
            letterSpacing: '3px',
            border: 'none'
          }}
        />
        <button 
          onClick={generateHandwriting}
          style={{ 
            borderLeft: '1px solid #969ba0', 
            padding: '0 30px', 
            fontWeight: 600, 
            cursor: 'pointer', 
            backgroundColor: '#fff', 
            height: '100%', 
            fontSize: '22px', 
            outline: 'none',
            border: 'none'
          }}
        >
          Write!
        </button>
      </div>
    </div>
  )
}

