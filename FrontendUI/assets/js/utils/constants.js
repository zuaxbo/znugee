// assets/js/utils/constants.js
const API_CONFIG = {
    BASE_URL: 'http://localhost', // 請根據實際部署調整
    AUTH_API: '/api/auth',
    FILES_API: '/api/files',
    RECYCLE_API: '/api/recyclebin',
    PREVIEW_API: '/api/filepreview'
};

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

const UI_CONFIG = {
    TOAST_DURATION: 3000,
    LOADING_DELAY: 300,
    ANIMATION_DURATION: 300
};

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
        UNAUTHORIZED: '請先登入'
    }
};