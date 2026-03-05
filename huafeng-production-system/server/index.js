const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const { getDB, dbReady } = require('./db');
const { parseWorkOrderExcel } = require('./excelParser');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 文件上传配置
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 数据库就绪后启动API
dbReady.then(() => {
  const db = getDB();

  // ============ 订单API ============

  // 上传并解析派工单
  app.post('/api/orders/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请上传文件' });
      }

      const filePath = req.file.path;
      const parsed = parseWorkOrderExcel(filePath);

      if (!parsed.order) {
        return res.status(400).json({ error: '无法解析Excel文件' });
      }

      const orderId = uuidv4();
      
      db.prepare(`
        INSERT INTO orders (id, customer_name, project_name, device_no, quantity, delivery_date, process_date, cw, cd, ch, op, oph, df, dwg, dbg, doorhnd, qt, paint_color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        parsed.order.customer_name || '',
        parsed.order.project_name || '',
        parsed.order.device_no || '',
        parsed.order.quantity || 1,
        parsed.order.delivery_date || '',
        parsed.order.process_date || '',
        parsed.order.cw || '',
        parsed.order.cd || '',
        parsed.order.ch || '',
        parsed.order.op || '',
        parsed.order.oph || '',
        parsed.order.df || '',
        parsed.order.dwg || '',
        parsed.order.dbg || '',
        parsed.order.doorhnd || '',
        parsed.order.qt || '',
        parsed.order.paint_color || ''
      );

      for (const p of parsed.products) {
        db.prepare(`
          INSERT INTO products (id, order_id, serial_no, part_no, name, material, length, width, thickness, quantity, total_quantity, params, paint_color, process_route, process_file_no)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          orderId,
          p.serial_no || null,
          p.part_no || '',
          p.name || '',
          p.material || '',
          p.length || null,
          p.width || null,
          p.thickness || null,
          p.quantity || 0,
          p.total_quantity || 0,
          p.params || '',
          p.paint_color || '',
          p.process_route || '',
          p.process_file_no || ''
        );
      }

      db.prepare(`
        INSERT INTO logs (id, type, action, target_id, target_name, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'order', 'create', orderId, parsed.order.project_name || parsed.order.customer_name, `导入订单，包含${parsed.products.length}个产品`);

      res.json({
        success: true,
        orderId,
        productCount: parsed.products.length,
        message: '订单导入成功'
      });
    } catch (error) {
      console.error('上传失败:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 获取订单列表
  app.get('/api/orders', (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT o.*, 
          (SELECT COUNT(*) FROM products WHERE order_id = o.id) as product_count
        FROM orders o 
        ORDER BY o.created_at DESC
      `).all();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取订单详情
  app.get('/api/orders/:id', (req, res) => {
    try {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }
      const products = db.prepare('SELECT * FROM products WHERE order_id = ?').all(req.params.id);
      res.json({ order, products });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 删除订单
  app.delete('/api/orders/:id', (req, res) => {
    try {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
      db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
      
      db.prepare(`
        INSERT INTO logs (id, type, action, target_id, target_name, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'order', 'delete', req.params.id, order?.project_name || order?.customer_name, '删除订单');
      
      res.json({ success: true, message: '订单已删除' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ 产品API ============

  app.get('/api/orders/:orderId/products', (req, res) => {
    try {
      const products = db.prepare('SELECT * FROM products WHERE order_id = ?').all(req.params.orderId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/products/by-process/:processId', (req, res) => {
    try {
      const products = db.prepare(`
        SELECT p.*, o.customer_name, o.project_name, o.device_no
        FROM products p
        JOIN orders o ON p.order_id = o.id
        WHERE p.process_route LIKE ?
      `).all(`%${req.params.processId}%`);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ 工序API ============

  app.get('/api/processes', (req, res) => {
    try {
      const processes = db.prepare('SELECT * FROM processes ORDER BY sort_order').all();
      res.json(processes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ 员工API ============

  app.get('/api/workers', (req, res) => {
    try {
      const workers = db.prepare('SELECT * FROM workers WHERE status = ? ORDER BY name').all('active');
      res.json(workers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/workers', (req, res) => {
    try {
      const { name, department, position, phone } = req.body;
      const id = uuidv4();
      
      db.prepare(`
        INSERT INTO workers (id, name, department, position, phone)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name, department, position, phone);
      
      res.json({ success: true, id, message: '员工添加成功' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/workers/:id', (req, res) => {
    try {
      const { name, department, position, phone, status } = req.body;
      db.prepare(`
        UPDATE workers SET name = ?, department = ?, position = ?, phone = ?, status = ?
        WHERE id = ?
      `).run(name, department, position, phone, status, req.params.id);
      res.json({ success: true, message: '员工信息已更新' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/workers/:id', (req, res) => {
    try {
      db.prepare('UPDATE workers SET status = ? WHERE id = ?').run('inactive', req.params.id);
      res.json({ success: true, message: '员工已禁用' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ 统计API ============

  app.get('/api/stats/dashboard', (req, res) => {
    try {
      const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
      const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
      const totalWorkers = db.prepare('SELECT COUNT(*) as count FROM workers WHERE status = ?').get('active').count;
      
      const recentOrders = db.prepare(`
        SELECT * FROM orders ORDER BY created_at DESC LIMIT 10
      `).all();

      res.json({
        totalOrders,
        totalProducts,
        totalWorkers,
        recentOrders
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stats/order-progress/:orderId', (req, res) => {
    try {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
      const products = db.prepare('SELECT * FROM products WHERE order_id = ?').all(req.params.orderId);
      const processes = db.prepare('SELECT * FROM processes ORDER BY sort_order').all();
      
      const progress = processes.map(p => {
        const count = products.filter(pr => 
          pr.process_route && pr.process_route.includes(p.display_name)
        ).length;
        return {
          process_id: p.id,
          process_name: p.display_name,
          total_products: count
        };
      }).filter(p => p.total_products > 0);

      res.json({ order, progress });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ 日志API ============

  app.get('/api/logs', (req, res) => {
    try {
      const logs = db.prepare(`
        SELECT * FROM logs ORDER BY created_at DESC LIMIT 100
      `).all();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 启动服务器
  app.listen(PORT, () => {
    console.log(`🚀 华丰电梯生产管理系统 API 已启动: http://localhost:${PORT}`);
  });
});
