const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class WechatAPI {
    constructor() {
        this.appid = process.env.WECHAT_APPID;
        this.appsecret = process.env.WECHAT_APPSECRET;
        this.accessToken = null;
        this.tokenExpiresAt = 0;
    }

    // 获取 access_token
    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        try {
            const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
                params: {
                    grant_type: 'client_credential',
                    appid: this.appid,
                    secret: this.appsecret
                }
            });

            const { access_token, expires_in } = response.data;
            this.accessToken = access_token;
            this.tokenExpiresAt = Date.now() + (expires_in - 300) * 1000; // 提前 5 分钟刷新

            return access_token;
        } catch (error) {
            console.error('获取 access_token 失败:', error.response?.data || error.message);
            throw error;
        }
    }

    // 发送模板消息
    async sendTemplateMessage(openid, templateId, data, url = '') {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await axios.post(
                `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
                {
                    touser: openid,
                    template_id: templateId,
                    url: url,
                    data: data
                }
            );

            return response.data;
        } catch (error) {
            console.error('发送模板消息失败:', error.response?.data || error.message);
            throw error;
        }
    }

    // 设置自定义菜单
    async createMenu(menu) {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await axios.post(
                `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`,
                menu
            );

            return response.data;
        } catch (error) {
            console.error('创建菜单失败:', error.response?.data || error.message);
            throw error;
        }
    }

    // 获取用户信息
    async getUserInfo(openid) {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await axios.get(
                `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
            );

            return response.data;
        } catch (error) {
            console.error('获取用户信息失败:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new WechatAPI();
