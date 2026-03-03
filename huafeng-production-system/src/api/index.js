const API_BASE = 'http://localhost:3001/api'

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/stats/dashboard`)
  return res.json()
}

export async function fetchOrders() {
  const res = await fetch(`${API_BASE}/orders`)
  return res.json()
}

export async function fetchOrderDetail(id) {
  const res = await fetch(`${API_BASE}/orders/${id}`)
  return res.json()
}

export async function fetchOrderProgress(orderId) {
  const res = await fetch(`${API_BASE}/stats/order-progress/${orderId}`)
  return res.json()
}

export async function fetchProcesses() {
  const res = await fetch(`${API_BASE}/processes`)
  return res.json()
}

export async function fetchWorkers() {
  const res = await fetch(`${API_BASE}/workers`)
  return res.json()
}

export async function addWorker(data) {
  const res = await fetch(`${API_BASE}/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function deleteOrder(id) {
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' })
  return res.json()
}

export async function updateWorker(id, data) {
  const res = await fetch(`${API_BASE}/workers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function deleteWorker(id) {
  const res = await fetch(`${API_BASE}/workers/${id}`, { method: 'DELETE' })
  return res.json()
}

export async function uploadWorkOrder(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/orders/upload`, {
    method: 'POST',
    body: formData
  })
  return res.json()
}

export async function fetchLogs() {
  const res = await fetch(`${API_BASE}/logs`)
  return res.json()
}
