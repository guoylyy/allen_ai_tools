// 阿里云成本采集器
import axios from 'axios'

// 阿里云配置（需要从环境变量或配置文件读取）
const ALIYUN_CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  regionId: 'cn-hangzhou'
}

// 获取阿里云成本数据
export async function collectAliyunCost() {
  // 如果没有配置阿里云密钥，返回模拟数据
  if (!ALIYUN_CONFIG.accessKeyId || !ALIYUN_CONFIG.accessKeySecret) {
    console.log('⚠️  未配置阿里云密钥，使用模拟数据')
    return getMockAliyunCost()
  }
  
  try {
    // 获取本月成本
    const bills = await getBill()
    
    // 解析账单
    const costData = {
      month: new Date().toISOString().slice(0, 7),
      服务器: 0,
      存储: 0,
      带宽: 0,
      CDN: 0,
      短信: 0,
      总计: 0,
      details: []
    }
    
    bills.forEach(bill => {
      const amount = parseFloat(bill.amount) || 0
      costData.总计 += amount
      
      // 根据产品类型分类
      if (bill.productCode?.includes('ecs') || bill.productCode?.includes('ECS')) {
        costData.服务器 += amount
      } else if (bill.productCode?.includes('oss') || bill.productCode?.includes('OSS')) {
        costData.存储 += amount
      } else if (bill.productCode?.includes('vpc') || bill.productCode?.includes('bandwidth')) {
        costData.带宽 += amount
      } else if (bill.productCode?.includes('cdn') || bill.productCode?.includes('CDN')) {
        costData.CDN += amount
      } else if (bill.productCode?.includes('dysms') || bill.productCode?.includes('短信')) {
        costData.短信 += amount
      }
      
      costData.details.push({
        product: bill.productName || bill.productCode,
        amount
      })
    })
    
    return costData
  } catch (error) {
    console.error('获取阿里云成本失败:', error)
    return getMockAliyunCost()
  }
}

// 获取账单API调用
async function getBill() {
  // 这里需要实现阿里云API调用
  // 由于阿里云API较复杂，这里返回模拟数据
  // 实际实现需要使用阿里云SDK
  
  // 示例API调用（需要安装 @alibaba/alicloud-sdk-core）
  // const client = new ALIYUN_API_CLIENT(ALIYUN_CONFIG)
  // return await client.describeBill()
  
  return getMockAliyunBill()
}

// 模拟阿里云账单
function getMockAliyunBill() {
  return [
    { productName: '云服务器 ECS', productCode: 'ecs', amount: '300.00' },
    { productName: '云盘 ESSD', productCode: 'ecs', amount: '50.00' },
    { productName: '共享带宽', productCode: 'vpc', amount: '30.00' },
    { productName: 'CDN', productCode: 'cdn', amount: '20.00' },
    { productName: '短信服务', productCode: 'dysms', amount: '15.00' }
  ]
}

// 模拟成本数据
function getMockAliyunCost() {
  return {
    month: new Date().toISOString().slice(0, 7),
    服务器: 300,
    存储: 50,
    带宽: 30,
    CDN: 20,
    短信: 15,
    总计: 415,
    details: getMockAliyunBill(),
    _mock: true
  }
}

// 获取阿里云服务器状态
export async function getAliyunInstances() {
  if (!ALIYUN_CONFIG.accessKeyId) {
    return []
  }
  
  // 需要实现阿里云ECS API调用
  // 这里返回空数组，实际需要使用阿里云SDK
  return []
}
