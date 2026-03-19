// Mock API
import { workers, products, processes, orders, workOrders, productionRecords } from '../data/mock'

// 模拟延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const api = {
  // 员工管理
  async getWorkers() {
    await delay(300)
    return { data: workers }
  },
  async addWorker(worker) {
    await delay(300)
    const newWorker = { ...worker, id: workers.length + 1 }
    workers.push(newWorker)
    return { data: newWorker }
  },
  async updateWorker(id, data) {
    await delay(300)
    const index = workers.findIndex(w => w.id === id)
    if (index !== -1) {
      workers[index] = { ...workers[index], ...data }
    }
    return { data: workers[index] }
  },
  async deleteWorker(id) {
    await delay(300)
    const index = workers.findIndex(w => w.id === id)
    if (index !== -1) {
      workers.splice(index, 1)
    }
    return { data: true }
  },

  // 产品管理
  async getProducts() {
    await delay(300)
    return { data: products }
  },
  async addProduct(product) {
    await delay(300)
    const newProduct = { ...product, id: products.length + 1 }
    products.push(newProduct)
    return { data: newProduct }
  },

  // 订单管理
  async getOrders() {
    await delay(300)
    return { data: orders }
  },
  async addOrder(order) {
    await delay(300)
    const newOrder = { 
      ...order, 
      id: orders.length + 1,
      orderNo: `DD${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    }
    orders.push(newOrder)
    return { data: newOrder }
  },
  async updateOrder(id, data) {
    await delay(300)
    const index = orders.findIndex(o => o.id === id)
    if (index !== -1) {
      orders[index] = { ...orders[index], ...data }
    }
    return { data: orders[index] }
  },

  // 工艺流程
  async getProcesses() {
    await delay(300)
    return { data: processes }
  },

  // 生产工单
  async getWorkOrders() {
    await delay(300)
    return { data: workOrders }
  },
  async createWorkOrder(orderId, order) {
    await delay(300)
    const newWorkOrder = {
      id: workOrders.length + 1,
      orderId,
      orderNo: order.orderNo,
      product: order.product,
      status: 'in_progress',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      expectedDate: order.deliveryDate
    }
    workOrders.push(newWorkOrder)
    return { data: newWorkOrder }
  },
  async updateWorkProgress(id, progress) {
    await delay(300)
    const index = workOrders.findIndex(w => w.id === id)
    if (index !== -1) {
      workOrders[index].progress = progress
      if (progress >= 100) {
        workOrders[index].status = 'completed'
      }
    }
    return { data: workOrders[index] }
  },

  // 生产记录
  async getProductionRecords(workOrderId) {
    await delay(300)
    const records = workOrderId 
      ? productionRecords.filter(r => r.workOrderId === workOrderId)
      : productionRecords
    return { data: records }
  },
  async addProductionRecord(record) {
    await delay(300)
    const newRecord = {
      ...record,
      id: productionRecords.length + 1,
      completedAt: new Date().toLocaleString()
    }
    productionRecords.push(newRecord)
    return { data: newRecord }
  },

  // 统计
  async getStats() {
    await delay(300)
    return {
      data: {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        producingOrders: orders.filter(o => o.status === 'producing').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalWorkers: workers.filter(w => w.status === 'active').length,
        inProgressWorkOrders: workOrders.filter(w => w.status === 'in_progress').length,
      }
    }
  }
}
