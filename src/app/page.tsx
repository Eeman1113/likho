'use client'

import { useEffect, useRef, useState } from 'react'
import HandwritingCanvas from '@/components/HandwritingCanvas'

export default function Home() {
  return (
    <div style={{ margin: 0, padding: 0, border: 'none', boxSizing: 'border-box', fontFamily: 'Open Sans, sans-serif', fontWeight: 400, color: '#50555a', overscrollBehavior: 'none' }}>
      <HandwritingCanvas />
    </div>
  )
}

