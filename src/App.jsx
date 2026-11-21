import React from 'react'
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom'
import Auth from './pages/Auth.jsx'
import SubmissionPage from './pages/SubmissionPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/submission"
          element={
            <ProtectedRoute>
              <SubmissionPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
