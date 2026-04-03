const axios = require("axios");
const { getAccessToken } = require("./msalHelper");

// ⚠️ IMPORTANT: Yeh tumhara OneDrive (Work Account) email ID hi rahega
const USER_ID = "jitendar.goyal@bootes.in";

const graphHelper = {

    /* ----------------------------------------------------
       1. Read Excel Sheet (Used Range)
    -----------------------------------------------------*/
    readSheet: async (filePath, sheetName) => {
        const token = await getAccessToken();
        const encodedPath = encodeURIComponent(filePath);

        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encodedPath}:/workbook/worksheets('${sheetName}')/usedRange`;

        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return res.data.values;
    },

    /* ----------------------------------------------------
       1b. Get first table name in a sheet (auto-discover)
    -----------------------------------------------------*/
    getFirstTableName: async (filePath, sheetName) => {
        const token = await getAccessToken();
        const encodedPath = encodeURIComponent(filePath);
        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encodedPath}:/workbook/worksheets('${sheetName}')/tables`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        const tables = res.data.value || [];
        if (!tables.length) throw new Error(`No tables found in sheet '${sheetName}'`);
        console.log(`Tables in '${sheetName}':`, tables.map(t => t.name));
        return tables[0].name;
    },

    /* ----------------------------------------------------
       1c. Get table column names (for payload alignment)
    -----------------------------------------------------*/
    getTableColumnNames: async (filePath, sheetName, tableName) => {
        const token = await getAccessToken();
        const encodedPath = encodeURIComponent(filePath);
        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encodedPath}:/workbook/worksheets('${sheetName}')/tables('${tableName}')/columns`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        const cols = (res.data.value || []).map(c => c.name);
        console.log(`Columns in '${sheetName}' / '${tableName}' (${cols.length}):`, cols);
        return cols;
    },

    /* ----------------------------------------------------
       2. Add New Rows to Excel Table
    -----------------------------------------------------*/
    addRows: async (filePath, sheetName, tableName, values) => {
        const token = await getAccessToken();
        const encodedPath = encodeURIComponent(filePath);

        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encodedPath}:/workbook/worksheets('${sheetName}')/tables('${tableName}')/rows/add`;

        return axios.post(
            url,
            { values },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    /* ----------------------------------------------------
       3. Update Excel Row by Index
    -----------------------------------------------------*/
    updateRow: async (filePath, sheetName, tableName, index, values) => {
        const token = await getAccessToken();
        const encodedPath = encodeURIComponent(filePath);

        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encodedPath}:/workbook/worksheets('${sheetName}')/tables('${tableName}')/rows/itemAt(index=${index})`;

        return axios.patch(
            url,
            { values: [values] },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    /* ----------------------------------------------------
       4. Delete Excel Row by Index
    -----------------------------------------------------*/
    deleteRow: async (filePath, sheetName, tableName, index) => {
        const token = await getAccessToken();
        const encodedPath = encodeURIComponent(filePath);

        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encodedPath}:/workbook/worksheets('${sheetName}')/tables('${tableName}')/rows/itemAt(index=${index})`;

        return axios.delete(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /* ----------------------------------------------------
       5. ⭐ GET ONEDRIVE FOLDER FILE LIST
          → Needed for dynamically loading GLTF models
    -----------------------------------------------------*/
    getDriveFolderFiles: async (folderPath) => {
        const token = await getAccessToken();
        const encoded = encodeURIComponent(folderPath);

        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encoded}:/children`;

        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return res.data.value; // list of files/folders
    },

    /* ----------------------------------------------------
       6. ⭐ GET SINGLE FILE INFO (Optional)
    -----------------------------------------------------*/
    getDriveFile: async (filePath) => {
        const token = await getAccessToken();
        const encoded = encodeURIComponent(filePath);

        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encoded}`;

        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return res.data; // includes @microsoft.graph.downloadUrl
    },

    /* ----------------------------------------------------
       7. Upload file to OneDrive, return download URL
    -----------------------------------------------------*/
    uploadFile: async (filePath, buffer, mimeType) => {
        const token = await getAccessToken();
        const encoded = encodeURIComponent(filePath);

        const url = `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive/root:${encoded}:/content`;

        const res = await axios.put(url, buffer, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": mimeType || "application/octet-stream",
            },
        });

        // Return the public download URL
        return res.data["@microsoft.graph.downloadUrl"] || res.data.webUrl || "";
    },
};

module.exports = graphHelper;
