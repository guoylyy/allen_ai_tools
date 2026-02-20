import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 添加 openid 用于后端识别用户（测试环境使用 test_openid）
    const openid = localStorage.getItem('openid') || 'test_openid'
    config.headers['x-openid'] = openid
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 0) {
      return res.data
    } else {
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)

// API 方法
export const api = {
  // 登录
  login: (data) => request.post('/auth/login', data),
  
  // 获取用户信息
  getUserInfo: () => request.get('/user/info'),
  
  // 记录相关
  getRecords: (params) => request.get('/records', { params }),
  getAllRecords: (params) => request.get('/records', { params }), // 分页查询所有记录
  createRecord: (data) => request.post('/records', data),
  updateRecord: (id, data) => request.put(`/records/${id}`, data),
  deleteRecord: (id) => request.delete(`/records/${id}`),
  
  // 报表相关
  getTodayOverview: (params) => request.get('/report/today', { params }),
  getGrowthCurve: (params) => request.get('/report/growth-curve', { params }),
  getWeeklyReport: (params) => request.get('/report/weekly', { params }),
  getMonthlyReport: (params) => request.get('/report/monthly', { params }),
  
  // 家庭相关（新API）
  createFamily: () => request.post('/family/create'),
  getFamilyInfo: () => request.get('/family/info'),
  getFamilyMembers: () => request.get('/family/members'),
  addFamilyMember: (data) => request.post('/family/members', data),
  generateInviteLink: (data) => request.post('/family/invite-link', data),
  activateByInvite: (data) => request.post('/family/activate', data),
  isFamilyAdmin: () => request.get('/family/is-admin'),
  updateMemberRole: (id, data) => request.put(`/family/members/${id}`, data),
  removeMember: (id) => request.delete(`/family/members/${id}`),
  
  // 手机号密码登录
  loginByPhone: (data) => request.post('/auth/login-phone', data),
  
  // 孩子相关
  getChildren: () => request.get('/children'),
  addChild: (data) => request.post('/children', data),
  updateChild: (id, data) => request.put(`/children/${id}`, data),
  deleteChild: (id) => request.delete(`/children/${id}`),
  getCurrentChild: () => request.get('/children/current'),
  switchChild: (childId) => request.post(`/children/${childId}/switch`),
  
  // 家庭相关（旧API，兼容）
  inviteMemberLegacy: (data) => request.post('/family/invite/legacy', data),
  
  // 聊天消息处理（自然语言解析）
  processChatMessage: (data) => request.post('/chat/process', data),
  
  // 图片上传（七牛云）
  uploadImage: (formData) => request.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // 相册相关
  getAlbumPhotos: (params) => request.get('/album/photos', { params }),
  addAlbumPhoto: (data) => request.post('/album/photos', data),
  deleteAlbumPhoto: (id) => request.delete(`/album/photos/${id}`)
}

export default request
