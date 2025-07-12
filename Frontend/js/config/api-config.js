/**
 * API 配置文件
 * 定義所有後端 API 的基礎設定和端點
 */

const API_CONFIG = {
    // 後端 API 基礎 URL (後端完成後修改為實際地址)
    baseUrl: 'http://localhost:8080/api',

    // 開發模式標記 (後端完成後改為 false)
    isDevelopment: true,

    // API 端點定義
    endpoints: {
        // 檔案管理相關
        files: '/files',                    // GET, POST, PUT, DELETE /api/files
        fileById: '/files/{id}',           // GET, PUT, DELETE /api/files/{id}
        fileSearch: '/files/search',       // GET /api/files/search?q={query}

        // 檔案上傳相關
        upload: '/upload',                 // POST /api/upload
        uploadMultiple: '/upload/multiple', // POST /api/upload/multiple
        uploadProgress: '/upload/progress/{id}', // GET /api/upload/progress/{id}

        // 檔案預覽相關
        preview: '/preview',               // GET /api/preview/{id}
        thumbnail: '/thumbnail',           // GET /api/thumbnail/{id}
        download: '/download',             // GET /api/download/{id}

        // 檔案分享/熱連結相關
        hotlink: '/files/{id}/hotlink',    // GET, POST /api/files/{id}/hotlink
        share: '/share/{token}',           // GET /api/share/{token}

        // 回收筒相關
        recycleBin: '/recyclebin',         // GET /api/recyclebin
        restore: '/recyclebin/{id}/restore', // PUT /api/recyclebin/{id}/restore
        permanentDelete: '/recyclebin/{id}', // DELETE /api/recyclebin/{id}

        // 用戶相關
        users: '/users',                   // GET /api/users
        userProfile: '/users/profile',     // GET /api/users/profile

        // 系統相關
        health: '/health',                 // GET /api/health (檢查後端狀態)
        version: '/version'                // GET /api/version
    },

    // HTTP 請求設定
    request: {
        // 請求超時時間 (毫秒)
        timeout: 30000,

        // 重試次數
        retryCount: 3,

        // 重試間隔 (毫秒)
        retryDelay: 1000,

        // 預設 Headers
        defaultHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },

    // 檔案上傳設定
    upload: {
        // 最大檔案大小 (位元組) - 50MB
        maxFileSize: 50 * 1024 * 1024,

        // 分塊上傳大小 (位元組) - 1MB
        chunkSize: 1024 * 1024,

        // 允許的檔案類型 (MIME types)
        allowedTypes: [
            // 圖片類型
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'image/bmp', 'image/webp', 'image/svg+xml',

            // 文檔類型
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',

            // 文字類型
            'text/plain', 'text/csv', 'text/html', 'text/xml',

            // 壓縮檔案
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',

            // 影音類型
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
            'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac'
        ],

        // 同時上傳檔案數量限制
        maxConcurrentUploads: 3,

        // 上傳重試次數
        uploadRetryCount: 2
    },

    // 分頁設定
    pagination: {
        // 每頁顯示數量
        pageSize: 50,

        // 最大頁面大小
        maxPageSize: 100,

        // 無限滾動觸發距離 (像素)
        infiniteScrollThreshold: 200
    },

    // 快取設定
    cache: {
        // 檔案列表快取時間 (毫秒) - 5分鐘
        fileListCacheDuration: 5 * 60 * 1000,

        // 縮圖快取時間 (毫秒) - 30分鐘
        thumbnailCacheDuration: 30 * 60 * 1000,

        // 啟用快取
        enabled: true
    },

    // 預覽設定
    preview: {
        // 支援預覽的檔案類型
        supportedTypes: {
            image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
            pdf: ['pdf'],
            office: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
            text: ['txt', 'csv', 'html', 'xml', 'json'],
            video: ['mp4', 'webm', 'ogg'],
            audio: ['mp3', 'wav', 'ogg', 'aac']
        },

        // 預覽視窗最大尺寸
        maxWidth: 1200,
        maxHeight: 800
    },

    // 搜尋設定
    search: {
        // 搜尋輸入延遲 (毫秒)
        debounceDelay: 300,

        // 最小搜尋字元數
        minSearchLength: 2,

        // 搜尋結果高亮標籤
        highlightTag: 'mark'
    },

    // 錯誤處理設定
    error: {
        // 顯示錯誤訊息的時間 (毫秒)
        messageDisplayDuration: 5000,

        // 網路錯誤重試間隔 (毫秒)
        networkRetryDelay: 2000,

        // 自動隱藏成功訊息時間 (毫秒)
        successMessageDuration: 3000
    }
};

// 環境特定配置
if (API_CONFIG.isDevelopment) {
    // 開發環境設定
    console.log('🚀 檔案管理系統 - 開發模式');
    console.log('📡 等待後端服務:', API_CONFIG.baseUrl);

    // 開發模式下可以調整超時時間更長
    API_CONFIG.request.timeout = 60000;

    // 開發模式下啟用更詳細的日誌
    API_CONFIG.debug = true;
} else {
    // 生產環境設定
    console.log('🌟 檔案管理系統 - 生產模式');

    // 生產模式下關閉調試資訊
    API_CONFIG.debug = false;
}

// 工具函數：建立完整的 API URL
API_CONFIG.buildUrl = function (endpoint, params = {}) {
    let url = this.baseUrl + endpoint;

    // 替換 URL 中的參數佔位符
    Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key]);
    });

    return url;
};

// 工具函數：檢查檔案類型是否支援上傳
API_CONFIG.isFileTypeAllowed = function (mimeType) {
    return this.upload.allowedTypes.includes(mimeType);
};

// 工具函數：檢查檔案大小是否符合限制
API_CONFIG.isFileSizeAllowed = function (fileSize) {
    return fileSize <= this.upload.maxFileSize;
};

// 工具函數：檢查檔案是否支援預覽
API_CONFIG.isPreviewSupported = function (fileExtension) {
    const ext = fileExtension.toLowerCase();
    return Object.values(this.preview.supportedTypes).some(types => types.includes(ext));
};

// 導出配置對象
window.API_CONFIG = API_CONFIG;