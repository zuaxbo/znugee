/**
 * 主應用程式初始化
 * 負責初始化整個 Vue 應用程式和相關配置
 */

// ==========================================
// Vue 組件註冊
// ==========================================

// 註冊所有 Vue 組件
Vue.component('file-manager', httpVueLoader('components/FileManager.vue'));
Vue.component('file-grid', httpVueLoader('components/FileGrid.vue'));
Vue.component('file-list', httpVueLoader('components/FileList.vue'));
Vue.component('file-upload', httpVueLoader('components/FileUpload.vue'));
Vue.component('file-preview', httpVueLoader('components/FilePreview.vue'));
Vue.component('file-rename', httpVueLoader('components/FileRename.vue'));
Vue.component('context-menu', httpVueLoader('components/ContextMenu.vue'));
Vue.component('recycle-bin', httpVueLoader('components/RecycleBin.vue'));
Vue.component('confirm-dialog', httpVueLoader('components/ConfirmDialog.vue'));
Vue.component('common-components', httpVueLoader('components/Common.vue'));

console.log('📦 Vue 組件註冊完成');

// ==========================================
// Axios 全域配置
// ==========================================

// 設定 Axios 預設配置
axios.defaults.baseURL = API_CONFIG.baseUrl;
axios.defaults.timeout = API_CONFIG.request.timeout;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Axios 請求攔截器
axios.interceptors.request.use(
    function (config) {
        // 在發送請求之前做些什麼
        if (API_CONFIG.debug) {
            console.log('🌐 API Request:', {
                method: config.method.toUpperCase(),
                url: config.url,
                params: config.params,
                data: config.data
            });
        }

        // 可以在這裡添加 Authorization token
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }

        // 添加請求時間戳用於統計
        config.metadata = { startTime: new Date() };

        return config;
    },
    function (error) {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Axios 響應攔截器
axios.interceptors.response.use(
    function (response) {
        // 計算請求時間
        if (response.config.metadata) {
            const duration = new Date() - response.config.metadata.startTime;
            if (API_CONFIG.debug) {
                console.log('✅ API Response:', {
                    method: response.config.method.toUpperCase(),
                    url: response.config.url,
                    status: response.status,
                    duration: `${duration}ms`,
                    data: response.data
                });
            }
        }

        return response;
    },
    function (error) {
        // 統一錯誤處理
        if (API_CONFIG.debug) {
            console.error('❌ API Error:', {
                method: error.config?.method?.toUpperCase(),
                url: error.config?.url,
                status: error.response?.status,
                message: error.message,
                data: error.response?.data
            });
        }

        // 根據錯誤狀態碼顯示對應訊息
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.warn('🔐 認證失效，請重新登入');
                    // 可以跳轉到登入頁面
                    break;
                case 403:
                    console.warn('🚫 沒有權限執行此操作');
                    break;
                case 404:
                    console.warn('❓ 請求的資源不存在');
                    break;
                case 429:
                    console.warn('⏰ 請求過於頻繁，請稍後再試');
                    break;
                case 500:
                case 502:
                case 503:
                    console.warn('🔧 伺服器錯誤，請稍後再試');
                    break;
            }
        } else if (error.request) {
            console.warn('🌐 網路連接錯誤，請檢查網路設定');
        } else {
            console.warn('⚙️ 請求配置錯誤');
        }

        return Promise.reject(error);
    }
);

console.log('🌐 Axios 配置完成');

// ==========================================
// Vue 全域配置
// ==========================================

// Vue 全域混入
Vue.mixin({
    methods: {
        // 格式化檔案大小
        formatFileSize(bytes, decimals = 2) {
            return FileUtils.formatFileSize(bytes, decimals);
        },

        // 格式化日期
        formatDate(dateString, format = 'datetime') {
            return FormatUtils.formatDate(dateString, format);
        },

        // 獲取檔案圖標
        getFileIcon(fileName) {
            return FileUtils.buildIconPath(FileUtils.getFileIcon(fileName));
        },

        // 獲取檔案類型顏色
        getFileColor(fileName) {
            return FileUtils.getFileColor(fileName);
        },

        // 判斷是否為圖片
        isImage(fileName) {
            return FileUtils.isImage(fileName);
        },

        // 截取文字
        truncateText(text, maxLength = 20) {
            return FormatUtils.truncateText(text, maxLength);
        },

        // 顯示成功訊息
        showSuccess(message, duration = 3000) {
            this.$root.showMessage(message, 'success', duration);
        },

        // 顯示錯誤訊息
        showError(message, duration = 5000) {
            this.$root.showMessage(message, 'error', duration);
        },

        // 顯示警告訊息
        showWarning(message, duration = 4000) {
            this.$root.showMessage(message, 'warning', duration);
        },

        // 顯示資訊訊息
        showInfo(message, duration = 3000) {
            this.$root.showMessage(message, 'info', duration);
        },

        // 確認對話框
        async confirm(message, title = '確認', options = {}) {
            return new Promise((resolve) => {
                this.$root.showConfirmDialog(message, title, options, resolve);
            });
        },

        // 設定載入狀態
        setLoading(status, message = '') {
            this.$root.setGlobalLoading(status, message);
        },

        // 導航到指定路由
        navigate(route) {
            this.$root.navigate(route);
        },

        // 複製文字到剪貼板
        async copyToClipboard(text) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    // 降級方案
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return successful;
                }
            } catch (error) {
                console.error('複製到剪貼板失敗:', error);
                return false;
            }
        }
    }
});

// Vue 全域過濾器
Vue.filter('fileSize', function (bytes) {
    return FileUtils.formatFileSize(bytes);
});

Vue.filter('formatDate', function (dateString, format = 'datetime') {
    return FormatUtils.formatDate(dateString, format);
});

Vue.filter('truncate', function (text, length = 20) {
    return FormatUtils.truncateText(text, length);
});

Vue.filter('percentage', function (value, decimals = 1) {
    return FormatUtils.formatPercentage(value, decimals);
});

console.log('🎛️ Vue 全域配置完成');

// ==========================================
// 全域事件總線
// ==========================================

const EventBus = new Vue();
Vue.prototype.$eventBus = EventBus;

console.log('📡 事件總線初始化完成');

// ==========================================
// 路由管理
// ==========================================

const routes = {
    '/': 'file-manager',
    '/recycle-bin': 'recycle-bin'
};

function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return routes[hash] || 'file-manager';
}

function setPageTitle(route) {
    const titles = {
        'file-manager': '檔案管理',
        'recycle-bin': '回收筒'
    };
    document.title = `${titles[route] || '檔案管理'} - 檔案管理系統`;
}

console.log('🛣️ 路由系統初始化完成');

// ==========================================
// 主 Vue 實例
// ==========================================

const app = new Vue({
    el: '#app',
    data: {
        // 當前路由組件
        currentView: getCurrentRoute(),

        // 全域載入狀態
        isLoading: false,
        loadingMessage: '',

        // 全域訊息
        successMessage: '',
        errorMessage: '',
        warningMessage: '',
        infoMessage: '',

        // 用戶資訊
        currentUser: null,
        userPreferences: null,

        // 應用程式狀態
        isBackendAvailable: true,
        lastBackendCheck: null,

        // 確認對話框
        confirmDialog: {
            show: false,
            title: '',
            message: '',
            options: {},
            resolve: null
        }
    },

    computed: {
        // 當前組件名稱
        currentComponent() {
            return this.currentView;
        },

        // 是否顯示後端不可用提示
        showBackendWarning() {
            return !this.isBackendAvailable && API_CONFIG.isDevelopment;
        },

        // 用戶顯示名稱
        userDisplayName() {
            return this.currentUser?.displayName || this.currentUser?.username || '訪客';
        },

        // 是否已登入
        isLoggedIn() {
            return !!this.currentUser;
        }
    },

    methods: {
        // ==========================================
        // 路由管理
        // ==========================================

        /**
         * 導航到指定路由
         * @param {string} route - 路由路徑
         */
        navigate(route) {
            if (this.currentView !== routes[route]) {
                window.location.hash = route;
                this.currentView = getCurrentRoute();
                setPageTitle(this.currentView);

                console.log('🛣️ 導航到:', route, '→', this.currentView);

                // 觸發路由變更事件
                this.$eventBus.$emit('route-changed', {
                    from: this.currentView,
                    to: routes[route],
                    route: route
                });
            }
        },

        // ==========================================
        // 全域訊息管理
        // ==========================================

        /**
         * 顯示訊息
         * @param {string} message - 訊息內容
         * @param {string} type - 訊息類型
         * @param {number} duration - 顯示時間（毫秒）
         */
        showMessage(message, type = 'info', duration = 3000) {
            if (!message) return;

            // 清除其他訊息
            this.clearMessages();

            // 設定對應類型的訊息
            switch (type) {
                case 'success':
                    this.successMessage = message;
                    break;
                case 'error':
                    this.errorMessage = message;
                    duration = duration || 5000; // 錯誤訊息預設顯示更久
                    break;
                case 'warning':
                    this.warningMessage = message;
                    duration = duration || 4000;
                    break;
                case 'info':
                default:
                    this.infoMessage = message;
                    break;
            }

            console.log(`📢 ${type.toUpperCase()}:`, message);

            // 自動清除訊息
            if (duration > 0) {
                setTimeout(() => {
                    this.clearMessage(type);
                }, duration);
            }

            // 觸發訊息事件
            this.$eventBus.$emit('message-shown', { message, type, duration });
        },

        /**
         * 清除指定類型的訊息
         * @param {string} type - 訊息類型
         */
        clearMessage(type) {
            switch (type) {
                case 'success':
                    this.successMessage = '';
                    break;
                case 'error':
                    this.errorMessage = '';
                    break;
                case 'warning':
                    this.warningMessage = '';
                    break;
                case 'info':
                    this.infoMessage = '';
                    break;
            }
        },

        /**
         * 清除所有訊息
         */
        clearMessages() {
            this.successMessage = '';
            this.errorMessage = '';
            this.warningMessage = '';
            this.infoMessage = '';
        },

        /**
         * 清除成功訊息
         */
        clearSuccess() {
            this.clearMessage('success');
        },

        /**
         * 清除錯誤訊息
         */
        clearError() {
            this.clearMessage('error');
        },

        // ==========================================
        // 全域載入狀態
        // ==========================================

        /**
         * 設定全域載入狀態
         * @param {boolean} status - 載入狀態
         * @param {string} message - 載入訊息
         */
        setGlobalLoading(status, message = '') {
            this.isLoading = status;
            this.loadingMessage = message || (status ? '載入中...' : '');

            if (status) {
                console.log('⏳ 開始載入:', message);
            } else {
                console.log('✅ 載入完成');
            }

            // 觸發載入狀態變更事件
            this.$eventBus.$emit('loading-changed', { isLoading: status, message });
        },

        // ==========================================
        // 確認對話框
        // ==========================================

        /**
         * 顯示確認對話框
         * @param {string} message - 確認訊息
         * @param {string} title - 對話框標題
         * @param {object} options - 選項
         * @param {function} resolve - 回調函數
         */
        showConfirmDialog(message, title = '確認', options = {}, resolve = null) {
            this.confirmDialog = {
                show: true,
                title: title,
                message: message,
                options: {
                    confirmText: '確定',
                    cancelText: '取消',
                    type: 'confirm',
                    ...options
                },
                resolve: resolve
            };
        },

        /**
         * 處理確認對話框結果
         * @param {boolean} result - 確認結果
         */
        handleConfirmResult(result) {
            if (this.confirmDialog.resolve) {
                this.confirmDialog.resolve(result);
            }
            this.confirmDialog.show = false;
            this.confirmDialog.resolve = null;
        },

        // ==========================================
        // 用戶管理
        // ==========================================

        /**
         * 載入用戶資訊
         */
        async loadUserInfo() {
            try {
                const result = await UserService.getCurrentUser();
                if (result.success) {
                    this.currentUser = result.user;
                    console.log('👤 用戶資訊載入成功:', this.currentUser);
                } else {
                    console.warn('⚠️ 用戶資訊載入失敗:', result.message);
                }
            } catch (error) {
                console.error('❌ 載入用戶資訊時發生錯誤:', error);
            }
        },

        /**
         * 載入用戶偏好設定
         */
        async loadUserPreferences() {
            try {
                const result = await UserService.getUserPreferences();
                if (result.success) {
                    this.userPreferences = result.preferences;
                    this.applyUserPreferences();
                    console.log('⚙️ 用戶偏好設定載入成功:', this.userPreferences);
                } else {
                    console.warn('⚠️ 偏好設定載入失敗:', result.message);
                }
            } catch (error) {
                console.error('❌ 載入偏好設定時發生錯誤:', error);
            }
        },

        /**
         * 應用用戶偏好設定
         */
        applyUserPreferences() {
            if (!this.userPreferences) return;

            // 應用主題設定
            if (this.userPreferences.theme) {
                this.applyTheme(this.userPreferences.theme);
            }

            // 應用語言設定
            if (this.userPreferences.language) {
                document.documentElement.lang = this.userPreferences.language;
            }

            // 觸發偏好設定應用事件
            this.$eventBus.$emit('preferences-applied', this.userPreferences);
        },

        /**
         * 應用主題
         * @param {string} theme - 主題名稱
         */
        applyTheme(theme) {
            const body = document.body;
            body.classList.remove('theme-light', 'theme-dark');

            if (theme === 'dark') {
                body.classList.add('theme-dark');
            } else if (theme === 'light') {
                body.classList.add('theme-light');
            } else {
                // auto theme - 根據系統偏好
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    body.classList.add('theme-dark');
                } else {
                    body.classList.add('theme-light');
                }
            }

            console.log('🎨 主題已應用:', theme);
        },

        // ==========================================
        // 後端狀態管理
        // ==========================================

        /**
         * 檢查後端可用性
         */
        async checkBackendHealth() {
            try {
                const isHealthy = await FileService.checkBackendHealth();
                this.isBackendAvailable = isHealthy;
                this.lastBackendCheck = new Date();

                if (isHealthy) {
                    console.log('💚 後端服務正常');
                } else {
                    console.warn('💔 後端服務不可用');
                }

                return isHealthy;
            } catch (error) {
                console.error('❌ 後端健康檢查失敗:', error);
                this.isBackendAvailable = false;
                return false;
            }
        },

        /**
         * 定期檢查後端狀態
         */
        startBackendHealthCheck() {
            // 立即檢查一次
            this.checkBackendHealth();

            // 每30秒檢查一次
            setInterval(() => {
                this.checkBackendHealth();
            }, 30000);

            console.log('🔄 後端健康檢查已啟動');
        },

        // ==========================================
        // 應用程式生命週期
        // ==========================================

        /**
         * 初始化應用程式
         */
        async initializeApp() {
            console.log('🚀 開始初始化應用程式...');

            this.setGlobalLoading(true, '正在初始化應用程式...');

            try {
                // 設定頁面標題
                setPageTitle(this.currentView);

                // 載入用戶資訊
                await this.loadUserInfo();

                // 載入用戶偏好設定
                await this.loadUserPreferences();

                // 開始後端健康檢查
                if (API_CONFIG.isDevelopment) {
                    this.startBackendHealthCheck();
                }

                // 觸發應用程式初始化完成事件
                this.$eventBus.$emit('app-initialized');

                console.log('✅ 應用程式初始化完成');

            } catch (error) {
                console.error('❌ 應用程式初始化失敗:', error);
                this.showError('應用程式初始化失敗，請重新整理頁面');
            } finally {
                this.setGlobalLoading(false);
            }
        },

        /**
         * 應用程式清理
         */
        cleanup() {
            console.log('🧹 清理應用程式資源...');

            // 清除快取
            UserService.clearUserCache();
            PreviewService.clearPreviewCache();
            PreviewService.clearThumbnailCache();

            // 清除事件監聽器
            this.$eventBus.$off();

            console.log('✅ 應用程式清理完成');
        }
    },

    // ==========================================
    // 生命週期鉤子
    // ==========================================

    async created() {
        console.log('📦 Vue 實例創建完成');

        // 監聽路由變化
        window.addEventListener('hashchange', () => {
            this.currentView = getCurrentRoute();
            setPageTitle(this.currentView);
        });

        // 監聽頁面卸載
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // 監聽系統主題變化
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.userPreferences?.theme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }

        // 初始化應用程式
        await this.initializeApp();
    },

    mounted() {
        console.log('🎉 檔案管理系統已載入完成');

        // 顯示歡迎訊息
        if (API_CONFIG.isDevelopment) {
            this.showInfo('歡迎使用檔案管理系統！開發模式已啟用。');
        } else {
            this.showInfo('歡迎使用檔案管理系統！');
        }

        // 觸發應用程式掛載完成事件
        this.$eventBus.$emit('app-mounted');
    },

    beforeDestroy() {
        console.log('👋 Vue 實例即將銷毀');
        this.cleanup();
    }
});

// ==========================================
// 全域錯誤處理
// ==========================================

// Vue 全域錯誤處理
Vue.config.errorHandler = function (err, vm, info) {
    console.error('🔥 Vue Error:', err);
    console.error('📍 Error Info:', info);
    console.error('🎯 Component:', vm);

    // 顯示用戶友好的錯誤訊息
    if (app) {
        app.showError('應用程式發生錯誤，請重新整理頁面');
    }
};

// 全域未捕獲錯誤處理
window.addEventListener('error', function (event) {
    console.error('🌍 Global Error:', event.error);
    console.error('📄 Source:', event.filename + ':' + event.lineno + ':' + event.colno);

    if (app) {
        app.showError('系統發生未預期錯誤');
    }
});

// Promise 未捕獲錯誤處理
window.addEventListener('unhandledrejection', function (event) {
    console.error('🔗 Unhandled Promise Rejection:', event.reason);

    if (app) {
        app.showError('網路請求發生錯誤');
    }

    // 防止錯誤在控制台顯示
    event.preventDefault();
});

// ==========================================
// 開發環境配置
// ==========================================

if (API_CONFIG.isDevelopment) {
    // 開發環境下的配置
    Vue.config.debug = true;
    Vue.config.devtools = true;

    console.log('🛠️ 開發模式已啟用');
    console.log('📊 API 配置:', API_CONFIG);
    console.log('📏 常數定義:', CONSTANTS);

    // 將主要對象掛載到 window 供調試使用
    window.app = app;
    window.EventBus = EventBus;

} else {
    // 生產環境下的配置
    Vue.config.productionTip = false;
    Vue.config.debug = false;
    Vue.config.devtools = false;

    console.log('🌟 生產模式已啟用');
}

// ==========================================
// 應用程式啟動完成
// ==========================================

console.log('🎊 檔案管理系統應用程式啟動完成！');
console.log('📝 版本資訊:', {
    vue: Vue.version,
    axios: axios.VERSION,
    userAgent: navigator.userAgent
});

// 觸發應用程式啟動完成事件
document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM 載入完成');
    EventBus.$emit('app-ready');
});