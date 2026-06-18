import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../App'
import './HomePage.css'

function HomePage() {
  const { user } = useContext(AuthContext)
  const profile = user?.profile || {}

  /* 体质剖析简介 */
  const constitutionBriefs = {
    '平和质': '阴阳气血调和，体态适中，面色红润，精力充沛，对外界环境适应力强。',
    '气虚质': '元气不足，极易疲倦，少气懒言，易出汗，对风寒等邪气抵抗力较弱。',
    '阳虚质': '阳气不足，畏寒怕冷，四肢不温，喜热饮食，精神不振。',
    '阴虚质': '阴液亏少，手足心热，口干咽燥，易潮热盗汗，性情较急躁。',
    '痰湿质': '痰湿凝聚，体形肥胖，腹部松软，面部油脂多，舌苔厚腻。',
    '湿热质': '湿热内蕴，面部易生痤疮、粉刺，口苦口臭，身重困倦，大便粘滞。',
    '血瘀质': '血行不畅，面色晦暗，皮肤干燥，容易出现瘀斑，舌暗或有瘀点。',
    '气郁质': '气机郁滞，性情急躁或忧郁寡欢，胸胁胀满，常叹气。',
    '特禀质': '先天遗传或过敏体质，易对花粉、尘螨等物质过敏。'
  }

  // 动态合并混合体质简介
  const getConstitutionBrief = (constName) => {
    if (!constName || constName === '未测试') {
      return '您尚未完成中医体质测评，完成测评后将在此呈现详细画像与调护策略。'
    }
    if (constitutionBriefs[constName]) {
      return constitutionBriefs[constName]
    }
    // 混合体质，如：气虚质兼阳虚质
    const parts = constName.split('兼')
    const briefs = parts.map(p => constitutionBriefs[p]).filter(Boolean)
    if (briefs.length > 0) {
      return `混合体质表现：${briefs.join(' ')}`
    }
    return '您已完成体质辨证，日常调理宜温和协调，补偏救弊。'
  }

  // 过滤特征标签，避免将“气虚质兼阳虚质”等体质名渲染在“身体征候”中
  const symptomTags = (profile.characteristics || []).filter(
    char => char !== profile.constitution && !char.includes('质')
  )

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
            
            {/* Zone 1: User Info */}
            <div className="profile-identity">
              <div className="profile-avatar">{user?.name?.charAt(0) || '用'}</div>
              <div className="profile-meta">
                <p className="profile-greeting">
                  您好，<strong>{user?.name || '用户'}</strong>
                </p>
                <p className="profile-sub-meta">
                  {profile.gender && <span>{profile.gender}</span>}
                  {profile.age && <span> · {profile.age} 岁</span>}
                </p>
              </div>
            </div>

            {/* Divider 1 */}
            <div className="profile-card-divider" />
            
            {/* Zone 2: TCM Stamp */}
            <div className="profile-seal-zone">
              <div className="constitution-seal">
                <span className="seal-text-small">岐黄辨证</span>
                <span className="seal-text-large">{profile.constitution || '未测评'}</span>
              </div>
            </div>

            {/* Divider 2 */}
            <div className="profile-card-divider" />

            {/* Zone 3: Health Insights */}
            <div className="profile-insights">
              <div className="insight-section">
                <h4 className="insight-label">体质剖析</h4>
                <p className="insight-value">
                  {getConstitutionBrief(profile.constitution)}
                </p>
              </div>

              {symptomTags.length > 0 && (
                <div className="insight-section">
                  <h4 className="insight-label">身体征候</h4>
                  <div className="profile-tags">
                    {symptomTags.map((char) => (
                      <span key={char} className="tag tag-gold">{char}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="profile-action-row">
                <Link to="/profile" className="profile-link" id="view-profile-link">
                  进行体质测评 & 调整档案 <span className="profile-link-arrow">→</span>
                </Link>
              </div>
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
