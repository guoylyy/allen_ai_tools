import { defineStore } from 'pinia'
import { relationsAPI, schoolsAPI } from '../api'

export const useRelationStore = defineStore('relations', {
  state: () => ({
    relations: [],
    currentRelation: null,
    currentRelationSchools: [],
    allSchools: [],
    loading: false,
    error: null
  }),
  
  getters: {
    importantRelations: (state) => state.relations.filter(r => r.importance === 'high'),
    overdueRelations: (state) => {
      const now = new Date()
      return state.relations.filter(r => {
        if (!r.lastInteraction) return false
        const last = new Date(r.lastInteraction)
        const diff = (now - last) / (1000 * 60 * 60 * 24)
        return diff > 14
      })
    }
  },
  
  actions: {
    async fetchRelations() {
      this.loading = true
      this.error = null
      try {
        const res = await relationsAPI.getAll()
        if (res.data.success) {
          this.relations = res.data.data
        }
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    
    async fetchRelation(id) {
      this.loading = true
      this.error = null
      try {
        const res = await relationsAPI.getById(id)
        if (res.data.success) {
          this.currentRelation = res.data.data
        }
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    
    async createRelation(data) {
      try {
        const res = await relationsAPI.create(data)
        if (res.data.success) {
          await this.fetchRelations()
          return res.data.data.id
        }
      } catch (err) {
        this.error = err.message
      }
    },
    
    async updateRelation(id, data) {
      try {
        const res = await relationsAPI.update(id, data)
        if (res.data.success) {
          await this.fetchRelations()
        }
      } catch (err) {
        this.error = err.message
      }
    },
    
    async deleteRelation(id) {
      try {
        const res = await relationsAPI.delete(id)
        if (res.data.success) {
          await this.fetchRelations()
        }
      } catch (err) {
        this.error = err.message
      }
    },

    // 获取所有学校
    async fetchAllSchools(search = '') {
      try {
        const res = await schoolsAPI.getAll({ search })
        if (res.data.success) {
          this.allSchools = res.data.data
        }
      } catch (err) {
        this.error = err.message
      }
    },

    // 获取关系人的教育经历
    async fetchRelationSchools(relationId) {
      try {
        const res = await schoolsAPI.getByRelation(relationId)
        if (res.data.success) {
          this.currentRelationSchools = res.data.data
        }
      } catch (err) {
        this.error = err.message
      }
    },

    // 添加教育经历
    async addRelationSchool(data) {
      try {
        const res = await schoolsAPI.addToRelation(data)
        if (res.data.success) {
          await this.fetchRelationSchools(data.relationId)
          await this.fetchAllSchools()
          return res.data.data
        }
      } catch (err) {
        this.error = err.message
      }
    },

    // 删除教育经历
    async deleteRelationSchool(id, relationId) {
      try {
        const res = await schoolsAPI.deleteRelationSchool(id)
        if (res.data.success) {
          await this.fetchRelationSchools(relationId)
        }
      } catch (err) {
        this.error = err.message
      }
    },

    // 按学校名搜索校友
    async searchBySchool(schoolName) {
      try {
        const res = await schoolsAPI.searchBySchool(schoolName)
        if (res.data.success) {
          return res.data.data
        }
        return []
      } catch (err) {
        this.error = err.message
        return []
      }
    }
  }
})
