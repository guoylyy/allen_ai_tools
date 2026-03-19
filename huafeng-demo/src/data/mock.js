// Mock 数据

// 员工数据
export const workers = [
  { id: 1, name: '张三', role: '技术员', status: 'active', phone: '13800138001', joinDate: '2023-01-15' },
  { id: 2, name: '李四', role: '安装工', status: 'active', phone: '13800138002', joinDate: '2023-03-20' },
  { id: 3, name: '王五', role: '维保工', status: 'active', phone: '13800138003', joinDate: '2023-05-10' },
  { id: 4, name: '赵六', role: '技术员', status: 'active', phone: '13800138004', joinDate: '2023-06-01' },
  { id: 5, name: '钱七', role: '安装工', status: 'inactive', phone: '13800138005', joinDate: '2022-11-05' },
]

// 产品数据（电梯型号）
export const products = [
  { id: 1, name: '乘客电梯P2000', type: '乘客电梯', speed: '2.0m/s', capacity: '1000kg', floors: 20, status: 'active' },
  { id: 2, name: '货梯H1500', type: '货梯', speed: '1.0m/s', capacity: '1500kg', floors: 10, status: 'active' },
  { id: 3, name: '住宅梯R1000', type: '住宅电梯', speed: '1.5m/s', capacity: '800kg', floors: 15, status: 'active' },
  { id: 4, name: '医用电梯M2000', type: '医用电梯', speed: '2.5m/s', capacity: '2000kg', floors: 25, status: 'active' },
]

// 工艺流程
export const processes = [
  { id: 1, name: '剪板', description: '钢板剪切', duration: 30, type: 'preparation' },
  { id: 2, name: '数冲', description: '数控冲孔', duration: 45, type: 'preparation' },
  { id: 3, name: '折弯', description: '折弯成型', duration: 40, type: 'preparation' },
  { id: 4, name: '焊接', description: '结构焊接', duration: 60, type: 'assembly' },
  { id: 5, name: '喷涂', description: '表面喷涂', duration: 50, type: 'finishing' },
  { id: 6, name: '组装', description: '整机组装', duration: 90, type: 'assembly' },
  { id: 7, name: '调试', description: '功能调试', duration: 60, type: 'testing' },
  { id: 8, name: '验收', description: '出厂验收', duration: 30, type: 'testing' },
]

// 订单数据
export const orders = [
  { 
    id: 1, 
    orderNo: 'DD20260301001',
    customer: '上海大厦物业',
    product: '乘客电梯P2000',
    floors: 20,
    speed: '2.0m/s',
    status: 'producing',
    amount: 350000,
    deliveryDate: '2026-05-01',
    createdAt: '2026-03-01'
  },
  { 
    id: 2, 
    orderNo: 'DD20260302002',
    customer: '北京医院',
    product: '医用电梯M2000',
    floors: 25,
    speed: '2.5m/s',
    status: 'pending',
    amount: 520000,
    deliveryDate: '2026-06-15',
    createdAt: '2026-03-02'
  },
  { 
    id: 3, 
    orderNo: 'DD20260303003',
    customer: '广州商场',
    product: '货梯H1500',
    floors: 10,
    speed: '1.0m/s',
    status: 'completed',
    amount: 280000,
    deliveryDate: '2026-04-01',
    createdAt: '2026-03-03'
  },
  { 
    id: 4, 
    orderNo: 'DD20260304004',
    customer: '深圳小区',
    product: '住宅梯R1000',
    floors: 15,
    speed: '1.5m/s',
    status: 'producing',
    amount: 320000,
    deliveryDate: '2026-05-20',
    createdAt: '2026-03-04'
  },
]

// 生产工单数据
export const workOrders = [
  { id: 1, orderId: 1, orderNo: 'DD20260301001', product: '乘客电梯P2000', status: 'in_progress', progress: 45, startDate: '2026-03-10', expectedDate: '2026-04-20' },
  { id: 2, orderId: 4, orderNo: 'DD20260304004', product: '住宅梯R1000', status: 'in_progress', progress: 20, startDate: '2026-03-15', expectedDate: '2026-05-01' },
]

// 生产记录
export const productionRecords = [
  { id: 1, workOrderId: 1, process: '剪板', worker: '张三', quantity: 10, status: 'completed', completedAt: '2026-03-12 10:30' },
  { id: 2, workOrderId: 1, process: '数冲', worker: '张三', quantity: 10, status: 'completed', completedAt: '2026-03-12 14:00' },
  { id: 3, workOrderId: 1, process: '折弯', worker: '李四', quantity: 8, status: 'in_progress', startedAt: '2026-03-13 09:00' },
]
