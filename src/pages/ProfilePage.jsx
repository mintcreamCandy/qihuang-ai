import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../App'
import './ProfilePage.css'

function ProfilePage() {
  const { user, updateUserProfile } = useContext(AuthContext)
  const profile = user?.profile || {}

  // Form states
  const [age, setAge] = useState(profile.age || '')
  const [gender, setGender] = useState(profile.gender || '男')
  const [characteristics, setCharacteristics] = useState(profile.characteristics || [])
  const [isEditing, setIsEditing] = useState(false)
  const [newSymptom, setNewSymptom] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  
  // Quiz states
  const [quizStep, setQuizStep] = useState(0) // 0: not started, 1-9: questions, 10: results
  const [answers, setAnswers] = useState({})
  
  const commonSymptoms = [
    '怕冷', '怕热', '容易疲劳', '失眠多梦', '手脚冰凉', 
    '面部出油', '大便不成形', '胃胀胃痛', '口干咽燥', '心情抑郁'
  ]

  // Synchronize state when user data loads
  useEffect(() => {
    if (user?.profile) {
      setAge(user.profile.age || '')
      setGender(user.profile.gender || '男')
      setCharacteristics(user.profile.characteristics || [])
    }
  }, [user])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSaveLoading(true)
    try {
      await updateUserProfile({
        age: age.toString(),
        gender,
        characteristics
      })
      setIsEditing(false)
    } catch (err) {
      alert('保存失败，请稍后重试')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleAddSymptom = (symptom) => {
    if (symptom && !characteristics.includes(symptom)) {
      setCharacteristics([...characteristics, symptom])
    }
  }

  const handleRemoveSymptom = (symptom) => {
    setCharacteristics(characteristics.filter(item => item !== symptom))
  }

  // 9 questions mapping to constitution types
  const questions = [
    {
      id: 'q1',
      dimension: '气虚质',
      text: '您是否感到精神不振、身体沉重，稍微动一下就容易疲劳、气短懒言？',
    },
    {
      id: 'q2',
      dimension: '阳虚质',
      text: '您是否平时特别怕冷，衣服穿得比别人多，手脚一年四季都是冰凉的？',
    },
    {
      id: 'q3',
      dimension: '阴虚质',
      text: '您是否经常感到手脚心发热，口干舌燥，饮水不解渴，或夜间出汗（盗汗）？',
    },
    {
      id: 'q4',
      dimension: '痰湿质',
      text: '您是否感到身体特别重，像有东西裹着，面部出油多，舌苔厚腻？',
    },
    {
      id: 'q5',
      dimension: '湿热质',
      text: '您是否容易口苦口臭，面部易生痤疮、粉刺，大便粘滞不爽或小便黄？',
    },
    {
      id: 'q6',
      dimension: '血瘀质',
      text: '您是否面色晦暗，眼眶发黑，皮肤容易干燥发青，或身上无故出现青紫瘀斑？',
    },
    {
      id: 'q7',
      dimension: '气郁质',
      text: '您是否性情急躁，或胸胁胀满，情绪容易低落、无故感到郁闷不畅？',
    },
    {
      id: 'q8',
      dimension: '特禀质',
      text: '您是否属于过敏体质，容易对花粉、冷空气过敏，或容易起荨麻疹、打喷嚏？',
    },
    {
      id: 'q9',
      dimension: '平和质',
      text: '您是否睡眠良好，精力相对充沛，能够适应外界变化，能够防范气候环境突变，很少生病？',
    },
  ]

  const handleAnswerSelect = (score) => {
    const currentQ = questions[quizStep - 1]
    const nextAnswers = {
      ...answers,
      [currentQ.dimension]: score
    }
    setAnswers(nextAnswers)
    
    if (quizStep < questions.length) {
      setQuizStep(quizStep + 1)
    } else {
      calculateResult(nextAnswers)
    }
  }

  const constitutionDetails = {
    '平和质': {
      title: '平和质（健康状态）',
      description: '阴阳气血调和。体态匀称，面色润泽，精力充沛，睡眠良好，对外界适应力强。',
      advice: '日常起居规律，多喝温水，清淡饮食。可选用山药、枸杞、大枣等平性食材调养。建议进行慢跑、八段锦等适度运动。',
      herbs: '党参、大枣、茯苓、扁豆',
      tagClass: 'tag-jade'
    },
    '气虚质': {
      title: '气虚质（脾肺气虚）',
      description: '脏腑气机不足。肌肉松软，语声低微，极易疲劳，易出汗，容易感冒。',
      advice: '起居防风寒，不宜过度劳累。可选用黄芪、党参、山药、白术等益气健脾之品。宜做和缓运动如太极拳。',
      herbs: '黄芪、人参、白术、山药',
      tagClass: 'tag-gold'
    },
    '阳虚质': {
      title: '阳虚质（阳气不足）',
      description: '体内阳气匮乏。畏寒怕冷，手脚冰凉，喜热饮食，精神不振，小便清长，大便溏薄。',
      advice: '注意关节与下肢保暖。可选用肉桂、干姜、小茴香、羊肉等温阳之品。不宜食用冷饮、生冷瓜果。宜晒太阳。',
      herbs: '附子、肉桂、干姜、吴茱萸',
      tagClass: 'tag-cinnabar'
    },
    '阴虚质': {
      title: '阴虚质（阴液亏少）',
      description: '体内津液亏少。手足心热，口干咽燥，潮热盗汗，大便干结，性情急躁。',
      advice: '不宜熬夜或做剧烈发汗运动。可选用麦冬、百合、沙参、玉竹等滋阴生津之品。忌吃辛辣温燥之物。',
      herbs: '麦冬、天冬、生地黄、百合',
      tagClass: 'tag-gold-light'
    },
    '痰湿质': {
      title: '痰湿质（痰湿凝聚）',
      description: '水液运化失司。体形肥胖，腹部松软，面部油脂多，舌苔厚腻。',
      advice: '环境宜干燥，少吃甜食及肥甘厚腻。可选用赤小豆、薏苡仁、茯苓、陈皮等健脾祛湿之品。宜多做户外有氧运动。',
      herbs: '半夏、陈皮、茯苓、苍术',
      tagClass: 'tag-gold'
    },
    '湿热质': {
      title: '湿热质（湿热内蕴）',
      description: '湿热蕴结体内。面部易生痤疮、口苦口臭，身重困倦，大便粘滞，舌苔黄腻。',
      advice: '戒烟限酒，忌辛辣油炸。可选用茵陈、葛根、绿豆、薏米等清热利湿之品。适合中高强度体育锻炼以排汗泄热。',
      herbs: '黄连、黄芩、茵陈、栀子',
      tagClass: 'tag-gold'
    },
    '血瘀质': {
      title: '血瘀质（血行不畅）',
      description: '脉络瘀阻。面色晦暗，眼眶发黑，皮肤干燥，容易出现瘀斑，舌质暗有瘀点。',
      advice: '避免寒冷刺激，保持心情舒畅。可选用当归、川芎、红花、山楂等活血通脉之品。宜进行散步、舞蹈等规律锻炼。',
      herbs: '丹参、红花、川芎、桃仁',
      tagClass: 'tag-cinnabar'
    },
    '气郁质': {
      title: '气郁质（气机郁滞）',
      description: '肝气不舒。性情急躁或忧郁寡欢，胸胁胀满，常叹气，易失眠。',
      advice: '宜多参与集体活动，主动倾诉。可选用柴胡、薄荷、玫瑰花、陈皮等疏肝理气之品。宜做伸展类运动如瑜伽、八段锦。',
      herbs: '柴胡、香附、郁金、青皮',
      tagClass: 'tag-gold-light'
    },
    '特禀质': {
      title: '特禀质（先天特异）',
      description: '先天遗传或过敏体质。易过敏，易起荨麻疹，常打喷嚏、流鼻涕。',
      advice: '避开已知过敏原，增强体质。可选用防风、黄芪、白术等益气固表之品。饮食宜清淡，避腥膻发物。',
      herbs: '防风、乌梅、蝉蜕、黄芪',
      tagClass: 'tag-gold'
    }
  }

  const calculateResult = async (finalAnswers) => {
    let bestDimension = '平和质'
    let maxScore = 0

    // 计算负向体质中的最高分
    const negativeDimensions = [
      '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'
    ]

    negativeDimensions.forEach(dim => {
      const score = finalAnswers[dim] || 0
      if (score > maxScore) {
        maxScore = score
      }
    })

    // 筛选出所有得分为最高分且分数 >= 3 的负向体质维度
    const activeNegativeConstitutions = []
    negativeDimensions.forEach(dim => {
      const score = finalAnswers[dim] || 0
      if (score === maxScore && score >= 3) {
        activeNegativeConstitutions.push(dim)
      }
    })

    // 如果负向体质的最高分很低（<=2分），即基本上没有什么亚健康症状，判定为平和质（健康）
    if (maxScore <= 2) {
      bestDimension = '平和质'
    } else if (activeNegativeConstitutions.length > 0) {
      // 存在明显的负向偏盛偏衰。若有多个并列最高分，最多取前 2 个融合成混合体质（如“气虚质兼阳虚质”），保持精炼性
      const displayParts = activeNegativeConstitutions.slice(0, 2)
      bestDimension = displayParts.join('兼')
    }

    // Update profile in backend
    try {
      // 过滤出除了体质名称以外的身体特征，避免特征里塞满体质标签
      const filterCharacteristics = characteristics.filter(item => 
        !Object.keys(constitutionDetails).includes(item) && 
        !item.includes('兼')
      )
      
      const newCharacteristics = [...filterCharacteristics, bestDimension].slice(0, 5)

      await updateUserProfile({
        constitution: bestDimension,
        characteristics: newCharacteristics
      })
      
      setCharacteristics(newCharacteristics)
      setQuizStep(10) // show results step
    } catch (err) {
      console.error(err)
      alert('保存体质测评结果失败，请稍后重试')
    }
  }

  const handleStartQuiz = () => {
    setAnswers({})
    setQuizStep(1)
  }

  const resetQuiz = () => {
    setQuizStep(0)
  }

  const curConstitution = profile.constitution || '未测试'
  
  // 动态合并混合体质详情的辅助函数
  const getConstitutionDetail = (constName) => {
    if (!constName || constName === '未测试') return constitutionDetails['平和质']
    if (constitutionDetails[constName]) return constitutionDetails[constName]
    
    // 如果是混合体质（如“气虚质兼阳虚质”）
    const parts = constName.split('兼')
    const validParts = parts.filter(p => constitutionDetails[p])
    
    if (validParts.length === 0) return constitutionDetails['平和质']
    if (validParts.length === 1) return constitutionDetails[validParts[0]]
    
    // 提取并融合各成分的调养知识
    const titles = validParts.map(p => constitutionDetails[p].title.split('（')[0])
    const descriptions = validParts.map(p => constitutionDetails[p].description)
    const advices = validParts.map(p => constitutionDetails[p].advice)
    const herbsList = validParts.map(p => constitutionDetails[p].herbs)
    
    return {
      title: `${titles.join('兼')}（混合体质）`,
      description: `您的身体同时表现出多种体质倾向：` + descriptions.join('；'),
      advice: `建议进行综合平衡调理。` + advices.slice(0, 2).join(' '),
      herbs: herbsList.join('、'),
      tagClass: constitutionDetails[validParts[0]].tagClass
    }
  }

  const detail = getConstitutionDetail(curConstitution)

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title animate-ink-fade">👤 个人健康画像</h1>
        <p className="page-subtitle animate-fade-in-up delay-1">结合《中医体质分类与判定》标准，构建您的个性化中医理疗画像</p>
        
        <div className="divider-cloud" />

        <div className="profile-grid animate-fade-in-up delay-2">
          {/* ===== Left Column: Profile Card & Editor ===== */}
          <div className="card profile-info-card" id="profile-info-card">
            <div className="profile-card-header">
              <div className="avatar-large">{user?.name?.charAt(0) || '用'}</div>
              <div className="header-meta">
                <h2>{user?.name || '用户'}</h2>
                <p>{user?.email}</p>
                <span className={`tag ${detail.tagClass} constitution-badge`}>
                  {curConstitution}
                </span>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileSave} className="profile-form">
                <div className="form-group">
                  <label>性别</label>
                  <div className="gender-selector">
                    {['男', '女', '其它'].map(g => (
                      <button
                        key={g}
                        type="button"
                        className={`gender-btn ${gender === g ? 'active' : ''}`}
                        onClick={() => setGender(g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="age-input">年龄</label>
                  <input
                    id="age-input"
                    type="number"
                    min="1"
                    max="120"
                    className="input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>个人征候（最多5个）</label>
                  <div className="symptom-input-row">
                    <input
                      type="text"
                      placeholder="输入后回车添加..."
                      className="input"
                      value={newSymptom}
                      onChange={(e) => setNewSymptom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSymptom(newSymptom.trim())
                          setNewSymptom('')
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        handleAddSymptom(newSymptom.trim())
                        setNewSymptom('')
                      }}
                    >
                      添加
                    </button>
                  </div>
                  
                  <div className="quick-add-symptoms">
                    {commonSymptoms.map(s => (
                      <span
                        key={s}
                        className="symptom-chip-add"
                        onClick={() => handleAddSymptom(s)}
                      >
                        + {s}
                      </span>
                    ))}
                  </div>

                  <div className="selected-symptoms">
                    {characteristics.map(c => (
                      <span key={c} className="tag tag-gold symptom-chip-remove">
                        {c} 
                        <button 
                          type="button" 
                          className="remove-btn" 
                          onClick={() => handleRemoveSymptom(c)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="button-group">
                  <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                    {saveLoading ? '保存中...' : '确认保存'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setAge(profile.age || '')
                      setGender(profile.gender || '男')
                      setCharacteristics(profile.characteristics || [])
                      setIsEditing(false)
                    }}
                  >
                    取消
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details-display">
                <div className="detail-item">
                  <span className="label">性别：</span>
                  <span className="value">{profile.gender || '未指定'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">年龄：</span>
                  <span className="value">{profile.age ? `${profile.age} 岁` : '未填写'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">身体特征：</span>
                  <div className="selected-symptoms">
                    {(profile.characteristics || []).length > 0 ? (
                      profile.characteristics.map(c => (
                        <span key={c} className="tag tag-gold">{c}</span>
                      ))
                    ) : (
                      <span className="placeholder-text">暂无特征，建议进行体质测评</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-outline edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                  id="edit-profile-btn"
                >
                  📝 修改健康档案
                </button>
              </div>
            )}
          </div>

          {/* ===== Right Column: Constitution Assessment & Info ===== */}
          <div className="card profile-assessment-card" id="profile-assessment-card">
            {quizStep === 0 && (
              <div className="assessment-intro animate-fade-in-up">
                <h2>🩺 中医九种体质测评</h2>
                <p>
                  根据中华中医药学会颁布的《中医体质分类与判定》标准，通过 9 道关键行为及生理反应问答，精准识别您的体质类型，量身定制调理方案。
                </p>
                <div className="constitution-banner">
                  <div className="banner-item">
                    <span className="banner-number">9</span>
                    <span className="banner-text">中医维度</span>
                  </div>
                  <div className="banner-item">
                    <span className="banner-number">1v1</span>
                    <span className="banner-text">辩证调养</span>
                  </div>
                  <div className="banner-item">
                    <span className="banner-number">安全</span>
                    <span className="banner-text">本地保存</span>
                  </div>
                </div>
                <button className="btn btn-primary start-quiz-btn" onClick={handleStartQuiz} id="start-quiz-btn">
                  开始体质测评
                </button>
              </div>
            )}

            {quizStep > 0 && quizStep <= 9 && (
              <div className="quiz-container">
                <div className="quiz-progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(quizStep / 9) * 100}%` }}
                  />
                  <span className="progress-text">问题 {quizStep} / 9</span>
                </div>
                
                <h3 className="quiz-question-text animate-fade-in-up">
                  {questions[quizStep - 1].text}
                </h3>

                <div className="quiz-options-list">
                  {[
                    { label: '没有（基本不符合）', score: 1 },
                    { label: '很少（符合程度较低）', score: 2 },
                    { label: '有时（部分情况符合）', score: 3 },
                    { label: '经常（大多数符合）', score: 4 },
                    { label: '总是（完全相符）', score: 5 },
                  ].map(opt => (
                    <button
                      key={opt.score}
                      className="quiz-option-btn"
                      onClick={() => handleAnswerSelect(opt.score)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button className="btn btn-link cancel-quiz-btn" onClick={resetQuiz}>
                  放弃测评并返回
                </button>
              </div>
            )}

            {quizStep === 10 && (
              <div className="assessment-result animate-fade-in-up">
                <div className="result-header">
                  <span className="result-decoration">测评已完成</span>
                  <h2>判定体质为：<strong className="text-accent">{curConstitution}</strong></h2>
                </div>
                
                <div className="result-card">
                  <h4>💡 体质特征</h4>
                  <p>{detail.description}</p>
                  
                  <h4>📖 调养建议</h4>
                  <p>{detail.advice}</p>

                  <h4>🌿 推荐本草</h4>
                  <p className="herbs-text">{detail.herbs}</p>
                </div>

                <div className="button-group">
                  <button className="btn btn-primary" onClick={resetQuiz}>
                    完成并返回
                  </button>
                  <button className="btn btn-outline" onClick={handleStartQuiz}>
                    重新测评
                  </button>
                </div>
              </div>
            )}

            {quizStep !== 10 && quizStep === 0 && (
              <div className="constitution-info-panel animate-fade-in-up">
                <div className="info-header">
                  <h3>📜 当前体质剖析：{curConstitution}</h3>
                </div>
                <div className="info-body">
                  <p className="constitution-desc">{detail.description}</p>
                  
                  <div className="info-row">
                    <strong>💡 调养策略</strong>
                    <p>{detail.advice}</p>
                  </div>
                  
                  <div className="info-row">
                    <strong>🌿 推荐本草</strong>
                    <p className="herbs-text">{detail.herbs}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
