const API_BASE_URL = 'http://127.0.0.1:8000'

// 辅助函数：统一处理 HTTP 请求
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('qihuang_token')
    
    // 设置请求头
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }
    
    // 如果本地存有 Token，则自动在 Request Header 中注入 JWT Authorization
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    
    const config = {
        ...options,
        headers,
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || `请求失败: ${response.status}`
        throw new Error(errorMessage)
    }
    
    return response.json()
}

export const apiService = {
    // 注册新用户
    async register(email, password, name, adminKey = null) {
        return request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, admin_key: adminKey }),
        })
    },
    
    // 用户登录
    async login(email, password) {
        return request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        })
    },
    
    // 获取当前登录用户详情
    async getMe() {
        return request('/api/auth/me', {
            method: 'GET',
        })
    },
    
    // 获取当前用户的健康画像
    async getProfile() {
        return request('/api/profile', {
            method: 'GET',
        })
    },
    
    // 更新当前用户的健康画像 (如：测试体质结果)
    async updateProfile(profileData) {
        return request('/api/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        })
    },

    // 获取中药列表 (包含分类过滤和模糊搜索)
    async getHerbs(params = {}) {
        const queryParams = new URLSearchParams()
        if (params.category) queryParams.append('category', params.category)
        if (params.search) queryParams.append('search', params.search)
        
        const queryString = queryParams.toString()
        const endpoint = `/api/herbs${queryString ? `?${queryString}` : ''}`
        return request(endpoint, {
            method: 'GET',
        })
    },
    
    // 获取方剂列表
    async getPrescriptions(params = {}) {
        const queryParams = new URLSearchParams()
        if (params.source) queryParams.append('source', params.source)
        if (params.search) queryParams.append('search', params.search)
        
        const queryString = queryParams.toString()
        const endpoint = `/api/prescriptions${queryString ? `?${queryString}` : ''}`
        return request(endpoint, {
            method: 'GET',
        })
    },
    
    // RAG 双路检索问诊接口
    async ragSearch(query, topK = 3) {
        return request(`/api/rag/search?query=${encodeURIComponent(query)}&top_k=${topK}`, {
            method: 'GET',
        })
    },

    // 获取会话列表
    async getChatSessions() {
        return request('/api/chat/sessions', {
            method: 'GET',
        })
    },

    // 创建或加入会话
    async createChatSession(id, title = '新问诊会话') {
        return request('/api/chat/sessions', {
            method: 'POST',
            body: JSON.stringify({ id, title }),
        })
    },

    // 更新会话标题
    async updateChatSessionTitle(sessionId, title) {
        return request(`/api/chat/sessions/${sessionId}/title`, {
            method: 'POST',
            body: JSON.stringify({ title }),
        })
    },

    // 删除会话
    async deleteChatSession(sessionId) {
        return request(`/api/chat/sessions/${sessionId}`, {
            method: 'DELETE',
        })
    },

    // 获取指定会话消息历史
    async getSessionMessages(sessionId) {
        return request(`/api/chat/sessions/${sessionId}/messages`, {
            method: 'GET',
        })
    },

    // 增添会话内新消息
    async addSessionMessage(sessionId, role, content) {
        return request(`/api/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ role, content }),
        })
    },

    // 获取知识图谱数据
    async getKnowledgeGraph() {
        return request('/api/kg/graph', {
            method: 'GET',
        })
    },

    // 基于知识图谱进行诊断推理
    async getKgReason(query) {
        return request(`/api/kg/reason?query=${encodeURIComponent(query)}`, {
            method: 'GET',
        })
    },

    // === 管理员本草管理 API ===
    async createHerb(herbData) {
        return request('/api/admin/herbs', {
            method: 'POST',
            body: JSON.stringify(herbData),
        })
    },

    async updateHerb(herbId, herbData) {
        return request(`/api/admin/herbs/${herbId}`, {
            method: 'PUT',
            body: JSON.stringify(herbData),
        })
    },

    async deleteHerb(herbId) {
        return request(`/api/admin/herbs/${herbId}`, {
            method: 'DELETE',
        })
    },

    // === 管理员方剂管理 API ===
    async createPrescription(presData) {
        return request('/api/admin/prescriptions', {
            method: 'POST',
            body: JSON.stringify(presData),
        })
    },

    async updatePrescription(presId, presData) {
        return request(`/api/admin/prescriptions/${presId}`, {
            method: 'PUT',
            body: JSON.stringify(presData),
        })
    },

    async deletePrescription(presId) {
        return request(`/api/admin/prescriptions/${presId}`, {
            method: 'DELETE',
        })
    }
}
