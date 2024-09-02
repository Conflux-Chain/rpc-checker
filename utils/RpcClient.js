
const axios = require('axios');

class RpcClient {
    constructor(baseURL) {
        this.url = baseURL;
    }

    async send(method, params) {
        try {
            const response = await axios.post(this.url, {
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: 1
            });
            return response.data;
        } catch (error) {
            console.error('Error sending RPC request:', error);
            throw error;
        }
    }
}

module.exports = RpcClient;
