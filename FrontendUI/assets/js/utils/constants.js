// assets/js/utils/constants.js


// assets/js/utils/constants.js

// API 配置
const API_CONFIG = {
    // 使用者認證 API (UserAuthAPI)
    //AUTH_BASE_URL: 'http://localhost:49305',
    //AUTH_API: '/api/auth',

    // 檔案管理 API (FileManagementAPI)  
    FILES_BASE_URL: 'http://localhost:50426',
    FILES_API: '/api/files',
    RECYCLE_API: '/api/recyclebin',
    PREVIEW_API: '/api/filepreview',

    // 向後相容性 - 預設使用檔案管理 API
    BASE_URL: 'http://localhost:50426'
};

// 檔案配置
const FILE_CONFIG = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: [
        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv',
        'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac',
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ],
    PAGE_SIZE: 50
};

// UI 配置
const UI_CONFIG = {
    TOAST_DURATION: 3000,
    LOADING_DELAY: 300,
    ANIMATION_DURATION: 300
};

// 訊息文字
const MESSAGES = {
    SUCCESS: {
        LOGIN: '登入成功',
        REGISTER: '註冊成功',
        UPLOAD: '檔案上傳成功',
        DELETE: '檔案已移至資源回收筒',
        RESTORE: '檔案還原成功',
        RENAME: '檔案重新命名成功',
        LOGOUT: '已登出'
    },
    ERROR: {
        LOGIN_FAILED: '登入失敗，請檢查帳號密碼',
        REGISTER_FAILED: '註冊失敗',
        UPLOAD_FAILED: '檔案上傳失敗',
        DELETE_FAILED: '刪除檔案失敗',
        RESTORE_FAILED: '還原檔案失敗',
        RENAME_FAILED: '重新命名失敗',
        NETWORK_ERROR: '網路連線錯誤',
        FILE_TOO_LARGE: '檔案大小超過限制',
        INVALID_FILE_TYPE: '不支援的檔案類型',
        NO_FILE_SELECTED: '請選擇檔案',
        UNAUTHORIZED: '請先登入',
        AUTH_API_ERROR: '使用者認證服務連線失敗',
        FILES_API_ERROR: '檔案管理服務連線失敗'
    }
};

// 環境配置 - 用於檢測開發/生產環境
const ENVIRONMENT = {
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

    // 取得當前環境的 API 配置
    getApiConfig() {
        if (this.isDevelopment) {
            return {
                /*authBaseUrl: 'http://localhost:49305',*/
                filesBaseUrl: 'http://localhost:50426'
            };
        } else {
            // 生產環境配置
            return {
                /*authBaseUrl: window.location.protocol + '//' + window.location.host,*/
                filesBaseUrl: window.location.protocol + '//' + window.location.host
            };
        }
    }
};

// 提供全局 process 物件以避免錯誤
if (typeof process === 'undefined') {
    window.process = {
        env: {
            NODE_ENV: ENVIRONMENT.isDevelopment ? 'development' : 'production'
        }
    };
}

// 服務狀態檢查
const SERVICE_STATUS = {
    authService: false,
    filesService: false,

    // 檢查認證服務狀態
    async checkAuthService() {
        try {
            const response = await fetch(`${API_CONFIG.AUTH_BASE_URL}/api/test/ping`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.authService = data.Success;
                console.log('✅ 認證服務回應:', data);
                return data.Success;
            } else {
                console.warn('❌ 認證服務回應錯誤:', response.status, response.statusText);
                this.authService = false;
                return false;
            }
        } catch (error) {
            console.warn('❌ 認證服務連線失敗:', error.message);
            this.authService = false;
            return false;
        }
    },

    // 檢查檔案服務狀態
    async checkFilesService() {
        try {
            const response = await fetch(`${API_CONFIG.FILES_BASE_URL}/api/test/ping`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.filesService = data.Success;
                console.log('✅ 檔案服務回應:', data);
                return data.Success;
            } else {
                console.warn('❌ 檔案服務回應錯誤:', response.status, response.statusText);
                this.filesService = false;
                return false;
            }
        } catch (error) {
            console.warn('❌ 檔案服務連線失敗:', error.message);
            this.filesService = false;
            return false;
        }
    },

    // 檢查所有服務
    async checkAllServices() {
        console.log('🔍 開始檢查服務狀態...');

        const [authResult, filesResult] = await Promise.allSettled([
            this.checkAuthService(),
            this.checkFilesService()
        ]);

        //console.log('📊 服務狀態檢查結果:');
        //console.log('- 認證服務 (UserAuthAPI):', this.authService ? '✅ 正常' : '❌ 異常');
        //console.log('- 檔案服務 (FileManagementAPI):', this.filesService ? '✅ 正常' : '❌ 異常');

        //if (!this.authService) {
        //    console.error('💡 認證服務問題可能原因:');
        //    console.error('   1. UserAuthAPI 沒有運行在 49305 端口');
        //    console.error('   2. 缺少測試端點 /api/test/ping');
        //    console.error('   3. CORS 設定問題');
        //}

        if (!this.filesService) {
            console.error('💡 檔案服務問題可能原因:');
            console.error('   1. FileManagementAPI 沒有運行在 50426 端口');
            console.error('   2. 缺少測試端點 /api/test/ping');
            console.error('   3. CORS 設定問題');
        }

        return {
            /*auth: this.authService,*/
            files: this.filesService,
            /*overall: this.authService && this.filesService*/
        };
    }
};

// 確保所有常數都可在全域使用
window.API_CONFIG = API_CONFIG;
window.FILE_CONFIG = FILE_CONFIG;
window.UI_CONFIG = UI_CONFIG;
window.MESSAGES = MESSAGES;
window.ENVIRONMENT = ENVIRONMENT;
window.SERVICE_STATUS = SERVICE_STATUS;

// 初始化提示
console.log('📦 常數載入完成');
console.log('環境:', process.env.NODE_ENV);
console.log('API 配置:', {
    /*auth: API_CONFIG.AUTH_BASE_URL,*/
    files: API_CONFIG.FILES_BASE_URL
});







//// 修復後的 constants.js - 使用正確的測試端點
//const API_CONFIG = {
//    // 使用者認證 API (UserAuthAPI)
//    //AUTH_BASE_URL: 'http://localhost:49305',
//    //AUTH_API: '/api/auth',

//    // 檔案管理 API (FileManagementAPI)
//    FILES_BASE_URL: 'http://localhost:50426',
//    FILES_API: '/api/files',
//    RECYCLE_API: '/api/recyclebin',
//    PREVIEW_API: '/api/filepreview',

//    // 向後相容性 - 預設使用檔案管理 API
//    BASE_URL: 'http://localhost:50426'
//};

//// 服務狀態檢查 - 修復版本
//const SERVICE_STATUS = {
//    authService: false,
//    filesService: false,

//    // 檢查認證服務狀態
//    async checkAuthService() {
//        try {
//            const response = await fetch(`${API_CONFIG.AUTH_BASE_URL}/api/test/ping`, {
//                method: 'GET',
//                mode: 'cors',
//                headers: {
//                    'Content-Type': 'application/json'
//                }
//            });

//            if (response.ok) {
//                const data = await response.json();
//                this.authService = data.Success;
//                console.log('✅ 認證服務回應:', data);
//                return data.Success;
//            } else {
//                console.warn('❌ 認證服務回應錯誤:', response.status, response.statusText);
//                this.authService = false;
//                return false;
//            }
//        } catch (error) {
//            console.warn('❌ 認證服務連線失敗:', error.message);
//            this.authService = false;
//            return false;
//        }
//    },

//    // 檢查檔案服務狀態
//    async checkFilesService() {
//        try {
//            const response = await fetch(`${API_CONFIG.FILES_BASE_URL}/api/test/ping`, {
//                method: 'GET',
//                mode: 'cors',
//                headers: {
//                    'Content-Type': 'application/json'
//                }
//            });

//            if (response.ok) {
//                const data = await response.json();
//                this.filesService = data.Success;
//                console.log('✅ 檔案服務回應:', data);
//                return data.Success;
//            } else {
//                console.warn('❌ 檔案服務回應錯誤:', response.status, response.statusText);
//                this.filesService = false;
//                return false;
//            }
//        } catch (error) {
//            console.warn('❌ 檔案服務連線失敗:', error.message);
//            this.filesService = false;
//            return false;
//        }
//    },

//    // 檢查所有服務
//    async checkAllServices() {
//        console.log('🔍 開始檢查服務狀態...');

//        const [authResult, filesResult] = await Promise.allSettled([
//            this.checkAuthService(),
//            this.checkFilesService()
//        ]);

//        console.log('📊 服務狀態檢查結果:');
//        console.log('- 認證服務 (UserAuthAPI):', this.authService ? '✅ 正常' : '❌ 異常');
//        console.log('- 檔案服務 (FileManagementAPI):', this.filesService ? '✅ 正常' : '❌ 異常');

//        if (!this.authService) {
//            console.error('💡 認證服務問題可能原因:');
//            console.error('   1. UserAuthAPI 沒有運行在 49305 端口');
//            console.error('   2. 缺少測試端點 /api/test/ping');
//            console.error('   3. CORS 設定問題');
//        }

//        if (!this.filesService) {
//            console.error('💡 檔案服務問題可能原因:');
//            console.error('   1. FileManagementAPI 沒有運行在 50426 端口');
//            console.error('   2. 缺少測試端點 /api/test/ping');
//            console.error('   3. CORS 設定問題');
//        }

//        return {
//            auth: this.authService,
//            files: this.filesService,
//            overall: this.authService && this.filesService
//        };
//    }
//};



// 修復後的 api.js 測試功能
//const APITest = {
//    // 測試認證服務連線
//    async testAuthService() {
//        try {
//            console.log('🔍 測試認證服務連線...');
//            const response = await fetch(`${API_CONFIG.AUTH_BASE_URL}/api/test/ping`, {
//                method: 'GET',
//                mode: 'cors',
//                headers: {
//                    'Content-Type': 'application/json'
//                }
//            });

//            if (response.ok) {
//                const data = await response.json();
//                console.log('✅ 認證服務連線正常:', data);
//                return true;
//            } else {
//                console.error('❌ 認證服務回應錯誤:', response.status, response.statusText);
//                return false;
//            }
//        } catch (error) {
//            console.error('❌ 認證服務連線失敗:', error);
//            return false;
//        }
//    },

//    // 測試檔案服務連線
//    async testFilesService() {
//        try {
//            console.log('🔍 測試檔案服務連線...');
//            const response = await fetch(`${API_CONFIG.FILES_BASE_URL}/api/test/ping`, {
//                method: 'GET',
//                mode: 'cors',
//                headers: {
//                    'Content-Type': 'application/json'
//                }
//            });

//            if (response.ok) {
//                const data = await response.json();
//                console.log('✅ 檔案服務連線正常:', data);
//                return true;
//            } else {
//                console.error('❌ 檔案服務回應錯誤:', response.status, response.statusText);
//                return false;
//            }
//        } catch (error) {
//            console.error('❌ 檔案服務連線失敗:', error);
//            return false;
//        }
//    },

//    // 測試所有服務
//    async testAllServices() {
//        console.log('🚀 開始 API 服務連線測試...');

//        const authOk = await this.testAuthService();
//        const filesOk = await this.testFilesService();

//        const overall = authOk && filesOk;

//        console.log('📊 API 服務測試結果:');
//        console.log(`- UserAuthAPI (${API_CONFIG.AUTH_BASE_URL}): ${authOk ? '✅ 正常' : '❌ 異常'}`);
//        console.log(`- FileManagementAPI (${API_CONFIG.FILES_BASE_URL}): ${filesOk ? '✅ 正常' : '❌ 異常'}`);
//        console.log(`- 整體狀態: ${overall ? '✅ 所有服務正常' : '❌ 部分服務異常'}`);

//        if (!overall) {
//            console.log('🔧 故障排除建議:');
//            console.log('1. 確認兩個 API 專案都在 Visual Studio 中啟動');
//            console.log('2. 檢查防火牆是否阻止了端口 49305 和 50426');
//            console.log('3. 確認後端已加入測試控制器');
//            console.log('4. 檢查後端的 CORS 設定');
//        }

//        return { auth: authOk, files: filesOk, overall };
//    },

//    // 測試註冊功能（不實際註冊）
//    async testRegisterEndpoint() {
//        try {
//            console.log('🧪 測試註冊端點...');

//            // 發送一個無效的請求來測試端點是否存在
//            const response = await fetch(`${API_CONFIG.AUTH_BASE_URL}/api/auth/register`, {
//                method: 'POST',
//                mode: 'cors',
//                headers: {
//                    'Content-Type': 'application/json'
//                },
//                body: JSON.stringify({}) // 空物件，會觸發驗證錯誤但不會實際註冊
//            });

//            // 我們期望得到 400 錯誤或驗證錯誤，這表示端點存在
//            if (response.status === 400 || response.status === 422) {
//                console.log('✅ 註冊端點存在且正常運作');
//                return true;
//            } else if (response.status === 404) {
//                console.error('❌ 註冊端點不存在');
//                return false;
//            } else {
//                console.log('⚠️ 註冊端點回應異常狀態:', response.status);
//                return false;
//            }
//        } catch (error) {
//            console.error('❌ 測試註冊端點失敗:', error);
//            return false;
//        }
//    }
//};








//const API_CONFIG = {
//    // 使用者認證 API (UserAuthAPI)
//    AUTH_BASE_URL: 'http://localhost:49305',
//    AUTH_API: '/api/auth',

//    // 檔案管理 API (FileManagementAPI)
//    FILES_BASE_URL: 'http://localhost:50426',
//    FILES_API: '/api/files',
//    RECYCLE_API: '/api/recyclebin',
//    PREVIEW_API: '/api/filepreview',

//    // 向後相容性 - 預設使用檔案管理 API
//    BASE_URL: 'http://localhost:50426'
//};

//const FILE_CONFIG = {
//    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
//    ALLOWED_TYPES: [
//        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml',
//        'application/pdf',
//        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//        'text/plain', 'text/csv',
//        'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv',
//        'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac',
//        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
//    ],
//    PAGE_SIZE: 50
//};

//const UI_CONFIG = {
//    TOAST_DURATION: 3000,
//    LOADING_DELAY: 300,
//    ANIMATION_DURATION: 300
//};

//const MESSAGES = {
//    SUCCESS: {
//        LOGIN: '登入成功',
//        REGISTER: '註冊成功',
//        UPLOAD: '檔案上傳成功',
//        DELETE: '檔案已移至資源回收筒',
//        RESTORE: '檔案還原成功',
//        RENAME: '檔案重新命名成功',
//        LOGOUT: '已登出'
//    },
//    ERROR: {
//        LOGIN_FAILED: '登入失敗，請檢查帳號密碼',
//        REGISTER_FAILED: '註冊失敗',
//        UPLOAD_FAILED: '檔案上傳失敗',
//        DELETE_FAILED: '刪除檔案失敗',
//        RESTORE_FAILED: '還原檔案失敗',
//        RENAME_FAILED: '重新命名失敗',
//        NETWORK_ERROR: '網路連線錯誤',
//        FILE_TOO_LARGE: '檔案大小超過限制',
//        INVALID_FILE_TYPE: '不支援的檔案類型',
//        NO_FILE_SELECTED: '請選擇檔案',
//        UNAUTHORIZED: '請先登入',
//        AUTH_API_ERROR: '使用者認證服務連線失敗',
//        FILES_API_ERROR: '檔案管理服務連線失敗'
//    }
//};

//// API 端點建構函數
//const API_ENDPOINTS = {
//    // 使用者認證相關
//    auth: {
//        login: () => `${API_CONFIG.AUTH_BASE_URL}${API_CONFIG.AUTH_API}/login`,
//        register: () => `${API_CONFIG.AUTH_BASE_URL}${API_CONFIG.AUTH_API}/register`,
//        logout: () => `${API_CONFIG.AUTH_BASE_URL}${API_CONFIG.AUTH_API}/logout`
//    },

//    // 檔案管理相關
//    files: {
//        list: () => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.FILES_API}/list`,
//        upload: () => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.FILES_API}/upload`,
//        download: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.FILES_API}/download/${id}`,
//        rename: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.FILES_API}/rename/${id}`,
//        delete: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.FILES_API}/${id}`,
//        preview: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.FILES_API}/preview/${id}`,
//        statistics: () => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.FILES_API}/statistics`,
//        batchOperation: () => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.FILES_API}/batch-operation`
//    },

//    // 資源回收筒相關
//    recycle: {
//        list: () => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.RECYCLE_API}/list`,
//        restore: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.RECYCLE_API}/restore/${id}`,
//        permanentDelete: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.RECYCLE_API}/permanent/${id}`,
//        cleanup: () => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.RECYCLE_API}/cleanup`
//    },

//    // 檔案預覽相關
//    preview: {
//        info: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.PREVIEW_API}/${id}`,
//        thumbnail: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.PREVIEW_API}/thumbnail/${id}`,
//        content: (id) => `${API_CONFIG.FILES_BASE_URL}${API_CONFIG.PREVIEW_API}/content/${id}`
//    }
//};

//// 服務狀態檢查
//const SERVICE_STATUS = {
//    authService: false,
//    filesService: false,

//    // 檢查認證服務狀態
//    async checkAuthService() {
//        try {
//            const response = await fetch(`${API_CONFIG.AUTH_BASE_URL}/api/auth/ping`, {
//                method: 'GET',
//                timeout: 5000
//            });
//            this.authService = response.ok;
//            return response.ok;
//        } catch (error) {
//            console.warn('認證服務連線失敗:', error);
//            this.authService = false;
//            return false;
//        }
//    },

//    // 檢查檔案服務狀態
//    async checkFilesService() {
//        try {
//            const response = await fetch(`${API_CONFIG.FILES_BASE_URL}/api/files/ping`, {
//                method: 'GET',
//                timeout: 5000
//            });
//            this.filesService = response.ok;
//            return response.ok;
//        } catch (error) {
//            console.warn('檔案服務連線失敗:', error);
//            this.filesService = false;
//            return false;
//        }
//    },

//    // 檢查所有服務
//    async checkAllServices() {
//        const results = await Promise.allSettled([
//            this.checkAuthService(),
//            this.checkFilesService()
//        ]);

//        console.log('服務狀態檢查結果:');
//        console.log('- 認證服務 (UserAuthAPI):', this.authService ? '✅ 正常' : '❌ 異常');
//        console.log('- 檔案服務 (FileManagementAPI):', this.filesService ? '✅ 正常' : '❌ 異常');

//        return {
//            auth: this.authService,
//            files: this.filesService,
//            overall: this.authService && this.filesService
//        };
//    }
//};

//// 環境檢測
//const ENVIRONMENT = {
//    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

//    // 取得當前環境的 API 配置
//    getApiConfig() {
//        if (this.isDevelopment) {
//            return {
//                authBaseUrl: 'http://localhost:49305',
//                filesBaseUrl: 'http://localhost:50426'
//            };
//        } else {
//            // 生產環境配置
//            return {
//                authBaseUrl: window.location.protocol + '//' + window.location.host,
//                filesBaseUrl: window.location.protocol + '//' + window.location.host
//            };
//        }
//    }
//};

//// 初始化檢查
//document.addEventListener('DOMContentLoaded', async function () {
//    console.log('🔧 API 配置初始化');
//    console.log('認證服務:', API_CONFIG.AUTH_BASE_URL);
//    console.log('檔案服務:', API_CONFIG.FILES_BASE_URL);

//    // 在開發環境下檢查服務狀態
//    if (ENVIRONMENT.isDevelopment) {
//        console.log('🔍 檢查服務狀態...');
//        await SERVICE_STATUS.checkAllServices();
//    }
//});

//// 匯出給其他檔案使用
//if (typeof module !== 'undefined' && module.exports) {
//    module.exports = {
//        API_CONFIG,
//        FILE_CONFIG,
//        UI_CONFIG,
//        MESSAGES,
//        API_ENDPOINTS,
//        SERVICE_STATUS,
//        ENVIRONMENT
//    };
//}






//const API_CONFIG = {
//    BASE_URL: 'http://localhost:49305', // 請根據實際部署調整
//    AUTH_API: '/api/auth',
//    FILES_API: ':50426/api/files',
//    RECYCLE_API: ':50426/api/recyclebin',
//    PREVIEW_API: ':50426/api/filepreview'
//};

//const FILE_CONFIG = {
//    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
//    ALLOWED_TYPES: [
//        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml',
//        'application/pdf',
//        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//        'text/plain', 'text/csv',
//        'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv',
//        'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac',
//        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
//    ],
//    PAGE_SIZE: 50
//};

//const UI_CONFIG = {
//    TOAST_DURATION: 3000,
//    LOADING_DELAY: 300,
//    ANIMATION_DURATION: 300
//};

//const MESSAGES = {
//    SUCCESS: {
//        LOGIN: '登入成功',
//        REGISTER: '註冊成功',
//        UPLOAD: '檔案上傳成功',
//        DELETE: '檔案已移至資源回收筒',
//        RESTORE: '檔案還原成功',
//        RENAME: '檔案重新命名成功',
//        LOGOUT: '已登出'
//    },
//    ERROR: {
//        LOGIN_FAILED: '登入失敗，請檢查帳號密碼',
//        REGISTER_FAILED: '註冊失敗',
//        UPLOAD_FAILED: '檔案上傳失敗',
//        DELETE_FAILED: '刪除檔案失敗',
//        RESTORE_FAILED: '還原檔案失敗',
//        RENAME_FAILED: '重新命名失敗',
//        NETWORK_ERROR: '網路連線錯誤',
//        FILE_TOO_LARGE: '檔案大小超過限制',
//        INVALID_FILE_TYPE: '不支援的檔案類型',
//        NO_FILE_SELECTED: '請選擇檔案',
//        UNAUTHORIZED: '請先登入'
//    }
//};