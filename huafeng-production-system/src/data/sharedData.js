import { ref, computed } from 'vue'

// 完整订单数据 - 12个工序全部产品
export const ordersData = ref([
  {
    id: '46158563-65',
    customer: '巨通',
    project: '浙江万国汽车部件有限公司',
    deliveryDate: '2026-03-20',
    quantity: 3,
    status: '生产中',
    statusColor: 'info',
    // 产品列表，每个产品带工艺流程
    products: [
      // ==================== 剪板工序产品 ====================
      { sid: '41', partNo: 'HED1F003999', name: '层门护脚板', material: '镀锌板', length: 2500, width: 349, thickness: 1.2, quantity: 12, processRoute: '剪板-数冲-折弯' },
      { sid: '221', partNo: 'HED2Z007C03', name: '重锤导管', material: '镀锌板', length: 1930, width: 119.6, thickness: 1.5, quantity: 24, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '155.5', partNo: 'HED3T073105', name: '后踢脚板', material: '冷板', length: 2208, width: 170, thickness: 1, quantity: 3, processRoute: '剪板-焊接' },
      { sid: '100.1', partNo: 'HED2A080C01', name: '慢门板', material: '冷板', length: 2415, width: 758.2, thickness: 1.2, quantity: 24, processRoute: '剪板-折弯-焊接' },
      { sid: '101.1', partNo: 'HED2A082C01', name: '右快层门板', material: '冷板', length: 2415, width: 758.2, thickness: 1.2, quantity: 12, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '102.1', partNo: 'HED4D016C01', name: '左快层门板', material: '冷板', length: 2415, width: 758.2, thickness: 1.2, quantity: 12, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '100.4', partNo: 'HED2D016C01', name: '层门加强筋', material: '冷板', length: 2357, width: 135.6, thickness: 1.2, quantity: 24, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '113.1', partNo: 'HED4A056C01', name: '普通轿顶板本体', material: '冷板', length: 2460, width: 581.2, thickness: 1.2, quantity: 3, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '114.1', partNo: 'HED4A063C01', name: '后轿顶主体板', material: '冷板', length: 2460, width: 368.7, thickness: 1.2, quantity: 3, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '81.1', partNo: 'HED4A302C01', name: '筒灯轿顶主体板', material: '冷板', length: 2460, width: 581.2, thickness: 1.2, quantity: 9, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '82.1', partNo: 'HED4A361C01', name: '风机顶板本体', material: '冷板', length: 2460, width: 581.2, thickness: 1.2, quantity: 6, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '168.1', partNo: 'HED2B066C11', name: '慢轿门板', material: '冷板', length: 2415, width: 745.2, thickness: 1.2, quantity: 6, processRoute: '剪板-折弯-焊接' },
      { sid: '172.1', partNo: 'HED2B079C11', name: '右快轿门板', material: '冷板', length: 2415, width: 745.2, thickness: 1.2, quantity: 3, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '176.1', partNo: 'HED2B081C01', name: '左快轿门板', material: '冷板', length: 2415, width: 745.2, thickness: 1.2, quantity: 3, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '84.1', partNo: 'HED4B018C01', name: '前壁主体板', material: '冷板', length: 2530, width: 143.4, thickness: 1.2, quantity: 3, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '85.1', partNo: 'HED4B018C03', name: '前壁主体板', material: '冷板', length: 2530, width: 143.4, thickness: 1.2, quantity: 3, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '230.1', partNo: 'HED4D016C01', name: '普通轿壁板', material: '冷板', length: 2565.2, width: 571.2, thickness: 1.2, quantity: 9, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '88.1', partNo: 'HED4D016C01', name: '普通轿壁板', material: '冷板', length: 2565.2, width: 571.2, thickness: 1.2, quantity: 36, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '136.1', partNo: 'HED4D018C01', name: '角轿壁板', material: '冷板', length: 2565.2, width: 328.7, thickness: 1.2, quantity: 9, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '231.1', partNo: 'HED4D018C01', name: '角轿壁板', material: '冷板', length: 2565.2, width: 521.2, thickness: 1.2, quantity: 6, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '90.1', partNo: 'HED4D136C01', name: '侧操纵壁板', material: '冷板', length: 2565.2, width: 328.7, thickness: 1.2, quantity: 3, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '92.1', partNo: 'MTZS2.01-01', name: '门套横框1', material: '冷板', length: 2520, width: 134.2, thickness: 1.2, quantity: 12, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '106.1', partNo: 'MTZS2.02-01', name: '竖框底板', material: '冷板', length: 2420, width: 141.2, thickness: 1.2, quantity: 24, processRoute: '剪板-数冲-折弯' },
      { sid: '272.1', partNo: 'HED4A406C01', name: '前轿顶板本体', material: '冷板', length: 2460, width: 333.5, thickness: 2, quantity: 3, processRoute: '剪板-数冲-折弯-焊接' },
      // 剪板-折弯-焊接产品
      { sid: '82.2', partNo: 'HED4A037C01', name: '加强筋', material: '冷板', length: 975, width: 139.2, thickness: 1.2, quantity: 24, processRoute: '剪板-折弯-焊接' },
      { sid: '81.2', partNo: 'HED4A037C03', name: '加强筋', material: '冷板', length: 2398, width: 139.2, thickness: 1.2, quantity: 18, processRoute: '剪板-折弯-焊接' },
      { sid: '113.2', partNo: 'HED4A037C03', name: '加强筋', material: '冷板', length: 2398, width: 139.2, thickness: 1.2, quantity: 6, processRoute: '剪板-折弯-焊接' },
      // 剪板-焊接产品
      { sid: '155.5', partNo: 'HED3T073105', name: '后踢脚板', material: '冷板', length: 2208, width: 170, thickness: 1, quantity: 3, processRoute: '剪板-焊接' },
      { sid: '168.4', partNo: 'HED2D018C01', name: '轿门加强筋', material: '冷板', length: 2276, width: 152.6, thickness: 1.5, quantity: 12, processRoute: '剪板-数冲-焊接' },
      // 激光下料产品
      { sid: '15', partNo: 'HED0G001001', name: '导轨垫片', material: '镀锌板', length: 180, width: 50, thickness: 0.5, quantity: 468, processRoute: '激光下料' },
      { sid: '17', partNo: 'HED0G002001', name: '导轨垫片', material: '镀锌板', length: 220, width: 50, thickness: 0.5, quantity: 156, processRoute: '激光下料' },
      { sid: '16', partNo: 'HED0G001002', name: '导轨垫片', material: '镀锌板', length: 180, width: 50, thickness: 1, quantity: 234, processRoute: '激光下料' },
      { sid: '18', partNo: 'HED0G002002', name: '导轨垫片', material: '镀锌板', length: 220, width: 50, thickness: 1, quantity: 78, processRoute: '激光下料' },
      { sid: '222', partNo: 'HED2Z006C04', name: '重锤导管安装板', material: '镀锌板', length: 350, width: 30, thickness: 1, quantity: 48, processRoute: '激光下料-喷涂' },
      { sid: '359.2', partNo: 'HED3K252C01', name: '上轮罩', material: '镀锌板', length: 340, width: 336, thickness: 1, quantity: 6, processRoute: '激光下料-折弯-组装' },
      { sid: '325.1', partNo: 'HED4F326C01', name: '轿底花纹板', material: '花纹钢板', length: 3630, width: 1230, thickness: 5, quantity: 3, processRoute: '激光下料-焊接' },
      // 角钢线产品
      { sid: '1', partNo: 'HED0E008C01P', name: '角铁斜撑(对重)', material: '角钢', length: 410, width: 63, thickness: 5, quantity: 78, processRoute: '角钢线-喷涂' },
      { sid: '10.1', partNo: 'HED0E022101', name: '角铁本体', material: '角钢', length: 695.5, width: 75, thickness: 6, quantity: 39, processRoute: '角钢线-焊接' },
      { sid: '13', partNo: 'HED0E061002P', name: '导轨固定支架', material: '角钢', length: 180, width: 75, thickness: 6, quantity: 117, processRoute: '角钢线-喷涂' },
      { sid: '9', partNo: 'HED0E020002P', name: '导轨固定支架', material: '角钢', length: 230, width: 75, thickness: 6, quantity: 39, processRoute: '角钢线-喷涂' },
      // 切管机产品
      { sid: '192', partNo: 'HED6E179001P', name: '对重垫高槽钢', material: '槽钢', length: 500, width: 100, thickness: 10, quantity: 6, processRoute: '切管机' },
      { sid: '325.2', partNo: 'HED4F327C01', name: '中边梁', material: '槽钢', length: 3542, width: 100, thickness: 10, quantity: 3, processRoute: '切管机-焊接' },
      { sid: '359.1', partNo: 'HED3K335C01', name: '对重上梁', material: '槽钢', length: 1622, width: 100, thickness: 14, quantity: 6, processRoute: '切管机-喷涂-组装' },
      { sid: '154.1', partNo: 'HED3T058101', name: '上横档', material: '方管', length: 3400, width: 30, thickness: 1.5, quantity: 6, processRoute: '切管机-焊接' },
      // 焊接产品
      { sid: '10', partNo: 'HED0E022C01P', name: '对重悬臂角铁(左件)', material: '组件', length: 0, width: 0, thickness: 0, quantity: 39, processRoute: '焊接-喷涂' },
      { sid: '100', partNo: 'HED2A079C03', name: '慢层门板', material: '组件', length: 0, width: 0, thickness: 0, quantity: 24, processRoute: '焊接-喷涂' },
      { sid: '221', partNo: 'HED2Z007C03', name: '重锤导管', material: '镀锌板', length: 1930, width: 119.6, thickness: 1.5, quantity: 24, processRoute: '剪板-数冲-折弯-焊接' },
      { sid: '325', partNo: 'HED4F580C01P', name: '左轿底', material: '组件', length: 0, width: 0, thickness: 0, quantity: 3, processRoute: '焊接-喷涂' },
      { sid: '326', partNo: 'HED4F580C02P', name: '右轿底', material: '组件', length: 0, width: 0, thickness: 0, quantity: 3, processRoute: '焊接-喷涂' },
      // 喷涂产品
      { sid: '106', partNo: 'MTZS2.02', name: '门套竖框结合件', material: '组件', length: 0, width: 0, thickness: 0, quantity: 24, processRoute: '喷涂-组装' },
      { sid: '42', partNo: 'HED3A486C01P', name: '主上梁组件', material: '组件', length: 0, width: 0, thickness: 0, quantity: 3, processRoute: '喷涂-组装' },
      // 组装产品
      { sid: '359', partNo: 'HED3K334C01', name: '对重架', material: '组件', length: 0, width: 0, thickness: 0, quantity: 3, processRoute: '组装' },
      { sid: '280', partNo: 'HED4A073002P', name: '校正架组件（副立梁）', material: '组件', length: 0, width: 0, thickness: 0, quantity: 12, processRoute: '焊接-喷涂-组装' },
      { sid: '306', partNo: 'HED3Z108C01P', name: '中间斜拉杆组件', material: '组件', length: 0, width: 0, thickness: 0, quantity: 12, processRoute: '组装' }
    ]
  }
])

// 计算订单的工序状态
export const computeProcessStatus = (order) => {
  const processStatus = {}
  const allProcesses = ['剪板', '数冲', '激光下料', '折弯', '角钢线', '切管机', '锯床', '钻床', '普冲', '焊接', '喷涂', '组装']
  
  allProcesses.forEach(proc => {
    const productsInProc = order.products.filter(p => p.processRoute && p.processRoute.split('-').includes(proc))
    if (productsInProc.length === 0) {
      processStatus[proc] = { status: '无', items: [], completedCount: 0, totalCount: 0, canSchedule: false }
      return
    }
    
    const getProcIndex = (route, procName) => route.split('-').indexOf(procName)
    
    let canSchedule = true
    let allCompleted = true
    let hasInProgress = false
    
    productsInProc.forEach(product => {
      const currentIndex = getProcIndex(product.processRoute, proc)
      if (currentIndex > 0) {
        const prevProc = product.processRoute.split('-')[currentIndex - 1]
        if (!product.completedProcs || !product.completedProcs[prevProc]) canSchedule = false
      }
      if (!product.completedProcs || !product.completedProcs[proc]) allCompleted = false
      if (product.completedProcs && product.completedProcs[proc] === '进行中') hasInProgress = true
    })
    
    const completedCount = productsInProc.filter(p => p.completedProcs && p.completedProcs[proc] === '已完成').length
    
    let status = '待开始'
    if (allCompleted) status = '已完成'
    else if (hasInProgress) status = '进行中'
    else if (!canSchedule) status = '已阻塞'
    
    processStatus[proc] = { status, items: productsInProc, completedCount, totalCount: productsInProc.length, canSchedule }
  })
  
  order.processes = processStatus
  return processStatus
}

// 报工历史记录
export const historyRecords = ref([
  { id: 1, date: '2026-03-03', orderId: '46158563-65', process: '剪板', itemCount: 28, status: '已完成' },
  { id: 2, date: '2026-03-02', orderId: '46158563-65', process: '数冲', itemCount: 15, status: '已完成' }
])

// 工艺列表
export const processList = ref([
  { name: '剪板', color: '#ff6b6b' },
  { name: '数冲', color: '#feca57' },
  { name: '激光下料', color: '#48dbfb' },
  { name: '折弯', color: '#1dd1a1' },
  { name: '角钢线', color: '#5f27cd' },
  { name: '切管机', color: '#ff9ff3' },
  { name: '锯床', color: '#54a0ff' },
  { name: '钻床', color: '#a55af' },
  { name: '普冲', color: '#f368e0' },
  { name: '焊接', color: '#00d2d3' },
  { name: '喷涂', color: '#ff9f43' },
  { name: '组装', color: '#00cec9' }
])
