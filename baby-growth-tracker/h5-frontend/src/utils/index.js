// 将 UTC 时间转换为本地时间（北京时区）
export function toLocalDate(dateInput) {
  if (!dateInput) return new Date()
  
  // 如果是 Date 对象，直接返回
  if (dateInput instanceof Date) {
    if (!isNaN(dateInput.getTime())) {
      return dateInput
    }
    return new Date()
  }
  
  const dateStr = dateInput.toString()
  
  // 如果是 ISO UTC 格式（如 2026-02-18T08:40:00.000Z 或 2024-12-05T06:00:00+00:00）
  // 需要转换为北京时间（加8小时）
  if (dateStr.endsWith('Z') || dateStr.includes('+00:00')) {
    const utcDate = new Date(dateStr)
    return new Date(utcDate.getTime() + 8 * 60 * 60 * 1000)
  }
  
  // 如果是 ISO 格式带北京时间（如 2024-12-05T06:00:00+08:00）
  // 已经是北京时间，直接解析
  if (dateStr.includes('+08:00')) {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  // 如果是 MySQL datetime 格式（如 "2026-02-18 19:50:00"），需要转换为北京时间
  // 这种格式存储的是 UTC 时间
  const mysqlRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
  if (mysqlRegex.test(dateStr)) {
    const [datePart, timePart] = dateStr.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second] = timePart.split(':').map(Number)
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    return new Date(utcDate.getTime() + 8 * 60 * 60 * 1000)
  }
  
  // 普通时间字符串（如 "2026-02-19 11:50:00"）直接解析
  // 这是本地时间，不需要时区转换
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return new Date()
  return date
}

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = toLocalDate(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
}

// 相对时间
export function relativeTime(date) {
  if (!date) return ''
  const now = new Date()
  console.log('[relativeTime] Input date:', date)
  console.log('[relativeTime] Now:', now.toISOString())
  const d = toLocalDate(date)
  console.log('[relativeTime] Converted date:', d.toISOString())
  const diff = now - d
  console.log('[relativeTime] Diff (ms):', diff)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  console.log('[relativeTime] Minutes:', minutes, 'Hours:', hours, 'Days:', days)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  // 超过7天显示完整日期时间
  return formatDate(date, 'YYYY年MM月DD日 HH:mm')
}

// 验证手机号
export function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 验证验证码
export function validateCode(code) {
  return /^\d{4,6}$/.test(code)
}

// 图片压缩
export function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const ratio = img.width / img.height
        if (img.width > maxWidth) {
          canvas.width = maxWidth
          canvas.height = maxWidth / ratio
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

// 节流
export function throttle(fn, delay = 300) {
  let lastCall = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    }
  }
}

// 防抖
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}
