/**
 * 系統常數定義
 * 定義整個應用程式使用的常數和枚舉值
 */

const CONSTANTS = {
    // ==========================================
    // 檔案類型定義
    // ==========================================
    FILE_TYPES: {
        // 圖片類型
        IMAGE: {
            extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'],
            mimeTypes: [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                'image/bmp', 'image/webp', 'image/svg+xml', 'image/x-icon',
                'image/tiff', 'image/tif'
            ],
            icon: 'file-image.svg',
            color: '#28a745', // 綠色
            category: 'image'
        },

        // 文檔類型
        DOCUMENT: {
            extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'],
            mimeTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.oasis.opendocument.text',
                'application/vnd.oasis.opendocument.spreadsheet',
                'application/vnd.oasis.opendocument.presentation'
            ],
            icon: 'file-pdf.svg',
            color: '#dc3545', // 紅色
            category: 'document'
        },

        // 文字類型
        TEXT: {
            extensions: ['txt', 'md', 'csv', 'html', 'htm', 'xml', 'json', 'yaml', 'yml', 'log'],
            mimeTypes: [
                'text/plain', 'text/markdown', 'text/csv', 'text/html',
                'text/xml', 'application/json', 'application/yaml',
                'application/x-yaml', 'text/x-log'
            ],
            icon: 'file-text.svg',
            color: '#6c757d', // 灰色
            category: 'text'
        },

        // 程式碼類型
        CODE: {
            extensions: ['js', 'ts', 'jsx', 'tsx', 'vue', 'html', 'css', 'scss', 'sass', 'less', 'php', 'py', 'java', 'cs', 'cpp', 'c', 'h', 'sql', 'sh', 'bat'],
            mimeTypes: [
                'application/javascript', 'application/typescript',
                'text/javascript', 'text/css', 'text/html',
                'application/x-php', 'text/x-python', 'text/x-java-source',
                'text/x-csharp', 'text/x-c++src', 'text/x-csrc',
                'application/sql', 'application/x-sh', 'application/x-bat'
            ],
            icon: 'file-code.svg',
            color: '#17a2b8', // 青色
            category: 'code'
        },

        // 影片類型
        VIDEO: {
            extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'rm', 'rmvb'],
            mimeTypes: [
                'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv',
                'video/x-flv', 'video/webm', 'video/x-matroska', 'video/3gpp',
                'application/vnd.rn-realmedia', 'video/x-ms-asf'
            ],
            icon: 'file-video.svg',
            color: '#fd7e14', // 橙色
            category: 'video'
        },

        // 音頻類型
        AUDIO: {
            extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus'],
            mimeTypes: [
                'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac',
                'audio/ogg', 'audio/x-ms-wma', 'audio/mp4', 'audio/opus'
            ],
            icon: 'file-audio.svg',
            color: '#6f42c1', // 紫色
            category: 'audio'
        },

        // 壓縮檔案類型
        ARCHIVE: {
            extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'],
            mimeTypes: [
                'application/zip', 'application/x-rar-compressed',
                'application/x-7z-compressed', 'application/x-tar',
                'application/gzip', 'application/x-bzip2',
                'application/x-xz', 'application/x-iso9660-image'
            ],
            icon: 'file-zip.svg',
            color: '#ffc107', // 黃色
            category: 'archive'
        },

        // 預設類型
        DEFAULT: {
            extensions: [],
            mimeTypes: [],
            icon: 'file-default.svg',
            color: '#6c757d', // 灰色
            category: 'other'
        }
    },

    // ==========================================
    // 特殊檔案類型映射
    // ==========================================
    SPECIAL_FILE_TYPES: {
        'pdf': { icon: 'file-pdf.svg', color: '#dc3545' },
        'doc': { icon: 'file-word.svg', color: '#0d6efd' },
        'docx': { icon: 'file-word.svg', color: '#0d6efd' },
        'xls': { icon: 'file-excel.svg', color: '#198754' },
        'xlsx': { icon: 'file-excel.svg', color: '#198754' },
        'ppt': { icon: 'file-powerpoint.svg', color: '#fd7e14' },
        'pptx': { icon: 'file-powerpoint.svg', color: '#fd7e14' }
    },

    // ==========================================
    // 檔案大小單位
    // ==========================================
    FILE_SIZE_UNITS: ['Bytes', 'KB', 'MB', 'GB', 'TB'],

    // ==========================================
    // 檔案大小限制
    // ==========================================
    FILE_SIZE_LIMITS: {
        // 檔案大小限制 (位元組)
        MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
        MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_DOCUMENT_SIZE: 25 * 1024 * 1024, // 25MB
        MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB

        // 批量上傳限制
        MAX_BATCH_FILES: 20,
        MAX_BATCH_SIZE: 200 * 1024 * 1024 // 200MB
    },

    // ==========================================
    // 視圖模式
    // ==========================================
    VIEW_MODES: {
        GRID: 'grid',
        LIST: 'list'
    },

    // ==========================================
    // 排序選項
    // ==========================================
    SORT_OPTIONS: {
        NAME_ASC: { field: 'name', direction: 'asc', label: '名稱 (A-Z)' },
        NAME_DESC: { field: 'name', direction: 'desc', label: '名稱 (Z-A)' },
        SIZE_ASC: { field: 'size', direction: 'asc', label: '大小 (小到大)' },
        SIZE_DESC: { field: 'size', direction: 'desc', label: '大小 (大到小)' },
        DATE_ASC: { field: 'uploadedAt', direction: 'asc', label: '日期 (舊到新)' },
        DATE_DESC: { field: 'uploadedAt', direction: 'desc', label: '日期 (新到舊)' },
        TYPE_ASC: { field: 'type', direction: 'asc', label: '類型 (A-Z)' },
        TYPE_DESC: { field: 'type', direction: 'desc', label: '類型 (Z-A)' }
    },

    // ==========================================
    // 上傳狀態
    // ==========================================
    UPLOAD_STATUS: {
        PENDING: 'pending',      // 等待上傳
        UPLOADING: 'uploading',  // 上傳中
        SUCCESS: 'success',      // 上傳成功
        ERROR: 'error',          // 上傳失敗
        CANCELLED: 'cancelled'   // 已取消
    },

    // ==========================================
    // 操作類型
    // ==========================================
    OPERATIONS: {
        PREVIEW: 'preview',      // 預覽
        DOWNLOAD: 'download',    // 下載
        RENAME: 'rename',        // 重命名
        DELETE: 'delete',        // 刪除
        COPY_LINK: 'copy_link',  // 複製連結
        SHARE: 'share',          // 分享
        RESTORE: 'restore',      // 還原
        PERMANENT_DELETE: 'permanent_delete' // 永久刪除
    },

    // ==========================================
    // 通知類型
    // ==========================================
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },

    // ==========================================
    // 本地儲存鍵值
    // ==========================================
    STORAGE_KEYS: {
        VIEW_MODE: 'fileManager_viewMode',
        SORT_OPTION: 'fileManager_sortOption',
        USER_PREFERENCES: 'fileManager_userPreferences',
        LAST_VISIT: 'fileManager_lastVisit'
    },

    // ==========================================
    // API 狀態碼
    // ==========================================
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        PAYLOAD_TOO_LARGE: 413,
        UNSUPPORTED_MEDIA_TYPE: 415,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503
    },

    // ==========================================
    // 錯誤訊息
    // ==========================================
    ERROR_MESSAGES: {
        FILE_TOO_LARGE: '檔案大小超過限制',
        FILE_TYPE_NOT_ALLOWED: '不支援的檔案類型',
        UPLOAD_FAILED: '檔案上傳失敗',
        NETWORK_ERROR: '網路連接錯誤',
        SERVER_ERROR: '伺服器錯誤',
        FILE_NOT_FOUND: '檔案不存在',
        PERMISSION_DENIED: '沒有權限執行此操作',
        INVALID_FILE_NAME: '檔案名稱不正確',
        BACKEND_NOT_AVAILABLE: '後端服務暫時無法使用'
    },

    // ==========================================
    // 成功訊息
    // ==========================================
    SUCCESS_MESSAGES: {
        UPLOAD_SUCCESS: '檔案上傳成功',
        DELETE_SUCCESS: '檔案刪除成功',
        RENAME_SUCCESS: '檔案重命名成功',
        COPY_LINK_SUCCESS: '連結已複製到剪貼板',
        RESTORE_SUCCESS: '檔案還原成功'
    },

    // ==========================================
    // UI 設定
    // ==========================================
    UI_CONFIG: {
        // 分頁設定
        PAGINATION: {
            DEFAULT_PAGE_SIZE: 50,
            PAGE_SIZE_OPTIONS: [25, 50, 75, 100]
        },

        // 動畫設定
        ANIMATION: {
            DURATION_SHORT: 200,
            DURATION_MEDIUM: 300,
            DURATION_LONG: 500
        },

        // 載入設定
        LOADING: {
            MIN_DISPLAY_TIME: 300, // 最小顯示時間(毫秒)
            DEBOUNCE_DELAY: 300    // 防抖延遲(毫秒)
        }
    }
};

// 工具函數：根據副檔名獲取檔案類型資訊
CONSTANTS.getFileTypeInfo = function (filename) {
    if (!filename) return this.FILE_TYPES.DEFAULT;

    const extension = filename.split('.').pop().toLowerCase();

    // 檢查特殊檔案類型
    if (this.SPECIAL_FILE_TYPES[extension]) {
        return {
            ...this.SPECIAL_FILE_TYPES[extension],
            category: this.getFileCategory(extension)
        };
    }

    // 檢查一般檔案類型
    for (const [typeName, typeInfo] of Object.entries(this.FILE_TYPES)) {
        if (typeInfo.extensions && typeInfo.extensions.includes(extension)) {
            return typeInfo;
        }
    }

    return this.FILE_TYPES.DEFAULT;
};

// 工具函數：根據副檔名獲取檔案分類
CONSTANTS.getFileCategory = function (extension) {
    for (const [typeName, typeInfo] of Object.entries(this.FILE_TYPES)) {
        if (typeInfo.extensions && typeInfo.extensions.includes(extension)) {
            return typeInfo.category;
        }
    }
    return 'other';
};

// 工具函數：檢查檔案類型是否支援預覽
CONSTANTS.isPreviewSupported = function (filename) {
    const category = this.getFileCategory(filename.split('.').pop().toLowerCase());
    return ['image', 'document', 'text', 'video', 'audio'].includes(category);
};

// 導出到全域
window.CONSTANTS = CONSTANTS;