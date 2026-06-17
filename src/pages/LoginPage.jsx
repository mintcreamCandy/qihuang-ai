import { useState, useContext } from 'react'
import { AuthContext } from '../App'
import { apiService } from '../services/api'
import './LoginPage.css'

function LoginPage() {
  const { login, demoLogin } = useContext(AuthContext)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [registerAsAdmin, setRegisterAsAdmin] = useState(false)
  const [adminKey, setAdminKey] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('') // 输入时清除错误信息
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 基础参数校验
    if (!formData.email || !formData.password) {
      setError('请填写邮箱和密码')
      return
    }

    if (isRegister && !formData.username) {
      setError('请填写用户名')
      return
    }

    if (isRegister && formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (isRegister && registerAsAdmin && !adminKey) {
      setError('请填写管理员注册密钥')
      return
    }

    try {
      if (isRegister) {
        // 1. 调用后端接口注册
        await apiService.register(
          formData.email,
          formData.password,
          formData.username,
          registerAsAdmin ? adminKey : null
        )
        // 2. 注册成功后自动调用登录
        const tokenRes = await apiService.login(formData.email, formData.password)
        await login(tokenRes.access_token)
      } else {
        // 1. 调用后端接口登录
        const tokenRes = await apiService.login(formData.email, formData.password)
        await login(tokenRes.access_token)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || '操作失败，请重试')
    }
  }

  return (
    <div className="login-page" id="login-page">
      {/* ===== Left Decorative Panel ===== */}
      <div className="login-decor">
        <div className="decor-content">
          {/* Floating ink dots */}
          <div className="decor-dots">
            <span className="decor-dot" />
            <span className="decor-dot" />
            <span className="decor-dot" />
            <span className="decor-dot" />
            <span className="decor-dot" />
            <span className="decor-dot" />
          </div>

          <h1 className="decor-title animate-ink-fade">岐黄</h1>
          <p className="decor-tagline animate-fade-in-up delay-1">传承千年智慧，AI赋能健康</p>

          <div className="decor-divider animate-fade-in-up delay-2" />

          <blockquote className="decor-quote animate-fade-in-up delay-3">
            <p>「上工治未病，中工治欲病，下工治已病」</p>
            <cite>—— 《黄帝内经》</cite>
          </blockquote>

          <div className="decor-features animate-fade-in-up delay-4">
            <div className="decor-feature">
              <span className="feature-icon">📖</span>
              <span>经方 · 温病</span>
            </div>
            <div className="decor-feature">
              <span className="feature-icon">🧠</span>
              <span>AI 辨证</span>
            </div>
            <div className="decor-feature">
              <span className="feature-icon">🎯</span>
              <span>个性养生</span>
            </div>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="decor-gradient" />
      </div>

      {/* ===== Right Form Panel ===== */}
      <div className="login-form-panel">
        <div className="form-wrapper">
          {/* Tabs */}
          <div className="form-tabs" id="auth-tabs">
            <button
              className={`form-tab ${!isRegister ? 'active' : ''}`}
              onClick={() => { setIsRegister(false); setError(''); }}
              id="login-tab"
            >
              登录
            </button>
            <button
              className={`form-tab ${isRegister ? 'active' : ''}`}
              onClick={() => { setIsRegister(true); setError(''); }}
              id="register-tab"
            >
              注册
            </button>
          </div>

          <h2 className="form-title">
            {isRegister ? '创建账号' : '欢迎回来'}
          </h2>
          <p className="form-subtitle">
            {isRegister ? '开启您的中医智慧之旅' : '继续您的健康管理'}
          </p>

          {error && (
            <div className="animate-fade-in-up" style={{
              color: 'var(--color-cinnabar)',
              background: 'rgba(200, 75, 49, 0.06)',
              border: '1px solid rgba(200, 75, 49, 0.15)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-md)',
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="auth-form">
            {isRegister && (
              <div className="form-group animate-fade-in-up">
                <label htmlFor="username" className="form-label">用户名</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="input"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                className="input"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">密码</label>
              <input
                type="password"
                id="password"
                name="password"
                className="input"
                placeholder="请输入密码"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {isRegister && (
              <div className="form-group animate-fade-in-up">
                <label htmlFor="confirmPassword" className="form-label">确认密码</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="input"
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            )}

            {isRegister && (
              <div className="form-group animate-fade-in-up" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="registerAsAdmin"
                    checked={registerAsAdmin}
                    onChange={(e) => {
                      setRegisterAsAdmin(e.target.checked);
                      if (!e.target.checked) setAdminKey('');
                    }}
                    style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                  />
                  <label htmlFor="registerAsAdmin" className="form-label" style={{ margin: 0, cursor: 'pointer', userSelect: 'none' }}>
                    🛡️ 注册为管理员
                  </label>
                </div>
              </div>
            )}

            {isRegister && registerAsAdmin && (
              <div className="form-group animate-fade-in-up" style={{ marginTop: '12px' }}>
                <label htmlFor="adminKey" className="form-label">
                  管理员注册密钥 <span style={{ color: 'var(--color-gold-light)', fontSize: '11px', marginLeft: '4px' }}>（开发测试Key：qihuangadmin123）</span>
                </label>
                <input
                  type="password"
                  id="adminKey"
                  placeholder="请输入管理员专用注册密钥"
                  className="input"
                  value={adminKey}
                  onChange={(e) => {
                    setAdminKey(e.target.value);
                    setError('');
                  }}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg form-submit" id="auth-submit">
              {isRegister ? '注册' : '登录'}
            </button>
          </form>

          {/* Divider */}
          <div className="form-or">
            <span className="or-line" />
            <span className="or-text">或</span>
            <span className="or-line" />
          </div>

          {/* Demo Login */}
          <button
            className="btn btn-outline btn-lg form-demo"
            onClick={demoLogin}
            id="demo-login-btn"
          >
            ✨ 体验模式（免注册）
          </button>

          <p className="form-footer">
            {isRegister ? '已有账号？' : '没有账号？'}
            <button
              className="form-switch"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? '立即登录' : '立即注册'}
            </button>
          </p>

          <p className="form-legal">
            登录即表示同意 <a href="#">服务条款</a> 与 <a href="#">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
