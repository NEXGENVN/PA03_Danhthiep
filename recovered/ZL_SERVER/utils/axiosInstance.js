const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");

/**
 * Tạo một instance axios được cấu hình sẵn proxy nếu có trong .env
 */
const createAxiosInstance = () => {
  const proxyIp = process.env.PROXY_IP;
  const proxyPort = process.env.PROXY_PORT;
  const proxyUser = process.env.PROXY_USER;
  const proxyPass = process.env.PROXY_PASS;

  const axiosConfig = {
    timeout: 30000,
  };

  if (proxyIp && proxyPort) {
    console.log(`[Proxy] Detected proxy: ${proxyIp}:${proxyPort}`);

    // Nếu port là 1080 hoặc các port thường dùng cho SOCKS, sử dụng SocksProxyAgent
    // Hoặc có thể cấu hình PROXY_TYPE trong .env nếu muốn linh hoạt hơn
    const isSocks = proxyPort === "1080" || proxyPort === "1081";

    if (isSocks) {
      const auth =
        proxyUser && proxyPass
          ? `${proxyUser}:${proxyPass}@`
          : proxyUser
            ? `${proxyUser}@`
            : "";
      const proxyUrl = `socks5h://${auth}${proxyIp}:${proxyPort}`;
      console.log(`[Proxy] Using SOCKS5h agent (Remote DNS)`);

      const agent = new SocksProxyAgent(proxyUrl);
      axiosConfig.httpAgent = agent;
      axiosConfig.httpsAgent = agent;
    } else {
      // HTTP Proxy
      console.log(`[Proxy] Using HTTP proxy config`);
      axiosConfig.proxy = {
        protocol: "http",
        host: proxyIp,
        port: parseInt(proxyPort),
      };

      if (proxyUser && proxyPass) {
        axiosConfig.proxy.auth = {
          username: proxyUser,
          password: proxyPass,
        };
      }
    }
  }

  return axios.create(axiosConfig);
};

const axiosInstance = createAxiosInstance();

module.exports = axiosInstance;

