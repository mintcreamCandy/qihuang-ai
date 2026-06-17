import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../App'
import './HomePage.css'

function HomePage() {
  const { user } = useContext(AuthContext)
  const profile = user?.profile || {}

  /* 体质雷达数据 */
  const radarData = [
    { label: '气', value: 30, color: 'var(--color-jade)' },
    { label: '血', value: 55, color: 'var(--color-cinnabar)' },
    { label: '阴', value: 65, color: 'var(--color-gold)' },
    { label: '阳', value: 50, color: 'var(--color-cinnabar)' },
    { label: '精', value: 70, color: 'var(--color-jade)' },
    { label: '神', value: 60, color: 'var(--color-gold-light)' },
  ]

  /* 每日推荐数据 */
  const recommendations = [
    {
      icon: '🍵',
      category: '养生茶饮',
      title: '黄芪枸杞茶',
      description: '补气养血，适合气虚体质日常饮用。黄芪 10g、枸杞 8g、红枣 3枚，沸水冲泡。',
      tag: '补气',
      tagClass: 'tag-jade',
      accent: 'accent-gold',
    },
    {
      icon: '🥗',
      category: '食疗方案',
      title: '山药薏米粥',
      description: '健脾益气，祛湿养胃。山药 30g、薏米 20g、粳米 50g，文火慢煮。',
      tag: '健脾',
      tagClass: 'tag-gold',
      accent: 'accent-jade',
    },
    {
      icon: '🌿',
      category: '时令养生',
      title: '芒种养生',
      description: '宜清热祛湿，注意健脾养胃。此时节应早睡早起，适当午休，饮食清淡。',
      tag: '时令',
      tagClass: 'tag-cinnabar',
      accent: 'accent-cinnabar',
    },
  ]

  /* 快捷入口 */
  const quickAccess = [
    { icon: '💬', title: 'AI问诊', desc: '描述症状，智能辨证分析', path: '/consult', iconClass: 'qa-icon-consult' },
    { icon: '🌿', title: '本草百科', desc: '500+ 味中药详解', path: '/herbs', iconClass: 'qa-icon-herbs' },
    { icon: '📜', title: '经典方剂', desc: '伤寒论 · 金匮要略 · 温病条辨', path: '/prescriptions', iconClass: 'qa-icon-prescriptions' },
    { icon: '📊', title: '知识图谱', desc: '可视化中医知识体系', path: '/knowledge-graph', iconClass: 'qa-icon-knowledge' },
  ]

  return (
    <div className="home-page">
      {/* ===== Hero Section ===== */}
      <section className="home-hero" id="home-hero">
        <div className="hero-decoration">
          <span className="hero-dot" />
          <span className="hero-dot" />
          <span className="hero-dot" />
          <span className="hero-dot" />
          <span className="hero-dot" />
        </div>
        <h1 className="hero-title animate-ink-fade">岐黄</h1>
        <p className="hero-subtitle animate-fade-in-up delay-1">融合经方与温病 · 守护您的健康</p>
        <div className="hero-cta animate-fade-in-up delay-2">
          <Link to="/consult" className="btn btn-primary btn-lg animate-pulse-glow" id="hero-consult-btn">
            🩺 开始问诊
          </Link>
        </div>
      </section>

      <div className="container">
        {/* ===== Profile Summary ===== */}
        <section className="home-profile animate-fade-in-up delay-2" id="profile-summary">
          <div className="card profile-card">
            <div className="profile-avatar">{user?.name?.charAt(0) || '用'}</div>
            <div className="profile-info">
              <p className="profile-greeting">
                晚上好，<strong>{user?.name || '用户'}</strong>
              </p>
              <p className="profile-constitution">
                体质类型：<span className="constitution-type">{profile.constitution || '未测试'}</span>
              </p>

              {/* 体质五行状态网格 */}
              <div className="constitution-status-grid">
                {radarData.map((item) => (
                  <div key={item.label} className="status-item">
                    <div className="status-header">
                      <span className="status-label">{item.label}</span>
                      <span className="status-value">{item.value}%</span>
                    </div>
                    <div className="status-track">
                      <div
                        className="status-fill"
                        style={{
                          width: `${item.value}%`,
                          background: `linear-gradient(to right, ${item.color}88, ${item.color})`,
                          boxShadow: `0 0 6px ${item.color}44`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 体质特征标签 */}
              <div className="profile-tags">
                {(profile.characteristics || []).map((char) => (
                  <span key={char} className="tag tag-gold">{char}</span>
                ))}
              </div>

              <Link to="/profile" className="profile-link" id="view-profile-link">
                查看详细画像 <span className="profile-link-arrow">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== 今日养生推荐 ===== */}
        <section className="home-recommendations" id="daily-recommendations">
          <h2 className="section-title animate-fade-in-up delay-3">今日养生推荐</h2>
          <p className="section-subtitle animate-fade-in-up delay-3">根据您的体质与当前时令定制</p>

          <div className="divider-cloud" />

          <div className="recommendation-grid">
            {recommendations.map((rec, idx) => (
              <div
                key={rec.title}
                className={`card recommendation-card ${rec.accent} animate-fade-in-up`}
                style={{ animationDelay: `${0.3 + idx * 0.1}s`, opacity: 0 }}
                id={`rec-card-${idx}`}
              >
                <span className="rec-icon">{rec.icon}</span>
                <span className="rec-category">{rec.category}</span>
                <h3 className="rec-title">{rec.title}</h3>
                <p className="rec-description">{rec.description}</p>
                <span className={`tag ${rec.tagClass} rec-tag`}>{rec.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 快捷入口 ===== */}
        <section className="home-quick-access" id="quick-access">
          <h2 className="section-title animate-fade-in-up delay-4">探索更多</h2>
          <p className="section-subtitle animate-fade-in-up delay-4">深入中医智慧的不同维度</p>

          <div className="divider-cloud" />

          <div className="quick-access-grid">
            {quickAccess.map((item, idx) => (
              <Link
                key={item.path}
                to={item.path}
                className="card quick-access-card animate-fade-in-up"
                style={{ animationDelay: `${0.4 + idx * 0.1}s`, opacity: 0 }}
                id={`quick-${item.path.replace('/', '')}`}
              >
                <div className={`quick-access-icon ${item.iconClass}`}>{item.icon}</div>
                <div className="quick-access-text">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== 免责声明 ===== */}
        <div className="home-disclaimer" id="disclaimer">
          <p className="disclaimer-text">
            ⚕️ 本平台仅供学习交流，不构成医疗建议。内容基于经方派（《伤寒论》《金匮要略》）与温病派（《温病条辨》《温热论》）理论。如有不适，请及时就医。
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
