const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

/**
 * 解析派工单Excel文件
 * @param {string} filePath - Excel文件路径
 * @returns {Object} 解析结果
 */
function parseWorkOrderExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const result = {
    order: null,
    products: [],
    processes: []
  };

  // 解析第一个sheet（工艺流程卡）获取订单信息
  const firstSheet = workbook.Sheets['工艺流程卡'];
  if (firstSheet) {
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    // 订单信息在前几行
    result.order = {
      customer_name: '巨通', // 需要从实际数据中提取
      project_name: '',
      device_no: '',
      quantity: 1
    };
  }

  // 遍历所有工序sheet
  const processMap = {
    '剪板': 'jianban',
    '数冲': 'shuchong',
    '激光下料': 'jiguang',
    '折弯': 'zhewan',
    '角钢线': 'jiaogangxian',
    '切管机': 'qieguanji',
    '锯床': 'juchuang',
    '钻床': 'zuanchuang',
    '普冲': 'puchong',
    '焊接': 'hanjie',
    '喷涂': 'pentu',
    '组装': 'zuzhuang'
  };

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === '工艺流程卡') continue;
    
    const processId = processMap[sheetName];
    if (!processId) continue;

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // 解析header信息（前8行）
    const header = {};
    for (let i = 4; i < 8 && i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      for (let j = 0; j < row.length - 1; j += 2) {
        if (row[j] && row[j + 1] !== null && row[j + 1] !== undefined) {
          header[row[j]] = row[j + 1];
        }
      }
    }

    // 解析产品明细
    let productStartIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row[0] === '序号' && row[1] === '件号') {
        productStartIndex = i + 1;
        break;
      }
    }

    if (productStartIndex > 0) {
      for (let i = productStartIndex; i < data.length; i++) {
        const row = data[i];
        if (row && row[1]) { // 件号存在
          result.products.push({
            serial_no: row[0],
            part_no: row[1],
            name: row[2],
            material: row[3] || '',
            length: parseFloat(row[4]) || null,
            width: parseFloat(row[5]) || null,
            thickness: parseFloat(row[6]) || null,
            quantity: parseInt(row[7]) || 0,
            total_quantity: parseInt(row[8]) || 0,
            params: row[9] || '',
            paint_color: row[10] || '',
            process_route: row[11] || '',
            process_file_no: row[12] || '',
            process_id: processId,
            process_name: sheetName
          });
        }
      }
    }

    // 保存订单header信息
    if (!result.order && Object.keys(header).length > 0) {
      result.order = {
        customer_name: header['客户名称'] || '',
        project_name: header['项目名称'] || '',
        device_no: header['设备号'] || '',
        quantity: parseInt(header['台数']) || 1,
        delivery_date: header['订单交期'] || '',
        process_date: header['处理日期'] || '',
        cw: header['轿厢宽CW'] || '',
        cd: header['轿厢深CD'] || '',
        ch: header['轿厢高CH'] || '',
        op: header['开门宽OP'] || '',
        oph: header['开门高OPH'] || '',
        df: header['前距DF'] || '',
        dwg: header['对重导轨距DWG'] || '',
        dbg: header['轿厢导轨距DBG'] || '',
        doorhnd: header['主入口开门方向(厅外向轿内看) DOORHND'] || '',
        qt: header['前壁厚度QT'] || '',
        paint_color: header['喷涂颜色'] || ''
      };
    }
  }

  return result;
}

/**
 * 解析工艺流程卡Excel
 * @param {string} filePath 
 */
function parseProcessCardExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['工艺流程卡'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const processNames = data[4].slice(6); // 工序名称列表
  const products = [];

  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1]) continue;

    const product = {
      serial_no: row[0],
      part_no: row[1],
      name: row[2],
      quantity: parseInt(row[3]) || 0,
      material: row[4] || '',
      processes: []
    };

    // 检查每个工序
    for (let j = 0; j < processNames.length; j++) {
      if (row[6 + j] === '是') {
        product.processes.push(processNames[j]);
      }
    }

    products.push(product);
  }

  return { products, processNames };
}

module.exports = {
  parseWorkOrderExcel,
  parseProcessCardExcel
};
