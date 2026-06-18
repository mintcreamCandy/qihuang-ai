import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../App'
import { apiService } from '../services/api'
import './PrescriptionLibrary.css'

/* 经典文献分类 */
const SOURCES = ['全部', '《伤寒论》', '《金匮要略》', '《太平惠民和剂局方》']

const defaultFormData = {
  id: '',
  name: '',
  pinyin: '',
  pinyin_flat: '',
  source: '《伤寒论》',
  composition: [{ herb: '', dosage: '' }],
  functions: '',
  indications: '',
  usage: '',
  description: '',
  contraindications: ''
};

function PrescriptionLibrary() {
  const { user } = useContext(AuthContext);
  const [activeSource, setActiveSource] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 管理员表单状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState(defaultFormData);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* 从后端动态加载方剂数据，实现防抖搜索 */
  useEffect(() => {
    setLoading(true)
    const delayDebounceFn = setTimeout(() => {
      apiService.getPrescriptions({
        source: activeSource === '全部' ? undefined : activeSource,
        search: searchQuery
      })
        .then(data => {
          setPrescriptions(data)
          setError(null)
        })
        .catch(err => {
          console.error(err)
          setError(err.message || '获取方剂数据失败，请重试')
        })
        .finally(() => {
          setLoading(false)
        })
    }, searchQuery ? 300 : 0)

    return () => clearTimeout(delayDebounceFn)
  }, [activeSource, searchQuery, refreshKey])

  const handleDeletePrescription = async (id) => {
    if (window.confirm('您确定要删除这首方剂吗？此操作将同步删除其对应的 RAG 向量检索数据和知识图谱节点，删除后无法恢复！')) {
      try {
        await apiService.deletePrescription(id);
        setSelectedPrescription(null);
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

    // 格式化组成成分，将 [{ herb: '桂枝', dosage: '9g' }] 转换为 {"桂枝": "9g"}
    const compositionObj = {};
    formData.composition.forEach(item => {
      const herbName = item.herb.trim();
      const dosageVal = item.dosage.trim();
      if (herbName) {
        compositionObj[herbName] = dosageVal;
      }
    });

    const payload = {
      ...formData,
      composition: compositionObj
    };

    try {
      if (formMode === 'create') {
        await apiService.createPrescription(payload);
      } else {
        await apiService.updatePrescription(payload.id, payload);
      }
      setIsFormOpen(false);
      setFormData(defaultFormData);
      setSelectedPrescription(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setFormError(err.message || '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompositionChange = (index, field, value) => {
    setFormData(prev => {
      const composition = [...prev.composition];
      composition[index] = { ...composition[index], [field]: value };
      return { ...prev, composition };
    });
  };

  const addCompositionRow = () => {
    setFormData(prev => ({
      ...prev,
      composition: [...prev.composition, { herb: '', dosage: '' }]
    }));
  };

  const removeCompositionRow = (index) => {
    setFormData(prev => {
      if (prev.composition.length <= 1) return prev;
      const composition = prev.composition.filter((_, i) => i !== index);
      return { ...prev, composition };
    });
  };

  return (
    <div className="pres-library" id="pres-library">
      {/* ===== Page Header ===== */}
      <div className="pres-header-section">
        <h1 className="pres-page-title animate-ink-fade">📜 经典方剂</h1>
        <p className="pres-page-subtitle animate-fade-in-up delay-1">
          收录伤寒金匮经方与后世名方，理法方药一脉相承
        </p>
      </div>

      <div className="container">
        {/* ===== Search & Filter ===== */}
        <div className="pres-controls animate-fade-in-up delay-2" id="pres-controls">
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
                ✨ 新增方剂
              </button>
            </div>
          )}
          <div className="pres-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="input search-input"
              placeholder="搜索方剂名称、拼音缩写、功用、主治..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="pres-search-input"
            />
          </div>

          <div className="pres-sources">
            {SOURCES.map((src) => (
              <button
                key={src}
                className={`source-chip ${activeSource === src ? 'active' : ''}`}
                onClick={() => setActiveSource(src)}
                id={`src-${src}`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>

        <div className="divider-cloud" />

        {/* ===== Results Count / Loading ===== */}
        <div className="pres-status-row">
          <p className="pres-results-count">
            共收录 <strong>{prescriptions.length}</strong> 首经典名方
          </p>
          {loading && <span className="pres-loading-spinner">✍️ 执笔调药中...</span>}
        </div>

        {/* ===== Prescription Grid ===== */}
        <div className="pres-grid" id="pres-grid">
          {prescriptions.map((pres, idx) => (
            <div
              key={pres.id}
              className="pres-card card animate-fade-in-up"
              style={{ animationDelay: `${0.1 + idx * 0.05}s`, opacity: 0 }}
              onClick={() => setSelectedPrescription(pres)}
              id={`pres-${pres.id}`}
            >
              <div className="pres-card-body">
                <div className="pres-card-header">
                  <h3 className="pres-card-name">{pres.name}</h3>
                  <span className="tag tag-gold">{pres.source}</span>
                </div>
                <p className="pres-card-pinyin">{pres.pinyin}</p>

                <div className="pres-card-section">
                  <span className="pres-card-label">功用</span>
                  <p className="pres-card-text">{pres.functions}</p>
                </div>

                <div className="pres-card-section">
                  <span className="pres-card-label">组成配伍</span>
                  <p className="pres-card-composition">
                    {pres.composition ? Object.keys(pres.composition).join('、') : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && prescriptions.length === 0 && (
          <div className="pres-empty">
            <span className="empty-icon">🍃</span>
            <p>未找到匹配的方剂</p>
            <button className="btn btn-outline" onClick={() => { setSearchQuery(''); setActiveSource('全部') }}>
              清除筛选
            </button>
          </div>
        )}
      </div>

      {/* ===== Detail Modal ===== */}
      {selectedPrescription && (
        <div className="pres-modal-overlay" onClick={() => setSelectedPrescription(null)} id="pres-modal">
          <div className="pres-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPrescription(null)} id="modal-close">✕</button>

            <div className="modal-body">
              {/* Header Info */}
              <div className="modal-title-row">
                <h2 className="modal-name">{selectedPrescription.name}</h2>
                <span className="modal-pinyin">{selectedPrescription.pinyin}</span>
                <span className="tag tag-gold">{selectedPrescription.source}</span>
              </div>

              {/* Composition Grid */}
              <div className="modal-section">
                <h4 className="modal-label">方剂组成</h4>
                <div className="composition-grid">
                  {selectedPrescription.composition && Object.entries(selectedPrescription.composition).map(([herb, dosage]) => (
                    <div key={herb} className="composition-badge">
                      <span className="comp-herb">{herb}</span>
                      <span className="comp-dosage">{dosage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Functions */}
              <div className="modal-section">
                <h4 className="modal-label">功用</h4>
                <p className="modal-text">{selectedPrescription.functions}</p>
              </div>

              {/* Indications */}
              <div className="modal-section">
                <h4 className="modal-label">主治证候</h4>
                <p className="modal-text">{selectedPrescription.indications}</p>
              </div>

              {/* Usage */}
              <div className="modal-section">
                <h4 className="modal-label">煎服法</h4>
                <p className="modal-text">{selectedPrescription.usage}</p>
              </div>

              {/* Description */}
              {selectedPrescription.description && (
                <div className="modal-section">
                  <h4 className="modal-label">方解与阐释</h4>
                  <p className="modal-text">{selectedPrescription.description}</p>
                </div>
              )}

              {/* Warning/Contraindications */}
              {selectedPrescription.contraindications && (
                <div className="modal-section modal-warning">
                  <h4 className="modal-label">⚠️ 禁忌与使用注意</h4>
                  <p className="modal-text">{selectedPrescription.contraindications}</p>
                </div>
              )}

              {user?.is_admin && (
                <div className="modal-admin-actions" style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
                  <button
                    className="btn btn-outline btn-edit"
                    onClick={() => {
                      setFormMode('edit');
                      const compositionArray = selectedPrescription.composition
                        ? Object.entries(selectedPrescription.composition).map(([herb, dosage]) => ({ herb, dosage }))
                        : [{ herb: '', dosage: '' }];
                      setFormData({
                        id: selectedPrescription.id,
                        name: selectedPrescription.name,
                        pinyin: selectedPrescription.pinyin,
                        pinyin_flat: selectedPrescription.pinyin_flat || '',
                        source: selectedPrescription.source || '《伤寒论》',
                        composition: compositionArray,
                        functions: selectedPrescription.functions || '',
                        indications: selectedPrescription.indications || '',
                        usage: selectedPrescription.usage || '',
                        description: selectedPrescription.description || '',
                        contraindications: selectedPrescription.contraindications || ''
                      });
                      setFormError(null);
                      setSelectedPrescription(null);
                      setIsFormOpen(true);
                    }}
                  >
                    📝 编辑此方
                  </button>
                  <button
                    className="btn btn-danger btn-delete"
                    style={{ background: 'var(--color-cinnabar)', color: 'white', borderColor: 'var(--color-cinnabar)' }}
                    onClick={() => handleDeletePrescription(selectedPrescription.id)}
                  >
                    🗑️ 删除此方
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Admin Form Modal ===== */}
      {isFormOpen && (
        <div className="pres-modal-overlay form-modal-overlay" onClick={() => setIsFormOpen(false)} style={{ zIndex: 1010 }}>
          <div className="pres-modal form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <button className="modal-close" onClick={() => setIsFormOpen(false)}>✕</button>

            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', padding: 'var(--space-xl)' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-gold-light)', marginBottom: 'var(--space-lg)', borderBottom: '2px solid rgba(184, 134, 11, 0.2)', paddingBottom: 'var(--space-sm)' }}>
                {formMode === 'create' ? '📜 新增方剂' : '📝 编辑方剂'}
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
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>方剂拼音ID (拼音横线分隔，作为数据库主键且不可修改)*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: gui-zhi-tang"
                      required
                      disabled={formMode === 'edit'}
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value.trim().toLowerCase() })}
                    />
                  </div>

                  {/* Name */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>方剂名称*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: 桂枝汤"
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
                      placeholder="例如: Guì Zhī Tāng"
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
                      placeholder="例如: guizhitang gui zhi tang gzt"
                      required
                      value={formData.pinyin_flat}
                      onChange={(e) => setFormData({ ...formData, pinyin_flat: e.target.value.trim().toLowerCase() })}
                    />
                  </div>

                  {/* Source */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>经典来源*</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', padding: '8px 12px' }}
                      placeholder="例如: 《伤寒论》 或 《金匮要略》"
                      required
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value.trim() })}
                    />
                  </div>
                </div>

                {/* Composition Key-Values */}
                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>方剂组成配伍 (中药名及用量)*</label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                    {formData.composition.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input"
                          style={{ flex: 1, padding: '6px 12px' }}
                          placeholder="中药名 (如: 桂枝)"
                          required
                          value={item.herb}
                          onChange={(e) => handleCompositionChange(idx, 'herb', e.target.value)}
                        />
                        <input
                          type="text"
                          className="input"
                          style={{ flex: 1, padding: '6px 12px' }}
                          placeholder="剂量 (如: 9g)"
                          value={item.dosage}
                          onChange={(e) => handleCompositionChange(idx, 'dosage', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', minWidth: '40px', background: 'rgba(200, 75, 49, 0.1)', color: 'var(--color-cinnabar)', borderColor: 'rgba(200, 75, 49, 0.2)' }}
                          onClick={() => removeCompositionRow(idx)}
                          disabled={formData.composition.length <= 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '6px 16px', fontSize: 'var(--text-sm)', borderStyle: 'dashed', width: '100%', color: 'var(--color-text-primary)' }}
                    onClick={addCompositionRow}
                  >
                    ➕ 添加药物配伍
                  </button>
                </div>

                {/* Textareas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                  {/* Functions */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>功用*</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '60px', padding: '10px', resize: 'vertical' }}
                      placeholder="例如: 解肌发表，调和营卫"
                      required
                      value={formData.functions}
                      onChange={(e) => setFormData({ ...formData, functions: e.target.value })}
                    />
                  </div>

                  {/* Indications */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>主治证候*</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '60px', padding: '10px', resize: 'vertical' }}
                      placeholder="例如: 外感风寒表虚证。恶风发热，头痛，自汗出，鼻鸣干呕，舌苔薄白，脉浮缓。"
                      required
                      value={formData.indications}
                      onChange={(e) => setFormData({ ...formData, indications: e.target.value })}
                    />
                  </div>

                  {/* Usage */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>煎服法*</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '50px', padding: '10px', resize: 'vertical' }}
                      placeholder="例如: 水煎服，服后啜热稀粥，温覆取微似汗"
                      required
                      value={formData.usage}
                      onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>方解与阐释</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '80px', padding: '10px', resize: 'vertical' }}
                      placeholder="分析各药相伍的机制、方义或方歌口诀..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Contraindications */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>禁忌与使用注意</label>
                    <textarea
                      className="input"
                      style={{ width: '100%', minHeight: '60px', padding: '10px', resize: 'vertical' }}
                      placeholder="外感风寒表实无汗者禁用..."
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

export default PrescriptionLibrary
