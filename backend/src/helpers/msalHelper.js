const axios = require("axios");

/**
 * Microsoft Graph API ke liye Access Token generate karta hai
 */
async function getAccessToken() {
    try {
        const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;

        const params = new URLSearchParams();
        params.append("client_id", process.env.CLIENT_ID);
        params.append("client_secret", process.env.CLIENT_SECRET);
        params.append("scope", "https://graph.microsoft.com/.default");
        params.append("grant_type", "client_credentials");

        const res = await axios.post(url, params);
        return res.data.access_token;
    } catch (err) {
        console.error("Auth Error (Token Generation):", err.response?.data || err.message);
        throw new Error("Failed to generate Microsoft Access Token");
    }
}

module.exports = { getAccessToken };