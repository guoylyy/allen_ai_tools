import { defineStore } from 'pinia'
import { relationsAPI } from '../api'

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
    }
  }
})
