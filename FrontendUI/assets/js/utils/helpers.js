// assets/js/utils/helpers.js
const Utils = {
    // 格式化檔案大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 格式化日期時間
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 取得檔案副檔名
    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    },

    // 取得檔案類型圖示
    getFileIcon(extension) {
        const iconMap = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            'txt': 'fa-file-text',
            'csv': 'fa-file-csv',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'bmp': 'fa-file-image',
            'svg': 'fa-file-image',
            'mp4': 'fa-file-video',
            'avi': 'fa-file-video',
            'mov': 'fa-file-video',
            'wmv': 'fa-file-video',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio',
            'flac': 'fa-file-audio',
            'aac': 'fa-file-audio',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            '7z': 'fa-file-archive'
        };
        return iconMap[extension.toLowerCase()] || 'fa-file';
    },

    // 檢查是否為圖片檔案
    isImageFile(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        const extension = this.getFileExtension(filename).toLowerCase();
        return imageExtensions.includes(extension);
    },

    // 檢查檔案是否可預覽
    canPreviewFile(filename) {
        const previewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'pdf'];
        const extension = this.getFileExtension(filename).toLowerCase();
        return previewableExtensions.includes(extension);
    },

    // 驗證檔案
    validateFile(file) {
        const errors = [];

        // 檢查檔案大小
        if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
            errors.push(MESSAGES.ERROR.FILE_TOO_LARGE);
        }

        // 檢查檔案類型
        if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
            errors.push(MESSAGES.ERROR.INVALID_FILE_TYPE);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // 產生唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 防抖函數
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 節流函數
    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // 複製到剪貼簿
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // 降級方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    },

    // 下載檔案
    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || '';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // 顯示 Toast 通知
    showToast(message, type = 'info') {
        // 使用 Bootstrap Toast 或自定義 Toast
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // 使用 Bootstrap Toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: UI_CONFIG.TOAST_DURATION
        });
        bsToast.show();

        // 自動移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, UI_CONFIG.TOAST_DURATION + 500);
    },

    // 建立 Toast 容器
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
        return container;
    },

    // 顯示載入動畫
    showLoading(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.innerHTML = `
                <div class="d-flex justify-content-center align-items-center p-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">載入中...</span>
                    </div>
                    <span class="ms-2">載入中...</span>
                </div>
            `;
        }
    },

    // 隱藏載入動畫
    hideLoading(element, content = '') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.innerHTML = content;
        }
    },

    // 確認對話框
    confirmDialog(message, callback) {
        if (confirm(message)) {
            callback();
        }
    },

    // 取得查詢參數
    getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    // 設定查詢參數
    setQueryParam(name, value) {
        const url = new URL(window.location);
        if (value) {
            url.searchParams.set(name, value);
        } else {
            url.searchParams.delete(name);
        }
        window.history.replaceState({}, '', url);
    }
};