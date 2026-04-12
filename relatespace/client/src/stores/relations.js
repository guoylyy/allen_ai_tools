import { defineStore } from 'pinia'
import { relationsAPI, eventsAPI, momentsAPI, financeAPI } from '../api'

export const useRelationStore = defineStore('relations', {
  state: () => ({
    relations: [],
    currentRelation: null,
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
    
    async addEvent(relationId, data) {
      try {
        const res = await eventsAPI.create({ relationId, ...data })
        if (res.data.success) {
          await this.fetchRelation(relationId)
        }
      } catch (err) {
        this.error = err.message
      }
    },
    
    async addMoment(relationId, data) {
      try {
        const res = await momentsAPI.create({ relationId, ...data })
        if (res.data.success) {
          await this.fetchRelation(relationId)
        }
      } catch (err) {
        this.error = err.message
      }
    },
    
    async addFinance(relationId, data) {
      try {
        const res = await financeAPI.create({ relationId, ...data })
        if (res.data.success) {
          await this.fetchRelation(relationId)
        }
      } catch (err) {
        this.error = err.message
      }
    },
    
    async addInteraction(relationId, data) {
      try {
        // 生成 AI 摘要
        const relation = this.relations.find(r => r.id === relationId)
        const summaryRes = await interactionsAPI.generateSummary({
          content: data.content,
          relationName: relation?.name,
          relationContext: relation?.background
        })
        const summary = summaryRes.data.success ? summaryRes.data.data.summary : ''
        
        const res = await interactionsAPI.create({ relationId, ...data, summary })
        if (res.data.success) {
          await this.fetchRelation(relationId)
        }
      } catch (err) {
        this.error = err.message
      }
    }
  }
})
