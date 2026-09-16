import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './i18n/LangProvider'
import { AuthProvider } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import AuthModal from './components/AuthModal'
import ChatPage from './pages/ChatPage'
import MandiPage from './pages/MandiPage'
import WeatherPage from './pages/WeatherPage'
import PlannerPage from './pages/PlannerPage'
import FinancePage from './pages/FinancePage'

export default function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <LangProvider>
      <AuthProvider>
        <Router>
          <div className="app-shell">
            <Sidebar 
              isOpen={mobileSidebarOpen} 
              onClose={() => setMobileSidebarOpen(false)} 
            />

            <div className="app-main-canvas">
              <Header 
                onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
              />

              <Routes>
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/mandi" element={<MandiPage />} />
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/disease" element={<ChatPage />} />
              </Routes>
            </div>
          </div>
          <AuthModal />
        </Router>
      </AuthProvider>
    </LangProvider>
  )
}
