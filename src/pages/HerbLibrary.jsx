import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../App'
import { apiService } from '../services/api'
import './HerbLibrary.css'

/* 药材分类 */
const CATEGORIES = ['全部', '补气药', '补血药', '解表药', '利水渗湿药', '清热药', '温里药']

/* 药性颜色映射 */
const tempColorMap = {
  '温': 'tag-cinnabar',
  '微温': 'tag-cinnabar',
  '平': 'tag-gold',
  '凉': 'tag-jade',
  '微寒': 'tag-jade',
  '寒': 'tag-jade',
}

const defaultFormData = {
  id: '',
  name: '',
  pinyin: '',
  pinyin_flat: '',
  latin: '',
  category: '补气药',
  temperature: '温',
  nature: '甘',
  meridians: [],
  functions: '',
  usage: '',
  classic_ref: '',
  description: '',
  contraindications: '',
  image: ''
};

const MERIDIANS_OPTIONS = ['心', '肝', '脾', '肺', '肾', '胆', '胃', '大肠', '小肠', '三焦', '膀胱', '心包'];

function HerbLibrary() {
  const { user } = useContext(AuthContext);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHerb, setSelectedHerb] = useState(null);

  const [herbs, setHerbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 管理员表单状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState(defaultFormData);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* 从后端动态加载数据并实现输入防抖 */
  useEffect(() => {
    setLoading(true)
    const delayDebounceFn = setTimeout(() => {
      apiService.getHerbs({
        category: activeCategory,
        search: searchQuery
      })
        .then(data => {
          setHerbs(data)
          setError(null)
        })
        .catch(err => {
          console.error(err)
          setError(err.message || '获取本草数据失败，请重试')
        })
        .finally(() => {
          setLoading(false)
        })
    }, searchQuery ? 300 : 0) // 输入时防抖 300ms，切换分类时立即请求

    return () => clearTimeout(delayDebounceFn)
  }, [activeCategory, searchQuery, refreshKey])

  const handleDeleteHerb = async (id) => {
    if (window.confirm('您确定要删除这味中药材吗？此操作将同步删除其对应的 RAG 向量检索数据和知识图谱节点，删除后无法恢复！')) {
      try {
        await apiService.deleteHerb(id);
        setSelectedHerb(null);
        setRefreshKey(prev => prev + 1);
      } catch (err) {
        alert(err.message || '删除失败，请重试');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (formMode === 'create') {
        await apiService.createHerb(formData);
      } else {
        await apiService.updateHerb(formData.id, formData);
      }
      setIsFormOpen(false);
      setFormData(defaultFormData);
      setSelectedHerb(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setFormError(err.message || '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMeridianChange = (meridian) => {
    setFormData(prev => {
      const meridians = prev.meridians.includes(meridian)
        ? prev.meridians.filter(m => m !== meridian)
        : [...prev.meridians, meridian];
      return { ...prev, meridians };
    });
  };

  // 映射以兼容已有页面布局变量名
  const filteredHerbs = herbs

  return (
    <div className="herb-library" id="herb-library">
      {/* ===== Page Header ===== */}
      <div className="herb-header-section">
        <h1 className="herb-page-title animate-ink-fade">🌿 本草百科</h1>
        <p className="herb-page-subtitle animate-fade-in-up delay-1">
          收录经方派与温病派常用中药材，传承本草智慧
        </p>
      </div>

      <div className="container">
        {/* ===== Search & Filter ===== */}
        <div className="herb-controls animate-fade-in-up delay-2" id="herb-controls">
          {user?.is_admin && (
            <div className="admin-actions-bar">
              <button
                className="btn btn-gold btn-admin-add"
                onClick={() => {
                  setFormMode('create');
                  setFormData(defaultFormData);
                  setFormError(null);
                  setIsFormOpen(true);
                }}
              >
                ✨ 新增药材
              </button>
            </div>
          )}
          <div className="herb-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="input search-input"
              placeholder="搜索药材名称、拼音、功效..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="herb-search-input"
            />
          </div>

          <div className="herb-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                id={`cat-${cat}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="divider-cloud" />

        {/* ===== Results Count ===== */}
        <p className="herb-results-count">
          共收录 <strong>{filteredHerbs.length}</strong> 味药材
        </p>

        {/* ===== Herb Grid ===== */}
        <div className="herb-grid" id="herb-grid">
          {filteredHerbs.map((herb, idx) => (
            <div
              key={herb.id}
              className="herb-card card animate-fade-in-up"
              style={{ animationDelay: `${0.1 + idx * 0.05}s`, opacity: 0 }}
              onClick={() => setSelectedHerb(herb)}
              id={`herb-${herb.id}`}
            >
              {/* Image */}
              <div className="herb-card-image">
                {herb.image ? (
                  <img src={herb.image} alt={herb.name} loading="lazy" />
                ) : (
                  <div className="herb-placeholder">
                    <span className="placeholder-icon">🌿</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="herb-card-info">
                <div className="herb-card-header">
                  <h3 className="herb-card-name">{herb.name}</h3>
                  <span className={`tag ${tempColorMap[herb.temperature] || 'tag-gold'}`}>
                    {herb.temperature}
                  </span>
                </div>
                <p className="herb-card-pinyin">{herb.pinyin}</p>
                <p className="herb-card-function">{herb.functions}</p>
                <div className="herb-card-meridians">
                  {herb.meridians.map((m) => (
                    <span key={m} className="meridian-tag">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredHerbs.length === 0 && (
          <div className="herb-empty">
            <span className="empty-icon">🍃</span>
            <p>未找到匹配的药材</p>
            <button className="btn btn-outline" onClick={() => { setSearchQuery(''); setActiveCategory('全部') }}>
              清除筛选
            </button>
          </div>
        )}
      </div>

      {/* ===== Detail Modal ===== */}
      {selectedHerb && (
        <div className="herb-modal-overlay" onClick={() => setSelectedHerb(null)} id="herb-modal">
          <div className="herb-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedHerb(null)} id="modal-close">✕</button>

            <div className="modal-hero">
              {selectedHerb.image ? (
                <img src={selectedHerb.image} alt={selectedHerb.name} className="modal-image" />
              ) : (
                <div className="modal-placeholder">
                  <span>🌿</span>
                </div>
              )}
            </div>

            <div className="modal-body">
              <div className="modal-title-row">
                <h2 className="modal-name">{selectedHerb.name}</h2>
                <span className="modal-pinyin">{selectedHerb.pinyin}</span>
                <span className="modal-latin">{selectedHerb.latin}</span>
              </div>

              <div className="modal-tags">
                <span className="tag tag-gold">{selectedHerb.category}</span>
                <span className={`tag ${tempColorMap[selectedHerb.temperature] || 'tag-gold'}`}>
                  {selectedHerb.temperature}
                </span>
                <span className="tag tag-jade">{selectedHerb.nature}</span>
              </div>

              <div className="modal-section">
                <h4 className="modal-label">归经</h4>
                <div className="modal-meridians">
                  {selectedHerb.meridians.map((m) => (
                    <span key={m} className="meridian-badge">{m}经</span>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-label">功效</h4>
                <p className="modal-text">{selectedHerb.functions}</p>
              </div>

              <div className="modal-section">
                <h4 className="modal-label">简介</h4>
                <p className="modal-text">{selectedHerb.description}</p>
              </div>

              <div className="modal-section">
                <h4 className="modal-label">用量</h4>
                <p className="modal-text">{selectedHerb.usage}</p>
              </div>

              <div className="modal-section">
                <h4 className="modal-label">📖 经典出处</h4>
                <p className="modal-text classic-ref">{selectedHerb.classicRef || selectedHerb.classic_ref}</p>
              </div>

              <div className="modal-section modal-warning">
                <h4 className="modal-label">⚠️ 禁忌</h4>
                <p className="modal-text">{selectedHerb.contraindications}</p>
              </div>

              {user?.is_admin && (
                <div className="modal-admin-actions" style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
                  <button
                    className="btn btn-outline btn-edit"
                    onClick={() => {
                      setFormMode('edit');
                      setFormData({
                        id: selectedHerb.id,
                        name: selectedHerb.name,
                        pinyin: selectedHerb.pinyin,
                        pinyin_flat: selectedHerb.pinyin_flat || '',
                        latin: selectedHerb.latin || '',
                        category: selectedHerb.category || '补气药',
                        temperature: selectedHerb.temperature || '温',
                        nature: selectedHerb.nature || '甘',
                        meridians: Array.isArray(selectedHerb.meridians) ? selectedHerb.meridians : [],
                        functions: selectedHerb.functions || '',
                        usage: selectedHerb.usage || '',
                        classic_ref: selectedHerb.classic_ref || selectedHerb.classicRef || '',
                        description: selectedHerb.description || '',
                        contraindications: selectedHerb.contraindications || '',
                        image: selectedHerb.image || ''
                      });
                      setFormError(null);
                      setSelectedHerb(null);
                      setIsFormOpen(true);
                    }}
                  >
                    📝 编辑此药
                  </button>
                  <button
                    className="btn btn-danger btn-delete"
                    style={{ background: 'var(--color-cinnabar)', color: 'white', borderColor: 'var(--color-cinnabar)' }}
                    onClick={() => handleDeleteHerb(selectedHerb.id)}
                  >
                    🗑️ 删除此药
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Admin Form Modal ===== */}
      {isFormOpen && (
        <div className="herb-modal-overlay form-modal-overlay" onClick={() => setIsFormOpen(false)} style={{ zIndex: 1010 }}>
          <div className="herb-modal form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <button className="modal-close" onClick={() => setIsFormOpen(false)}>✕</button>

            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', padding: 'var(--space-xl)' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-gold-light)', marginBottom: 'var(--space-lg)', borderBottom: '2px solid rgba(184, 134, 11, 0.2)', paddingBottom: 'var(--space-sm)' }}>
                {formMode === 'create' ? '🌿 新增中药材' : '📝 编辑中药材'}
              </h2>

              {formError && (
                <div className="modal-warning" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-sm) var(--space-md)' }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>⚠️ {formError}</p>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="admin-form">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>

                  {/* ID */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>药材拼音ID (英文，作为数据库主键且不可修改)*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: renshen"
                      required
                      disabled={formMode === 'edit'}
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value.trim().toLowerCase() })}
                    />
                  </div>

                  {/* Name */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>药材名称*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: 人参"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.trim() })}
                    />
                  </div>

                  {/* Pinyin */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>拼音带声调*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: Rén Shēn"
                      required
                      value={formData.pinyin}
                      onChange={(e) => setFormData({ ...formData, pinyin: e.target.value.trim() })}
                    />
                  </div>

                  {/* Pinyin Flat */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>拼音无声调/简写(空格分隔，用于快速模糊搜索)*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: renshen ren shen rs"
                      required
                      value={formData.pinyin_flat}
                      onChange={(e) => setFormData({ ...formData, pinyin_flat: e.target.value.trim().toLowerCase() })}
                    />
                  </div>

                  {/* Latin */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>拉丁名称</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: Radix Ginseng"
                      value={formData.latin}
                      onChange={(e) => setFormData({ ...formData, latin: e.target.value.trim() })}
                    />
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>分类*</label>
                    <select
                      className="input"
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.filter(c => c !== '全部').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Temperature */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>药性 (气)*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: 温 / 微温 / 平 / 寒 / 微寒"
                      required
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value.trim() })}
                    />
                  </div>

                  {/* Nature */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>药味 (味)*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: 甘、微苦 / 辛 / 苦"
                      required
                      value={formData.nature}
                      onChange={(e) => setFormData({ ...formData, nature: e.target.value.trim() })}
                    />
                  </div>

                  {/* Image URL */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>图片地址 (可空，或设置为 /herbs/文件名.png)</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: /herbs/renshen.png"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value.trim() })}
                    />
                  </div>
                </div>

                {/* Meridians checkboxes */}
                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>归经 (可多选)*</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    {MERIDIANS_OPTIONS.map(m => (
                      <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: 'var(--text-sm)', padding: '4px 8px', color: 'var(--color-text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={formData.meridians.includes(m)}
                          onChange={() => handleMeridianChange(m)}
                        />
                        {m}经
                      </label>
                    ))}
                  </div>
                </div>

                {/* Textareas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                  {/* Functions */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>功效*</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '60px', padding: '10px', resize: 'vertical' }}
                      placeholder="例如: 大补元气，复脉固脱，补脾益肺，生津养血，安神益智"
                      required
                      value={formData.functions}
                      onChange={(e) => setFormData({ ...formData, functions: e.target.value })}
                    />
                  </div>

                  {/* Usage */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>用法用量*</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '50px', padding: '10px', resize: 'vertical' }}
                      placeholder="例如: 3-9g，另煎兑入"
                      required
                      value={formData.usage}
                      onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                    />
                  </div>

                  {/* Classic Ref */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>经典出处</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: 《伤寒论》独参汤、四君子汤"
                      value={formData.classic_ref}
                      onChange={(e) => setFormData({ ...formData, classic_ref: e.target.value })}
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>药材简介*</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '80px', padding: '10px', resize: 'vertical' }}
                      placeholder="描述该中药材的外观、产地、采收加工或主要的药理价值..."
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Contraindications */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>使用禁忌</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '60px', padding: '10px', resize: 'vertical' }}
                      placeholder="例如: 实证、热证忌服。不宜与藜芦同用（十八反）。"
                      value={formData.contraindications}
                      onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsFormOpen(false)}
                    disabled={submitting}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={submitting}
                  >
                    {submitting ? '提交中...' : '确认提交'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HerbLibrary
