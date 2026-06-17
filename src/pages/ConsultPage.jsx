import { useState, useRef, useEffect } from 'react'
import { apiService } from '../services/api'
import './ConsultPage.css'

function ConsultPage() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  const quickSymptoms = ['头痛', '失眠', '咳嗽', '腰痛', '疲劳', '食欲不振']

  const getWelcomeMessage = (id) => ({
    id: id + '_welcome',
    role: 'ai',
    content: '您好，我是岐黄AI。请描述您的症状，我将结合经方与温病学说为您辨证分析。',
    timestamp: new Date(),
  })

  // 1. 初始化加载会话列表
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const list = await apiService.getChatSessions()
        if (list && list.length > 0) {
          setSessions(list)
          setActiveSessionId(list[0].id)
          await loadSessionMessages(list[0].id)
        } else {
          await handleNewChat()
        }
      } catch (err) {
        console.error("加载会话列表失败:", err)
        // 体验账号或断网时的本地备用状态
        const localId = 'session_' + Date.now()
        const defaultSession = { id: localId, title: '新问诊会话', created_at: new Date() }
        setSessions([defaultSession])
        setActiveSessionId(localId)
        setMessages([getWelcomeMessage(localId)])
      }
    }
    loadSessions()
  }, [])

  // 2. 加载指定会话的消息历史
  const loadSessionMessages = async (sessionId) => {
    try {
      const dbMessages = await apiService.getSessionMessages(sessionId)
      if (dbMessages && dbMessages.length > 0) {
        const formatted = dbMessages.map(m => {
          let parsedContent = m.content
          let diagnosis = null
          let followUp = null
          
          let kgReason = null
          if (m.role === 'assistant' || m.role === 'ai') {
            try {
              const parsed = JSON.parse(m.content)
              parsedContent = parsed.text || parsed.content || ''
              diagnosis = parsed.diagnosis || null
              followUp = parsed.followUp || null
              kgReason = parsed.kgReason || null
            } catch (e) {
              // 无法解析说明是纯文本
            }
          }
          
          return {
            id: m.id,
            role: m.role === 'assistant' ? 'ai' : m.role,
            content: parsedContent,
            diagnosis,
            followUp,
            kgReason,
            timestamp: m.created_at ? new Date(m.created_at) : new Date()
          }
        })
        setMessages(formatted)
      } else {
        setMessages([getWelcomeMessage(sessionId)])
      }
    } catch (err) {
      console.error("加载会话消息失败:", err)
      setMessages([getWelcomeMessage(sessionId)])
    }
  }

  // 3. 新建会话
  const handleNewChat = async () => {
    const newId = 'session_' + Date.now()
    const newTitle = '新问诊会话'
    const newSess = { id: newId, title: newTitle, created_at: new Date() }
    
    setSessions(prev => [newSess, ...prev])
    setActiveSessionId(newId)
    const welcome = getWelcomeMessage(newId)
    setMessages([welcome])
    
    try {
      await apiService.createChatSession(newId, newTitle)
      const welcomePayload = JSON.stringify({ text: welcome.content })
      await apiService.addSessionMessage(newId, 'assistant', welcomePayload)
    } catch (err) {
      console.error("新建会话上传后端失败:", err)
    }
  }

  // 4. 选择历史会话
  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId) return
    setActiveSessionId(sessionId)
    setMessages([]) // loading state
    await loadSessionMessages(sessionId)
  }

  // 5. 删除会话
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation()
    const remaining = sessions.filter(s => s.id !== sessionId)
    setSessions(remaining)
    
    try {
      await apiService.deleteChatSession(sessionId)
    } catch (err) {
      console.error("删除会话失败:", err)
    }
    
    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id)
        await loadSessionMessages(remaining[0].id)
      } else {
        await handleNewChat()
      }
    }
  }

  // 5.5 保存会话标题修改
  const handleSaveTitle = async (sessionId) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null)
      return
    }
    
    // 乐观更新前端状态
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editingTitle } : s))
    setEditingSessionId(null)

    try {
      await apiService.updateChatSessionTitle(sessionId, editingTitle)
    } catch (err) {
      console.error("更新会话标题失败:", err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])



  const handleSend = async (text = input) => {
    if (!text.trim()) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // 1. 保存用户消息到数据库
      if (activeSessionId) {
        await apiService.addSessionMessage(activeSessionId, 'user', text)
      }

      // 2. 自动生成会话标题 (如果是首次对话)
      const currentSession = sessions.find(s => s.id === activeSessionId)
      if (currentSession && (currentSession.title === '新问诊会话' || !currentSession.title)) {
        const newTitle = text.length > 10 ? text.slice(0, 10) + '...' : text
        try {
          await apiService.updateChatSessionTitle(activeSessionId, newTitle)
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: newTitle } : s))
        } catch (e) {
          console.error("更新会话标题失败:", e)
        }
      }

      // 3. 发起 RAG 检索与知识图谱诊断推理（并行）
      const [data, kgReason] = await Promise.all([
        apiService.ragSearch(text, 3),
        apiService.getKgReason(text).catch(() => null)
      ])
      
      let response = {}
      const hasKgReason = kgReason && kgReason.symptoms && kgReason.symptoms.length > 0
      
      if (data && data.length > 0) {
        // 获取得分最高的检索项作为回答的核心内容
        const topResult = data[0]
        const isPrescription = topResult.metadata.type === 'prescription'
        
        // 辅助解析文档内容的函数
        const parseDocField = (doc, fieldName) => {
          const regex = new RegExp(`${fieldName}:\\s*([^。]+)`)
          const match = doc.match(regex)
          return match ? match[1].trim() : ''
        }

        const docText = topResult.document
        const name = parseDocField(docText, '名称')
        
        if (isPrescription) {
          const source = parseDocField(docText, '来源')
          const compStr = parseDocField(docText, '组成')
          const functions = parseDocField(docText, '功用')
          const indications = parseDocField(docText, '主治')
          const description = parseDocField(docText, '描述')
          const contraindications = parseDocField(docText, '禁忌')
          
          // 解析草药组成
          const parsedHerbs = compStr.split('、').map((item, idx) => {
            const match = item.match(/^([^(]+)\(([^)]+)\)$/)
            return {
              name: match ? match[1] : item,
              amount: match ? match[2] : '',
              role: idx === 0 ? '君' : idx === 1 ? '臣' : idx === 2 ? '佐' : '使',
              function: idx === 0 ? '主以调理' : '佐助药性'
            }
          })

          response = {
            content: `根据您的症状描述，结合经典方书及双路召回算法，为您检索到以下最匹配的经典方剂：`,
            diagnosis: {
              syndrome: indications.split('。')[0] || '气血失调证',
              analysis: description || `该方剂主治：${indications}。`,
              method: functions || '调和阴阳',
              prescription: name,
              prescriptionSource: source,
              herbs: parsedHerbs,
              advice: contraindications !== '无' ? `用药禁忌：${contraindications}` : '日常调理宜温热易消化饮食，忌生冷油腻。',
            },
            kgReason: hasKgReason ? kgReason : null
          }
        } else {
          // 单味药材情况
          const category = parseDocField(docText, '分类')
          const temperature = parseDocField(docText, '药性')
          const nature = parseDocField(docText, '药味')
          const meridians = parseDocField(docText, '归经')
          const functions = parseDocField(docText, '功效')
          const usage = parseDocField(docText, '用法')
          const classicRef = parseDocField(docText, '出处')
          const description = parseDocField(docText, '描述')
          const contraindications = parseDocField(docText, '禁忌')

          response = {
            content: `根据您的描述，为您检索到以下最相关的本草药材信息：`,
            diagnosis: {
              syndrome: `${category}（${temperature}/${nature}，归${meridians}）`,
              analysis: description || `功效为：${functions}。`,
              method: functions,
              prescription: name,
              prescriptionSource: classicRef || '经典本草',
              herbs: [
                { name: name, role: '君', amount: usage, function: functions }
              ],
              advice: `用法用量：${usage}。禁忌：${contraindications}`,
            },
            kgReason: hasKgReason ? kgReason : null
          }
        }
      } else {
        // 没有找到匹配文档，使用兜底回答
        response = {
          content: '感谢您的描述。我们在知识库中未能检索到完全契合的方剂或药材。建议您尝试变换措辞描述（如描述具体寒热、出汗、睡眠情况），或者在此了解一般性调理原则：',
          followUp: [
            '您可以尝试输入：怕冷、失眠、疲劳、头痛等具体症状。',
            '是否有发热、恶寒、口渴等表现？',
            '建议平时规律作息，避免寒凉食物。'
          ],
          kgReason: hasKgReason ? kgReason : null
        }
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'ai',
        ...response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])

      // 4. 保存助手响应到数据库
      if (activeSessionId) {
        await apiService.addSessionMessage(activeSessionId, 'assistant', JSON.stringify(response))
      }
    } catch (error) {
      console.error('API Error:', error)
      const aiMessage = {
        id: Date.now() + 1,
        role: 'ai',
        content: '抱歉，系统检测到问诊检索服务暂时不可用，请确保后端服务正常运行并初始化了 RAG 索引。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="consult-page" id="consult-page">
      {/* ===== Sidebar ===== */}
      <aside className="consult-sidebar" id="consult-sidebar">
        <button 
          className="btn btn-outline sidebar-new-chat" 
          id="new-chat-btn"
          onClick={handleNewChat}
        >
          ✦ 新建对话
        </button>

        <div className="sidebar-section">
          <h3 className="sidebar-title">对话历史</h3>
          <div className="history-list">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className={`history-item ${session.id === activeSessionId ? 'active' : ''} ${session.id === editingSessionId ? 'editing' : ''}`}
                id={`history-${session.id}`}
                onClick={() => {
                  if (session.id !== editingSessionId) {
                    handleSelectSession(session.id)
                  }
                }}
              >
                <span className="history-icon">💬</span>
                {session.id === editingSessionId ? (
                  <input
                    type="text"
                    className="history-edit-input"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveTitle(session.id)
                      } else if (e.key === 'Escape') {
                        setEditingSessionId(null)
                      }
                    }}
                    onBlur={() => handleSaveTitle(session.id)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="history-text">
                    <span className="history-name">{session.title}</span>
                    <span className="history-date">
                      {session.created_at ? new Date(session.created_at).toLocaleDateString() : '刚刚'}
                    </span>
                  </div>
                )}
                
                {session.id !== editingSessionId && (
                  <div className="history-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="history-edit-btn" 
                      title="重命名"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingSessionId(session.id)
                        setEditingTitle(session.title)
                      }}
                    >
                      ✏️
                    </button>
                    <button 
                      className="history-delete-btn" 
                      title="删除对话"
                      onClick={(e) => handleDeleteSession(e, session.id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ===== Main Chat Area ===== */}
      <div className="consult-main">
        <div className="chat-messages" id="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.role} animate-fade-in-up`}>
              {msg.role === 'ai' && (
                <div className="message-avatar">
                  <span className="avatar-icon">岐</span>
                </div>
              )}

              <div className="message-body">
                <p className="message-content">{msg.content}</p>

                {/* Structured Diagnosis Card */}
                {msg.diagnosis && (
                  <div className="diagnosis-card" id={`diagnosis-${msg.id}`}>
                    <div className="diagnosis-header">
                      <span className="tag tag-cinnabar">辨证</span>
                      <h4 className="diagnosis-syndrome">{msg.diagnosis.syndrome}</h4>
                    </div>

                    {msg.kgReason && (
                      <div className="diagnosis-kg-reason animate-fade-in-up">
                        <div className="kg-reason-header">
                          <span className="tag tag-jade">图谱推理</span>
                        </div>
                        <p className="kg-explanation">{msg.kgReason.explanation}</p>
                      </div>
                    )}

                    <p className="diagnosis-analysis">{msg.diagnosis.analysis}</p>

                    <div className="diagnosis-row">
                      <span className="diagnosis-label">治法：</span>
                      <span className="diagnosis-value">{msg.diagnosis.method}</span>
                    </div>

                    <div className="diagnosis-prescription">
                      <div className="prescription-header">
                        <span className="tag tag-gold">推荐方剂</span>
                        <h4 className="prescription-name">{msg.diagnosis.prescription}</h4>
                        <span className="prescription-source">{msg.diagnosis.prescriptionSource}</span>
                      </div>

                      <div className="herb-table">
                        <div className="herb-row herb-header">
                          <span>药材</span>
                          <span>角色</span>
                          <span>用量</span>
                          <span>功效</span>
                        </div>
                        {msg.diagnosis.herbs.map((herb) => (
                          <div key={herb.name} className="herb-row">
                            <span className="herb-name">{herb.name}</span>
                            <span className={`tag tag-${herb.role === '君' ? 'cinnabar' : herb.role === '臣' ? 'gold' : 'jade'}`}>
                              {herb.role}
                            </span>
                            <span className="herb-amount">{herb.amount}</span>
                            <span className="herb-function">{herb.function}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="diagnosis-advice">
                      <span className="advice-label">💡 日常建议：</span>
                      <p>{msg.diagnosis.advice}</p>
                    </div>
                  </div>
                )}

                {/* Follow-up Questions */}
                {msg.followUp && (
                  <div className="followup-list">
                    {msg.followUp.map((q, i) => (
                      <div key={i} className="followup-item">
                        <span className="followup-number">{i + 1}</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="message message-ai">
              <div className="message-avatar">
                <span className="avatar-icon">岐</span>
              </div>
              <div className="message-body">
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ===== Input Area ===== */}
        <div className="chat-input-area" id="chat-input-area">
          {/* Quick symptom chips */}
          <div className="quick-chips">
            {quickSymptoms.map((symptom) => (
              <button
                key={symptom}
                className="chip"
                onClick={() => handleSend(symptom)}
                id={`chip-${symptom}`}
              >
                {symptom}
              </button>
            ))}
          </div>

          <div className="input-row">
            <input
              ref={inputRef}
              type="text"
              className="input chat-input"
              placeholder="描述您的症状..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              id="chat-input"
            />
            <button
              className="btn btn-primary send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              id="send-btn"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultPage
