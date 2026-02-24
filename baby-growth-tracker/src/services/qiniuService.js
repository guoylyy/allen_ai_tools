/**
 * 七牛云服务
 * 使用直传方式上传文件
 */

const qiniu = require('qiniu');
const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// 七牛云配置
const config = {
    accessKey: process.env.QINIU_ACCESS_KEY,
    secretKey: process.env.QINIU_SECRET_KEY,
    bucket: process.env.QINIU_BUCKET || 'baby-growth',
    domain: process.env.QINIU_DOMAIN
};

// 初始化
function init() {
    if (!config.accessKey || config.accessKey === 'your_access_key') {
        console.warn('⚠️ 七牛云配置未正确设置');
        return false;
    }
    
    console.log('✅ 七牛云服务初始化成功');
    console.log(`   Bucket: ${config.bucket}`);
    console.log(`   Domain: ${config.domain}`);
    return true;
}

/**
 * 生成上传凭证
 */
function getUploadToken() {
    const options = {
        scope: config.bucket,
        expires: 3600 * 24 // 24小时有效期
    };
    
    const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);
    const putPolicy = new qiniu.rs.PutPolicy(options);
    return putPolicy.uploadToken(mac);
}

/**
 * 上传文件 - 使用 HTTP 直传
 */
async function uploadFile(fileBuffer, key) {
    const uploadToken = getUploadToken();
    
    const formData = new (require('form-data'))();
    formData.append('file', fileBuffer, { filename: key });
    formData.append('token', uploadToken);
    formData.append('key', key);
    
    try {
        const response = await axios.post('https://upload.qiniup.com', formData, {
            headers: {
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        const url = `${config.domain}/${response.data.key}`;
        return {
            key: response.data.key,
            url: url
        };
    } catch (error) {
        console.error('上传失败:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * 生成随机文件名
 */
function generateKey(prefix = 'album') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}/${timestamp}_${random}`;
}

/**
 * 获取文件公共URL
 */
function getPublicUrl(key) {
    return `${config.domain}/${key}`;
}

module.exports = {
    init,
    getUploadToken,
    uploadFile,
    generateKey,
    getPublicUrl,
    config
};
