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
  delete: (id) => api.delete(`/interactions/${id}`),
  generateSummary: (data) => api.post('/interactions/ai-summary', data)
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

export default api
