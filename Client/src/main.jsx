import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import Chatbot from './ChatBot.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Chatbot />
  </StrictMode>,
)
