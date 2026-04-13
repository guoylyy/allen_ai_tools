import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 关系人API
export const relationsAPI = {
  getAll: () => api.get('/relations'),
  getById: (id) => api.get(`/relations/${id}`),
  create: (data) => api.post('/relations', data),
  update: (id, data) => api.put(`/relations/${id}`, data),
  delete: (id) => api.delete(`/relations/${id}`),
  getFollowup: () => api.get('/relations/stats/followup')
}

// 互动API
export const interactionsAPI = {
  getByRelation: (relationId) => api.get(`/interactions/relation/${relationId}`),
  create: (data) => api.post('/interactions', data),
  update: (id, data) => api.put(`/interactions/${id}`, data),
  delete: (id) => api.delete(`/interactions/${id}`)
}

// 财务API
export const financeAPI = {
  getByRelation: (relationId) => api.get(`/finance/relation/${relationId}`),
  getStats: (relationId) => api.get(`/finance/stats/${relationId}`),
  create: (data) => api.post('/finance', data),
  update: (id, data) => api.put(`/finance/${id}`, data),
  delete: (id) => api.delete(`/finance/${id}`)
}

// 朋友圈API
export const momentsAPI = {
  getByRelation: (relationId) => api.get(`/moments/relation/${relationId}`),
  create: (data) => api.post('/moments', data),
  update: (id, data) => api.put(`/moments/${id}`, data),
  delete: (id) => api.delete(`/moments/${id}`)
}

// 重要时刻API
export const eventsAPI = {
  getByRelation: (relationId) => api.get(`/events/relation/${relationId}`),
  getUpcoming: () => api.get('/events/upcoming'),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`)
}

// 学校API
export const schoolsAPI = {
  getAll: (params) => api.get('/schools', { params }),
  create: (data) => api.post('/schools', data),
  getByRelation: (relationId) => api.get(`/schools/relation/${relationId}`),
  addToRelation: (data) => api.post('/schools/relation', data),
  deleteRelationSchool: (id) => api.delete(`/schools/relation/${id}`),
  searchBySchool: (schoolName) => api.get(`/schools/search/${encodeURIComponent(schoolName)}`),
  getSchoolDetail: (schoolId) => api.get(`/schools/${schoolId}`)
}

// 导入导出API
export const importAPI = {
  // 获取导入模板
  getTemplate: () => {
    return axios({
      url: '/api/import/template',
      method: 'GET',
      responseType: 'blob'
    })
  },
  // 预览导入数据
  preview: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  // 执行导入
  execute: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/import/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  // 导出关系人
  export: () => {
    return axios({
      url: '/api/import/export',
      method: 'GET',
      responseType: 'blob'
    })
  }
}

export default api
