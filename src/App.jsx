import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, createContext, useEffect } from 'react'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ConsultPage from './pages/ConsultPage'
import HerbLibrary from './pages/HerbLibrary'
import PrescriptionLibrary from './pages/PrescriptionLibrary'
import ProfilePage from './pages/ProfilePage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import { apiService } from './services/api'
import './App.css'

// Auth Context for managing user state across the app
export const AuthContext = createContext(null)

function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // 页面加载时校验本地 Token 是否有效，并自动登录
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('qihuang_token')
      if (token) {
        try {
          const dbUser = await apiService.getMe()
          const dbProfile = await apiService.getProfile()
          setUser({ ...dbUser, profile: dbProfile })
          setIsAuthenticated(true)
        } catch (err) {
          console.error("Token 校验失败:", err)
          localStorage.removeItem('qihuang_token')
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  // 正常登录
  const login = async (token) => {
    localStorage.setItem('qihuang_token', token)
    const dbUser = await apiService.getMe()
    const dbProfile = await apiService.getProfile()
    setUser({ ...dbUser, profile: dbProfile })
    setIsAuthenticated(true)
  }

  // 登出
  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('qihuang_token')
  }

  // 更新用户健康画像
  const updateUserProfile = async (profileData) => {
    try {
      const updatedProfile = await apiService.updateProfile(profileData)
      setUser(prev => ({
        ...prev,
        profile: updatedProfile
      }))
    } catch (err) {
      console.error("更新画像失败:", err)
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--color-bg-primary)' }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-gold-light)', fontSize: 'var(--text-xl)' }}>
          📜 岐黄问诊加载中...
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUserProfile }}>
      <div className="app">
        {isAuthenticated && <Header />}
        <main className={isAuthenticated ? 'main-content' : ''}>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
              }
            />
            <Route
              path="/"
              element={
                isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/consult"
              element={
                isAuthenticated ? <ConsultPage /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/herbs"
              element={
                isAuthenticated ? <HerbLibrary /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/prescriptions"
              element={
                isAuthenticated ? <PrescriptionLibrary /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/knowledge-graph"
              element={
                isAuthenticated ? <KnowledgeGraphPage /> : <Navigate to="/login" replace />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  )
}

export default App
