/**
 * 數據格式化工具函數
 * 提供各種數據格式化和顯示相關的實用方法
 */

const FormatUtils = {

    // ==========================================
    // 日期時間格式化
    // ==========================================

    /**
     * 格式化日期時間
     * @param {string|Date} dateInput - 日期輸入
     * @param {string} format - 格式類型
     * @returns {string} 格式化後的日期字串
     */
    formatDate(dateInput, format = 'datetime') {
        if (!dateInput) return '-';

        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '無效日期';

        const now = new Date();
        const diff = now - date;
        const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

        // 根據格式類型返回不同格式
        switch (format) {
            case 'relative':
                return this.getRelativeTime(date);
            case 'date':
                return date.toLocaleDateString('zh-TW');
            case 'time':
                return date.toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            case 'datetime':
                return date.toLocaleDateString('zh-TW') + ' ' +
                    date.toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
            case 'full':
                return date.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                }) + ' ' + date.toLocaleTimeString('zh-TW');
            case 'iso':
                return date.toISOString();
            case 'short':
                if (daysDiff === 0) {
                    return '今天 ' + date.toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else if (daysDiff === 1) {
                    return '昨天 ' + date.toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else if (daysDiff < 7) {
                    return `${daysDiff}天前`;
                } else {
                    return date.toLocaleDateString('zh-TW');
                }
            default:
                return date.toLocaleDateString('zh-TW') + ' ' +
                    date.toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
        }
    },

    /**
     * 獲取相對時間描述
     * @param {Date} date - 日期物件
     * @returns {string} 相對時間描述
     */
    getRelativeTime(date) {
        if (!date) return '';

        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 30) return '剛剛';
        if (seconds < 60) return `${seconds}秒前`;
        if (minutes < 60) return `${minutes}分鐘前`;
        if (hours < 24) return `${hours}小時前`;
        if (days < 7) return `${days}天前`;
        if (weeks < 4) return `${weeks}週前`;
        if (months < 12) return `${months}個月前`;
        return `${years}年前`;
    },

    /**
     * 格式化時間範圍
     * @param {Date} startDate - 開始日期
     * @param {Date} endDate - 結束日期
     * @returns {string} 格式化的時間範圍
     */
    formatDateRange(startDate, endDate) {
        if (!startDate || !endDate) return '';

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

        const startStr = this.formatDate(start, 'date');
        const endStr = this.formatDate(end, 'date');

        if (startStr === endStr) {
            return startStr;
        }

        return `${startStr} - ${endStr}`;
    },

    // ==========================================
    // 數字格式化
    // ==========================================

    /**
     * 格式化數字（添加千分位分隔符）
     * @param {number} number - 要格式化的數字
     * @param {number} decimals - 小數位數
     * @returns {string} 格式化後的數字
     */
    formatNumber(number, decimals = 0) {
        if (number === null || number === undefined || isNaN(number)) return '0';

        return Number(number).toLocaleString('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * 格式化百分比
     * @param {number} value - 數值 (0-1 或 0-100)
     * @param {number} decimals - 小數位數
     * @param {boolean} isDecimal - 是否為小數形式 (0-1)
     * @returns {string} 格式化後的百分比
     */
    formatPercentage(value, decimals = 1, isDecimal = true) {
        if (value === null || value === undefined || isNaN(value)) return '0%';

        const percentage = isDecimal ? value * 100 : value;
        return `${percentage.toFixed(decimals)}%`;
    },

    /**
     * 格式化貨幣
     * @param {number} amount - 金額
     * @param {string} currency - 貨幣代碼
     * @returns {string} 格式化後的貨幣
     */
    formatCurrency(amount, currency = 'TWD') {
        if (amount === null || amount === undefined || isNaN(amount)) return '$0';

        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },

    // ==========================================
    // 文字格式化
    // ==========================================

    /**
     * 截取文字並添加省略號
     * @param {string} text - 原始文字
     * @param {number} maxLength - 最大長度
     * @param {string} suffix - 後綴（預設為 '...'）
     * @returns {string} 截取後的文字
     */
    truncateText(text, maxLength = 20, suffix = '...') {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;

        return text.substring(0, maxLength - suffix.length) + suffix;
    },

    /**
     * 格式化檔案名稱顯示
     * @param {string} filename - 檔案名稱
     * @param {number} maxLength - 最大顯示長度
     * @returns {string} 格式化後的檔案名稱
     */
    formatFileName(filename, maxLength = 30) {
        if (!filename) return '';

        if (filename.length <= maxLength) return filename;

        const extension = FileUtils.getFileExtension(filename);
        const nameWithoutExt = FileUtils.getFileNameWithoutExtension(filename);

        const extensionPart = extension ? `.${extension}` : '';
        const availableLength = maxLength - extensionPart.length - 3; // 3 for '...'

        if (availableLength <= 0) return extensionPart;

        return nameWithoutExt.substring(0, availableLength) + '...' + extensionPart;
    },

    /**
     * 首字母大寫
     * @param {string} text - 原始文字
     * @returns {string} 首字母大寫的文字
     */
    capitalize(text) {
        if (!text || typeof text !== 'string') return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    /**
     * 轉換為駝峰命名
     * @param {string} text - 原始文字
     * @returns {string} 駝峰命名的文字
     */
    toCamelCase(text) {
        if (!text || typeof text !== 'string') return '';

        return text
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
                return index === 0 ? word.toLowerCase() : word.toUpperCase();
            })
            .replace(/\s+/g, '');
    },

    /**
     * 高亮搜尋關鍵字
     * @param {string} text - 原始文字
     * @param {string} searchTerm - 搜尋關鍵字
     * @param {string} className - CSS 類名
     * @returns {string} 包含高亮標記的 HTML
     */
    highlightSearchTerm(text, searchTerm, className = 'highlight') {
        if (!text || !searchTerm) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, `<span class="${className}">$1</span>`);
    },

    // ==========================================
    // 進度和狀態格式化
    // ==========================================

    /**
     * 格式化上傳進度
     * @param {number} loaded - 已載入位元組數
     * @param {number} total - 總位元組數
     * @returns {object} 格式化後的進度資訊
     */
    formatUploadProgress(loaded, total) {
        if (!total || total === 0) {
            return {
                percentage: 0,
                percentageText: '0%',
                loadedText: '0 Bytes',
                totalText: '0 Bytes',
                remainingText: '0 Bytes',
                speedText: '',
                etaText: ''
            };
        }

        const percentage = Math.round((loaded / total) * 100);

        return {
            percentage: percentage,
            percentageText: `${percentage}%`,
            loadedText: FileUtils.formatFileSize(loaded),
            totalText: FileUtils.formatFileSize(total),
            remainingText: FileUtils.formatFileSize(total - loaded),
            speedText: '', // 需要額外計算
            etaText: ''    // 需要額外計算
        };
    },

    /**
     * 格式化上傳速度
     * @param {number} bytesPerSecond - 每秒位元組數
     * @returns {string} 格式化後的速度
     */
    formatUploadSpeed(bytesPerSecond) {
        if (!bytesPerSecond || bytesPerSecond <= 0) return '';

        return `${FileUtils.formatFileSize(bytesPerSecond)}/s`;
    },

    /**
     * 格式化剩餘時間
     * @param {number} remainingBytes - 剩餘位元組數
     * @param {number} bytesPerSecond - 每秒位元組數
     * @returns {string} 格式化後的剩餘時間
     */
    formatETA(remainingBytes, bytesPerSecond) {
        if (!remainingBytes || !bytesPerSecond || bytesPerSecond <= 0) return '';

        const remainingSeconds = Math.ceil(remainingBytes / bytesPerSecond);

        if (remainingSeconds < 60) {
            return `${remainingSeconds}秒`;
        } else if (remainingSeconds < 3600) {
            const minutes = Math.ceil(remainingSeconds / 60);
            return `${minutes}分鐘`;
        } else {
            const hours = Math.floor(remainingSeconds / 3600);
            const minutes = Math.ceil((remainingSeconds % 3600) / 60);
            return `${hours}小時${minutes}分鐘`;
        }
    },

    /**
     * 格式化檔案狀態
     * @param {string} status - 狀態值
     * @returns {object} 格式化後的狀態資訊
     */
    formatFileStatus(status) {
        const statusMap = {
            [CONSTANTS.UPLOAD_STATUS.PENDING]: {
                text: '等待中',
                className: 'text-secondary',
                badgeClass: 'badge-secondary',
                icon: 'bi-clock'
            },
            [CONSTANTS.UPLOAD_STATUS.UPLOADING]: {
                text: '上傳中',
                className: 'text-primary',
                badgeClass: 'badge-primary',
                icon: 'bi-upload'
            },
            [CONSTANTS.UPLOAD_STATUS.SUCCESS]: {
                text: '已完成',
                className: 'text-success',
                badgeClass: 'badge-success',
                icon: 'bi-check-circle-fill'
            },
            [CONSTANTS.UPLOAD_STATUS.ERROR]: {
                text: '失敗',
                className: 'text-danger',
                badgeClass: 'badge-danger',
                icon: 'bi-exclamation-triangle-fill'
            },
            [CONSTANTS.UPLOAD_STATUS.CANCELLED]: {
                text: '已取消',
                className: 'text-warning',
                badgeClass: 'badge-warning',
                icon: 'bi-x-circle-fill'
            }
        };

        return statusMap[status] || statusMap[CONSTANTS.UPLOAD_STATUS.PENDING];
    },

    // ==========================================
    // URL 和連結格式化
    // ==========================================

    /**
     * 格式化 URL 顯示
     * @param {string} url - 原始 URL
     * @param {number} maxLength - 最大顯示長度
     * @returns {string} 格式化後的 URL
     */
    formatUrl(url, maxLength = 50) {
        if (!url) return '';

        try {
            const urlObj = new URL(url);
            const displayUrl = urlObj.hostname + urlObj.pathname;

            if (displayUrl.length <= maxLength) return displayUrl;

            const halfLength = Math.floor((maxLength - 3) / 2);
            return displayUrl.substring(0, halfLength) + '...' +
                displayUrl.substring(displayUrl.length - halfLength);
        } catch (e) {
            return this.truncateText(url, maxLength);
        }
    },

    /**
     * 建立檔案分享連結文字
     * @param {string} filename - 檔案名稱
     * @param {string} url - 分享 URL
     * @returns {string} 分享連結文字
     */
    formatShareLinkText(filename, url) {
        return `檔案分享：${filename}\n連結：${url}`;
    },

    // ==========================================
    // 陣列和清單格式化
    // ==========================================

    /**
     * 格式化檔案數量
     * @param {number} count - 檔案數量
     * @param {string} type - 檔案類型描述
     * @returns {string} 格式化後的數量描述
     */
    formatFileCount(count, type = '個檔案') {
        if (count === 0) return `沒有${type}`;
        if (count === 1) return `1${type}`;
        return `${this.formatNumber(count)}${type}`;
    },

    /**
     * 格式化選中項目資訊
     * @param {number} selectedCount - 選中數量
     * @param {number} totalCount - 總數量
     * @returns {string} 格式化後的選中資訊
     */
    formatSelectionInfo(selectedCount, totalCount) {
        if (selectedCount === 0) return '';
        if (selectedCount === totalCount) return `已選中全部 ${totalCount} 個檔案`;
        return `已選中 ${selectedCount} / ${totalCount} 個檔案`;
    },

    /**
     * 格式化檔案類型統計
     * @param {object} typeStats - 檔案類型統計
     * @returns {string} 格式化後的統計資訊
     */
    formatFileTypeStats(typeStats) {
        if (!typeStats || typeof typeStats !== 'object') return '';

        const statArray = Object.entries(typeStats)
            .filter(([type, count]) => count > 0)
            .map(([type, count]) => `${type} ${count}個`)
            .slice(0, 3); // 只顯示前3種類型

        if (statArray.length === 0) return '';

        const result = statArray.join('、');
        const totalTypes = Object.keys(typeStats).length;

        if (totalTypes > 3) {
            return result + ` 等${totalTypes}種類型`;
        }

        return result;
    }
};

// 導出到全域
window.FormatUtils = FormatUtils;