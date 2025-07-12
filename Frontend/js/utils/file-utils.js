/**
 * 檔案處理工具函數
 * 提供檔案相關的各種實用工具方法
 */

const FileUtils = {

    // ==========================================
    // 檔案基本資訊處理
    // ==========================================

    /**
     * 獲取檔案副檔名
     * @param {string} filename - 檔案名稱
     * @returns {string} 副檔名（小寫）
     */
    getFileExtension(filename) {
        if (!filename || typeof filename !== 'string') return '';
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },

    /**
     * 獲取檔案名稱（不含副檔名）
     * @param {string} filename - 完整檔案名稱
     * @returns {string} 檔案名稱（不含副檔名）
     */
    getFileNameWithoutExtension(filename) {
        if (!filename || typeof filename !== 'string') return '';
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    },

    /**
     * 格式化檔案大小
     * @param {number} bytes - 檔案大小（位元組）
     * @param {number} decimals - 小數位數
     * @returns {string} 格式化後的檔案大小
     */
    formatFileSize(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        if (typeof bytes !== 'number' || bytes < 0) return 'Invalid size';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = CONSTANTS.FILE_SIZE_UNITS;

        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

        return `${size} ${sizes[i]}`;
    },

    /**
     * 將格式化的檔案大小轉換回位元組
     * @param {string} sizeString - 格式化的大小字串 (例如: "1.5 MB")
     * @returns {number} 位元組數
     */
    parseFileSize(sizeString) {
        if (!sizeString || typeof sizeString !== 'string') return 0;

        const match = sizeString.match(/^([\d.]+)\s*([A-Za-z]+)$/);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();

        const multipliers = {
            'BYTES': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
        };

        return Math.round(value * (multipliers[unit] || 1));
    },

    // ==========================================
    // 檔案類型判斷
    // ==========================================

    /**
     * 獲取檔案類型資訊
     * @param {string} filename - 檔案名稱
     * @returns {object} 檔案類型資訊
     */
    getFileTypeInfo(filename) {
        return CONSTANTS.getFileTypeInfo(filename);
    },

    /**
     * 獲取檔案圖標
     * @param {string} filename - 檔案名稱
     * @returns {string} 圖標檔案名稱
     */
    getFileIcon(filename) {
        const typeInfo = this.getFileTypeInfo(filename);
        return typeInfo.icon;
    },

    /**
     * 獲取檔案類型顏色
     * @param {string} filename - 檔案名稱
     * @returns {string} CSS 顏色值
     */
    getFileColor(filename) {
        const typeInfo = this.getFileTypeInfo(filename);
        return typeInfo.color;
    },

    /**
     * 判斷是否為圖片檔案
     * @param {string} filename - 檔案名稱
     * @returns {boolean} 是否為圖片
     */
    isImage(filename) {
        const extension = this.getFileExtension(filename);
        return CONSTANTS.FILE_TYPES.IMAGE.extensions.includes(extension);
    },

    /**
     * 判斷是否為文檔檔案
     * @param {string} filename - 檔案名稱
     * @returns {boolean} 是否為文檔
     */
    isDocument(filename) {
        const extension = this.getFileExtension(filename);
        return CONSTANTS.FILE_TYPES.DOCUMENT.extensions.includes(extension);
    },

    /**
     * 判斷是否為影片檔案
     * @param {string} filename - 檔案名稱
     * @returns {boolean} 是否為影片
     */
    isVideo(filename) {
        const extension = this.getFileExtension(filename);
        return CONSTANTS.FILE_TYPES.VIDEO.extensions.includes(extension);
    },

    /**
     * 判斷是否為音頻檔案
     * @param {string} filename - 檔案名稱
     * @returns {boolean} 是否為音頻
     */
    isAudio(filename) {
        const extension = this.getFileExtension(filename);
        return CONSTANTS.FILE_TYPES.AUDIO.extensions.includes(extension);
    },

    /**
     * 判斷檔案是否支援預覽
     * @param {string} filename - 檔案名稱
     * @returns {boolean} 是否支援預覽
     */
    isPreviewSupported(filename) {
        return CONSTANTS.isPreviewSupported(filename);
    },

    // ==========================================
    // 檔案驗證
    // ==========================================

    /**
     * 驗證檔案類型是否允許
     * @param {File|string} file - File 物件或檔案名稱
     * @returns {boolean} 是否允許的檔案類型
     */
    isFileTypeAllowed(file) {
        let mimeType, filename;

        if (file instanceof File) {
            mimeType = file.type;
            filename = file.name;
        } else if (typeof file === 'string') {
            filename = file;
            mimeType = this.getMimeTypeFromExtension(this.getFileExtension(filename));
        } else {
            return false;
        }

        // 檢查 MIME 類型
        if (mimeType && API_CONFIG.upload.allowedTypes.includes(mimeType)) {
            return true;
        }

        // 檢查副檔名
        const extension = this.getFileExtension(filename);
        for (const typeInfo of Object.values(CONSTANTS.FILE_TYPES)) {
            if (typeInfo.extensions && typeInfo.extensions.includes(extension)) {
                return true;
            }
        }

        return false;
    },

    /**
     * 驗證檔案大小是否符合限制
     * @param {File|number} file - File 物件或檔案大小（位元組）
     * @returns {boolean} 是否符合大小限制
     */
    isFileSizeAllowed(file) {
        let fileSize;

        if (file instanceof File) {
            fileSize = file.size;
        } else if (typeof file === 'number') {
            fileSize = file;
        } else {
            return false;
        }

        return fileSize <= API_CONFIG.upload.maxFileSize;
    },

    /**
     * 驗證檔案名稱是否有效
     * @param {string} filename - 檔案名稱
     * @returns {boolean} 是否有效的檔案名稱
     */
    isValidFileName(filename) {
        if (!filename || typeof filename !== 'string') return false;

        // 檢查長度
        if (filename.length === 0 || filename.length > 255) return false;

        // 檢查非法字元
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (invalidChars.test(filename)) return false;

        // 檢查保留名稱 (Windows)
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
        if (reservedNames.test(filename)) return false;

        // 檢查是否以點或空格結尾
        if (filename.endsWith('.') || filename.endsWith(' ')) return false;

        return true;
    },

    // ==========================================
    // 檔案操作工具
    // ==========================================

    /**
     * 生成唯一檔案名稱
     * @param {string} originalName - 原始檔案名稱
     * @param {Array} existingNames - 已存在的檔案名稱列表
     * @returns {string} 唯一的檔案名稱
     */
    generateUniqueFileName(originalName, existingNames = []) {
        if (!existingNames.includes(originalName)) {
            return originalName;
        }

        const nameWithoutExt = this.getFileNameWithoutExtension(originalName);
        const extension = this.getFileExtension(originalName);
        const extensionPart = extension ? `.${extension}` : '';

        let counter = 1;
        let newName;

        do {
            newName = `${nameWithoutExt} (${counter})${extensionPart}`;
            counter++;
        } while (existingNames.includes(newName));

        return newName;
    },

    /**
     * 清理檔案名稱（移除非法字元）
     * @param {string} filename - 原始檔案名稱
     * @returns {string} 清理後的檔案名稱
     */
    sanitizeFileName(filename) {
        if (!filename) return '';

        // 替換非法字元為底線
        let sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');

        // 移除開頭和結尾的空格和點
        sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');

        // 限制長度
        if (sanitized.length > 255) {
            const extension = this.getFileExtension(sanitized);
            const nameWithoutExt = this.getFileNameWithoutExtension(sanitized);
            const maxNameLength = 255 - extension.length - 1;
            sanitized = nameWithoutExt.substring(0, maxNameLength) + (extension ? `.${extension}` : '');
        }

        return sanitized || 'untitled';
    },

    /**
     * 根據副檔名獲取 MIME 類型
     * @param {string} extension - 副檔名
     * @returns {string} MIME 類型
     */
    getMimeTypeFromExtension(extension) {
        const mimeMap = {
            // 圖片
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
            'gif': 'image/gif', 'bmp': 'image/bmp', 'webp': 'image/webp',
            'svg': 'image/svg+xml', 'ico': 'image/x-icon',

            // 文檔
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

            // 文字
            'txt': 'text/plain', 'csv': 'text/csv', 'html': 'text/html',
            'xml': 'text/xml', 'json': 'application/json',

            // 影音
            'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime',
            'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg',

            // 壓縮
            'zip': 'application/zip', 'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed'
        };

        return mimeMap[extension.toLowerCase()] || 'application/octet-stream';
    },

    // ==========================================
    // 檔案 URL 和路徑處理
    // ==========================================

    /**
     * 建立檔案預覽 URL
     * @param {string|number} fileId - 檔案 ID
     * @returns {string} 預覽 URL
     */
    buildPreviewUrl(fileId) {
        return API_CONFIG.buildUrl(API_CONFIG.endpoints.preview + `/${fileId}`);
    },

    /**
     * 建立檔案縮圖 URL
     * @param {string|number} fileId - 檔案 ID
     * @returns {string} 縮圖 URL
     */
    buildThumbnailUrl(fileId) {
        return API_CONFIG.buildUrl(API_CONFIG.endpoints.thumbnail + `/${fileId}`);
    },

    /**
     * 建立檔案下載 URL
     * @param {string|number} fileId - 檔案 ID
     * @returns {string} 下載 URL
     */
    buildDownloadUrl(fileId) {
        return API_CONFIG.buildUrl(API_CONFIG.endpoints.download + `/${fileId}`);
    },

    /**
     * 建立檔案圖標路徑
     * @param {string} iconName - 圖標名稱
     * @returns {string} 圖標路徑
     */
    buildIconPath(iconName) {
        return `assets/images/icons/${iconName}`;
    },

    // ==========================================
    // 檔案列表處理工具
    // ==========================================

    /**
     * 排序檔案列表
     * @param {Array} files - 檔案列表
     * @param {string} sortBy - 排序欄位
     * @param {string} direction - 排序方向 ('asc' 或 'desc')
     * @returns {Array} 排序後的檔案列表
     */
    sortFiles(files, sortBy = 'name', direction = 'asc') {
        if (!Array.isArray(files)) return [];

        const sortedFiles = [...files].sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'name':
                    valueA = (a.originalName || a.fileName || '').toLowerCase();
                    valueB = (b.originalName || b.fileName || '').toLowerCase();
                    break;
                case 'size':
                    valueA = a.fileSize || 0;
                    valueB = b.fileSize || 0;
                    break;
                case 'uploadedAt':
                case 'date':
                    valueA = new Date(a.uploadedAt || 0);
                    valueB = new Date(b.uploadedAt || 0);
                    break;
                case 'type':
                    valueA = this.getFileExtension(a.originalName || a.fileName || '');
                    valueB = this.getFileExtension(b.originalName || b.fileName || '');
                    break;
                default:
                    valueA = a[sortBy] || '';
                    valueB = b[sortBy] || '';
            }

            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sortedFiles;
    },

    /**
     * 篩選檔案列表
     * @param {Array} files - 檔案列表
     * @param {object} filters - 篩選條件
     * @returns {Array} 篩選後的檔案列表
     */
    filterFiles(files, filters = {}) {
        if (!Array.isArray(files)) return [];

        return files.filter(file => {
            // 按檔案類型篩選
            if (filters.type && filters.type !== 'all') {
                const fileCategory = CONSTANTS.getFileCategory(
                    this.getFileExtension(file.originalName || file.fileName || '')
                );
                if (fileCategory !== filters.type) return false;
            }

            // 按檔案名稱搜尋
            if (filters.search) {
                const fileName = (file.originalName || file.fileName || '').toLowerCase();
                const searchTerm = filters.search.toLowerCase();
                if (!fileName.includes(searchTerm)) return false;
            }

            // 按檔案大小篩選
            if (filters.minSize && file.fileSize < filters.minSize) return false;
            if (filters.maxSize && file.fileSize > filters.maxSize) return false;

            // 按日期範圍篩選
            if (filters.startDate || filters.endDate) {
                const fileDate = new Date(file.uploadedAt);
                if (filters.startDate && fileDate < new Date(filters.startDate)) return false;
                if (filters.endDate && fileDate > new Date(filters.endDate)) return false;
            }

            return true;
        });
    },

    /**
     * 搜尋檔案
     * @param {Array} files - 檔案列表
     * @param {string} query - 搜尋關鍵字
     * @returns {Array} 搜尋結果
     */
    searchFiles(files, query) {
        if (!query || !Array.isArray(files)) return files;

        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return files;

        return files.filter(file => {
            const fileName = (file.originalName || file.fileName || '').toLowerCase();
            return fileName.includes(searchTerm);
        });
    }
};

// 導出到全域
window.FileUtils = FileUtils;