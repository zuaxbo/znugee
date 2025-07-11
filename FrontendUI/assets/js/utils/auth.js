// assets/js/utils/auth.js
const Auth = {
    // 檢查登入狀態
    isLoggedIn() {
        return !!sessionStorage.getItem('isLoggedIn');
    },

    // 取得目前使用者
    getCurrentUser() {
        const userStr = sessionStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    // 設定登入狀態
    setLoginState(user) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    },

    // 清除登入狀態
    clearLoginState() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('currentUser');
    },

    // 登出
    logout() {
        this.clearLoginState();
        Utils.showToast(MESSAGES.SUCCESS.LOGOUT, 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    },

    // 檢查頁面訪問權限
    checkPageAccess() {
        const currentPage = window.location.pathname.split('/').pop();
        const publicPages = ['login.html', 'register.html', 'index.html'];

        if (!publicPages.includes(currentPage) && !this.isLoggedIn()) {
            Utils.showToast(MESSAGES.ERROR.UNAUTHORIZED, 'error');
            window.location.href = 'login.html';
            return false;
        }

        if (publicPages.includes(currentPage) && this.isLoggedIn() && currentPage !== 'index.html') {
            window.location.href = 'files.html';
            return false;
        }

        return true;
    },

    // 初始化頁面權限檢查
    init() {
        this.checkPageAccess();
    }
};

// 全域狀態管理
window.AppState = {
    user: Auth.getCurrentUser(),
    files: [],
    deletedFiles: [],
    currentView: localStorage.getItem('fileView') || 'grid',
    searchQuery: '',
    selectedFiles: [],
    currentPage: 1,
    totalPages: 1,
    totalFiles: 0,
    loading: false,

    // 設定檔案檢視模式
    setViewMode(mode) {
        this.currentView = mode;
        localStorage.setItem('fileView', mode);
    },

    // 設定搜尋查詢
    setSearchQuery(query) {
        this.searchQuery = query;
        this.currentPage = 1; // 重置到第一頁
    },

    // 選擇檔案
    selectFile(fileId) {
        if (!this.selectedFiles.includes(fileId)) {
            this.selectedFiles.push(fileId);
        }
    },

    // 取消選擇檔案
    unselectFile(fileId) {
        const index = this.selectedFiles.indexOf(fileId);
        if (index > -1) {
            this.selectedFiles.splice(index, 1);
        }
    },

    // 切換檔案選擇狀態
    toggleFileSelection(fileId) {
        if (this.selectedFiles.includes(fileId)) {
            this.unselectFile(fileId);
        } else {
            this.selectFile(fileId);
        }
    },

    // 清除所有選擇
    clearSelection() {
        this.selectedFiles = [];
    },

    // 全選/取消全選
    toggleSelectAll() {
        if (this.selectedFiles.length === this.files.length) {
            this.clearSelection();
        } else {
            this.selectedFiles = this.files.map(file => file.Id);
        }
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    Auth.init();
    Utils.createToastContainer();
});