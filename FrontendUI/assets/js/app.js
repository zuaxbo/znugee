// assets/js/app.js - 主應用程式入口

/**
 * 檔案管理系統 - 主應用程式
 * 
 * 功能：
 * - 全域配置和初始化
 * - 路由管理
 * - 狀態管理
 * - 事件總線
 * - 工具函數
 * - 錯誤處理
 */

// ================================
// 全域配置
// ================================
window.FileManagerApp = {
    // 應用程式版本
    version: '1.0.0',

    // 初始化狀態
    initialized: false,

    // 當前頁面
    currentPage: null,

    // 全域狀態
    state: {
        user: null,
        theme: 'light',
        language: 'zh-TW',
        settings: {}
    },

    // 事件總線
    eventBus: new Vue(),

    // 模組註冊表
    modules: {},

    // 工具函數
    utils: {}
};

// ================================
// 應用程式初始化
// ================================
window.FileManagerApp.init = function () {
    console.log('🚀 檔案管理系統啟動中...');

    try {
        // 1. 初始化全域設定
        this.initGlobalSettings();

        // 2. 初始化工具函數
        this.initUtils();

        // 3. 初始化事件監聽器
        this.initEventListeners();

        // 4. 初始化路由
        this.initRouting();

        // 5. 初始化主題
        this.initTheme();

        // 6. 初始化多語言
        this.initI18n();

        // 7. 檢查瀏覽器相容性
        this.checkBrowserCompatibility();

        // 8. 載入使用者設定
        this.loadUserSettings();

        // 標記為已初始化
        this.initialized = true;

        console.log('✅ 檔案管理系統初始化完成');

        // 觸發初始化完成事件
        this.eventBus.$emit('app:initialized');

    } catch (error) {
        console.error('❌ 應用程式初始化失敗:', error);
        this.showErrorMessage('應用程式初始化失敗，請重新整理頁面');
    }
};

// ================================
// 全域設定初始化
// ================================
window.FileManagerApp.initGlobalSettings = function () {
    // 設定 Vue 全域配置
    Vue.config.productionTip = false;
    Vue.config.devtools = process.env.NODE_ENV === 'development';

    // 設定全域錯誤處理
    Vue.config.errorHandler = (err, vm, info) => {
        console.error('Vue 錯誤:', err);
        console.error('組件:', vm);
        console.error('錯誤資訊:', info);

        this.handleVueError(err, vm, info);
    };

    // 設定全域警告處理
    Vue.config.warnHandler = (msg, vm, trace) => {
        console.warn('Vue 警告:', msg);
        console.warn('組件追蹤:', trace);
    };

    // 註冊全域組件
    this.registerGlobalComponents();

    // 註冊全域混入
    this.registerGlobalMixins();

    // 註冊全域指令
    this.registerGlobalDirectives();
};

// ================================
// 全域組件註冊
// ================================
window.FileManagerApp.registerGlobalComponents = function () {
    // 註冊通用組件
    Vue.component('app-modal', httpVueLoader('assets/js/components/Modal.vue'));
    Vue.component('app-search-bar', httpVueLoader('assets/js/components/SearchBar.vue'));
    Vue.component('app-pagination', httpVueLoader('assets/js/components/Pagination.vue'));

    // 註冊檔案相關組件
    Vue.component('file-upload', httpVueLoader('assets/js/components/FileUpload.vue'));
    Vue.component('file-grid', httpVueLoader('assets/js/components/FileGrid.vue'));
    Vue.component('file-list', httpVueLoader('assets/js/components/FileList.vue'));
    Vue.component('file-preview', httpVueLoader('assets/js/components/FilePreview.vue'));

    console.log('📦 全域組件註冊完成');
};

// ================================
// 全域混入註冊
// ================================
window.FileManagerApp.registerGlobalMixins = function () {
    // 全域混入
    Vue.mixin({
        data() {
            return {
                $app: window.FileManagerApp
            };
        },

        methods: {
            // 格式化檔案大小
            $formatFileSize(bytes) {
                return Utils.formatFileSize(bytes);
            },

            // 格式化日期
            $formatDate(date) {
                return Utils.formatDateTime(date);
            },

            // 顯示提示訊息
            $showToast(message, type = 'info') {
                Utils.showToast(message, type);
            },

            // 確認對話框
            $confirm(message) {
                return confirm(message);
            },

            // 取得檔案圖示
            $getFileIcon(extension) {
                return Utils.getFileIcon(extension);
            },

            // 檢查權限
            $hasPermission(permission) {
                return this.$app.hasPermission(permission);
            },

            // 發送事件
            $emit(event, data) {
                this.$app.eventBus.$emit(event, data);
            },

            // 監聽事件
            $on(event, callback) {
                this.$app.eventBus.$on(event, callback);
            },

            // 取消監聽事件
            $off(event, callback) {
                this.$app.eventBus.$off(event, callback);
            }
        }
    });

    console.log('🔧 全域混入註冊完成');
};

// ================================
// 全域指令註冊
// ================================
window.FileManagerApp.registerGlobalDirectives = function () {
    // 自動焦點指令
    Vue.directive('focus', {
        inserted: function (el) {
            el.focus();
        }
    });

    // 點擊外部關閉指令
    Vue.directive('click-outside', {
        bind: function (el, binding, vnode) {
            el.clickOutsideEvent = function (event) {
                if (!(el == event.target || el.contains(event.target))) {
                    vnode.context[binding.expression](event);
                }
            };
            document.body.addEventListener('click', el.clickOutsideEvent);
        },
        unbind: function (el) {
            document.body.removeEventListener('click', el.clickOutsideEvent);
        }
    });

    // 拖放指令
    Vue.directive('draggable', {
        bind: function (el, binding) {
            el.addEventListener('dragstart', binding.value);
        }
    });

    // 延遲載入指令
    Vue.directive('lazy-load', {
        bind: function (el, binding) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        binding.value();
                        observer.unobserve(el);
                    }
                });
            });
            observer.observe(el);
        }
    });

    console.log('📋 全域指令註冊完成');
};

// ================================
// 工具函數初始化
// ================================
window.FileManagerApp.initUtils = function () {
    // 複製現有的工具函數
    this.utils = {
        ...Utils,

        // 額外的應用程式特定工具函數

        // 深度複製物件
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (typeof obj === 'object') {
                const clonedObj = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        clonedObj[key] = this.deepClone(obj[key]);
                    }
                }
                return clonedObj;
            }
        },

        // 生成 UUID
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        // 本地存儲封裝
        storage: {
            set(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (e) {
                    console.warn('本地存儲寫入失敗:', e);
                }
            },

            get(key, defaultValue = null) {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (e) {
                    console.warn('本地存儲讀取失敗:', e);
                    return defaultValue;
                }
            },

            remove(key) {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn('本地存儲刪除失敗:', e);
                }
            },

            clear() {
                try {
                    localStorage.clear();
                } catch (e) {
                    console.warn('本地存儲清除失敗:', e);
                }
            }
        },

        // URL 參數處理
        getUrlParams() {
            const params = {};
            const urlParams = new URLSearchParams(window.location.search);
            for (const [key, value] of urlParams) {
                params[key] = value;
            }
            return params;
        },

        setUrlParam(key, value) {
            const url = new URL(window.location);
            url.searchParams.set(key, value);
            window.history.replaceState({}, '', url);
        }
    };

    console.log('🛠️ 工具函數初始化完成');
};

// ================================
// 事件監聽器初始化
// ================================
window.FileManagerApp.initEventListeners = function () {
    // 視窗大小改變事件
    window.addEventListener('resize', this.utils.debounce(() => {
        this.eventBus.$emit('window:resize', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }, 250));

    // 網路狀態監聽
    window.addEventListener('online', () => {
        this.eventBus.$emit('network:online');
        Utils.showToast('網路連線已恢復', 'success');
    });

    window.addEventListener('offline', () => {
        this.eventBus.$emit('network:offline');
        Utils.showToast('網路連線已中斷', 'warning');
    });

    // 頁面可見性變化
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            this.eventBus.$emit('page:hidden');
        } else {
            this.eventBus.$emit('page:visible');
        }
    });

    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
        this.handleGlobalKeyboardShortcuts(e);
    });

    // 拖放事件（全域）
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        // 如果不在指定的拖放區域，則忽略
        if (!e.target.closest('.upload-dropzone')) {
            return;
        }
    });

    console.log('👂 事件監聽器初始化完成');
};

// ================================
// 路由初始化
// ================================
window.FileManagerApp.initRouting = function () {
    // 簡單的路由系統
    this.router = {
        routes: {
            '/': 'index.html',
            '/login': 'login.html',
            '/register': 'register.html',
            '/files': 'files.html',
            '/recycle': 'recycle.html'
        },

        // 導航到指定路由
        navigate(path) {
            if (this.routes[path]) {
                window.location.href = this.routes[path];
            } else {
                console.warn('未找到路由:', path);
            }
        },

        // 取得當前路由
        getCurrentRoute() {
            const path = window.location.pathname;
            const page = path.split('/').pop() || 'index.html';
            return page.replace('.html', '');
        }
    };

    // 設定當前頁面
    this.currentPage = this.router.getCurrentRoute();

    console.log('🗺️ 路由初始化完成，當前頁面:', this.currentPage);
};

// ================================
// 主題初始化
// ================================
window.FileManagerApp.initTheme = function () {
    // 從本地存儲載入主題設定
    const savedTheme = this.utils.storage.get('theme', 'light');
    this.setTheme(savedTheme);

    // 監聽系統主題變化
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            if (this.state.theme === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    console.log('🎨 主題初始化完成');
};

// ================================
// 多語言初始化
// ================================
window.FileManagerApp.initI18n = function () {
    // 從本地存儲載入語言設定
    const savedLanguage = this.utils.storage.get('language', 'zh-TW');
    this.setLanguage(savedLanguage);

    console.log('🌍 多語言初始化完成');
};

// ================================
// 瀏覽器相容性檢查
// ================================
window.FileManagerApp.checkBrowserCompatibility = function () {
    const requiredFeatures = [
        'fetch',
        'Promise',
        'localStorage',
        'sessionStorage',
        'FormData',
        'File',
        'FileReader'
    ];

    const missingFeatures = requiredFeatures.filter(feature => !window[feature]);

    if (missingFeatures.length > 0) {
        console.warn('瀏覽器缺少必要功能:', missingFeatures);
        this.showErrorMessage(
            `您的瀏覽器版本過舊，缺少必要功能：${missingFeatures.join(', ')}。\n` +
            '請更新到最新版本的瀏覽器以獲得最佳體驗。'
        );
    }

    console.log('🔍 瀏覽器相容性檢查完成');
};

// ================================
// 載入使用者設定
// ================================
window.FileManagerApp.loadUserSettings = function () {
    // 從本地存儲載入使用者設定
    const settings = this.utils.storage.get('userSettings', {});
    this.state.settings = {
        // 預設設定
        fileViewMode: 'grid',
        pageSize: 50,
        autoSave: true,
        notifications: true,
        showThumbnails: true,
        showFileSize: true,
        showUploadDate: true,
        showUploader: true,

        // 合併已保存的設定
        ...settings
    };

    console.log('⚙️ 使用者設定載入完成');
};

// ================================
// 實用方法
// ================================

// 設定主題
window.FileManagerApp.setTheme = function (theme) {
    this.state.theme = theme;
    this.applyTheme(theme === 'auto' ? this.getSystemTheme() : theme);
    this.utils.storage.set('theme', theme);
};

// 應用主題
window.FileManagerApp.applyTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = document.body.className.replace(/theme-\w+/, '') + ` theme-${theme}`;
};

// 取得系統主題
window.FileManagerApp.getSystemTheme = function () {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 設定語言
window.FileManagerApp.setLanguage = function (language) {
    this.state.language = language;
    document.documentElement.setAttribute('lang', language);
    this.utils.storage.set('language', language);
};

// 檢查權限
window.FileManagerApp.hasPermission = function (permission) {
    // 這裡可以實作權限檢查邏輯
    return true;
};

// 全域鍵盤快捷鍵處理
window.FileManagerApp.handleGlobalKeyboardShortcuts = function (e) {
    // Ctrl+/ 顯示快捷鍵說明
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        this.showKeyboardShortcuts();
    }

    // ESC 鍵關閉模態框
    if (e.key === 'Escape') {
        this.eventBus.$emit('keyboard:escape');
    }

    // F5 重新整理（在開發模式下攔截）
    if (e.key === 'F5' && process.env.NODE_ENV === 'development') {
        e.preventDefault();
        this.eventBus.$emit('keyboard:refresh');
    }
};

// 顯示快捷鍵說明
window.FileManagerApp.showKeyboardShortcuts = function () {
    const shortcuts = [
        { key: 'Ctrl + A', description: '全選檔案' },
        { key: 'Ctrl + U', description: '上傳檔案' },
        { key: 'Ctrl + R', description: '重新整理' },
        { key: 'Delete', description: '刪除選中檔案' },
        { key: 'Escape', description: '取消選擇/關閉對話框' },
        { key: 'Ctrl + /', description: '顯示此說明' }
    ];

    let message = '鍵盤快捷鍵：\n\n';
    shortcuts.forEach(shortcut => {
        message += `${shortcut.key}: ${shortcut.description}\n`;
    });

    alert(message);
};

// Vue 錯誤處理
window.FileManagerApp.handleVueError = function (err, vm, info) {
    // 可以在這裡實作錯誤回報邏輯
    this.showErrorMessage('應用程式發生錯誤，請重新整理頁面');
};

// 顯示錯誤訊息
window.FileManagerApp.showErrorMessage = function (message) {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(message, 'danger');
    } else {
        alert(message);
    }
};

// 模組註冊
window.FileManagerApp.registerModule = function (name, module) {
    this.modules[name] = module;
    console.log(`📦 模組 "${name}" 已註冊`);
};

// 模組取得
window.FileManagerApp.getModule = function (name) {
    return this.modules[name];
};

// ================================
// 應用程式啟動
// ================================

// DOM 載入完成後自動初始化
document.addEventListener('DOMContentLoaded', function () {
    // 確保所有依賴都已載入
    if (typeof Vue === 'undefined') {
        console.error('❌ Vue.js 未載入');
        return;
    }

    if (typeof httpVueLoader === 'undefined') {
        console.error('❌ http-vue-loader 未載入');
        return;
    }

    // 初始化應用程式
    window.FileManagerApp.init();
});

// 匯出應用程式物件以供其他腳本使用
window.App = window.FileManagerApp;

console.log('📱 檔案管理系統應用程式載入完成');