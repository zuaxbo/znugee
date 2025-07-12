/**
 * 表單驗證工具函數
 * 提供各種輸入驗證和表單處理相關的實用方法
 */

const ValidationUtils = {

    // ==========================================
    // 基礎驗證函數
    // ==========================================

    /**
     * 檢查值是否為空
     * @param {any} value - 要檢查的值
     * @returns {boolean} 是否為空
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    },

    /**
     * 檢查字串長度是否在指定範圍內
     * @param {string} value - 要檢查的字串
     * @param {number} min - 最小長度
     * @param {number} max - 最大長度
     * @returns {object} 驗證結果
     */
    validateLength(value, min = 0, max = Infinity) {
        if (typeof value !== 'string') {
            return { isValid: false, message: '輸入必須是文字' };
        }

        const length = value.trim().length;

        if (length < min) {
            return {
                isValid: false,
                message: `最少需要 ${min} 個字元，目前 ${length} 個字元`
            };
        }

        if (length > max) {
            return {
                isValid: false,
                message: `最多允許 ${max} 個字元，目前 ${length} 個字元`
            };
        }

        return { isValid: true, message: '' };
    },

    /**
     * 檢查數值是否在指定範圍內
     * @param {number} value - 要檢查的數值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {object} 驗證結果
     */
    validateRange(value, min = -Infinity, max = Infinity) {
        const numValue = Number(value);

        if (isNaN(numValue)) {
            return { isValid: false, message: '請輸入有效的數字' };
        }

        if (numValue < min) {
            return {
                isValid: false,
                message: `數值不能小於 ${min}`
            };
        }

        if (numValue > max) {
            return {
                isValid: false,
                message: `數值不能大於 ${max}`
            };
        }

        return { isValid: true, message: '' };
    },

    /**
     * 檢查是否符合正則表達式
     * @param {string} value - 要檢查的值
     * @param {RegExp} pattern - 正則表達式
     * @param {string} message - 錯誤訊息
     * @returns {object} 驗證結果
     */
    validatePattern(value, pattern, message = '格式不正確') {
        if (typeof value !== 'string') {
            return { isValid: false, message: '輸入必須是文字' };
        }

        if (!pattern.test(value)) {
            return { isValid: false, message };
        }

        return { isValid: true, message: '' };
    },

    // ==========================================
    // 檔案相關驗證
    // ==========================================

    /**
     * 驗證檔案名稱
     * @param {string} filename - 檔案名稱
     * @returns {object} 驗證結果
     */
    validateFileName(filename) {
        // 檢查是否為空
        if (this.isEmpty(filename)) {
            return { isValid: false, message: '檔案名稱不能為空' };
        }

        // 檢查長度
        const lengthResult = this.validateLength(filename, 1, 255);
        if (!lengthResult.isValid) {
            return lengthResult;
        }

        // 檢查是否包含非法字元
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (invalidChars.test(filename)) {
            return {
                isValid: false,
                message: '檔案名稱不能包含以下字元：< > : " / \\ | ? *'
            };
        }

        // 檢查 Windows 保留名稱
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
        if (reservedNames.test(filename)) {
            return {
                isValid: false,
                message: '檔案名稱不能使用系統保留名稱'
            };
        }

        // 檢查是否以點或空格結尾
        if (filename.endsWith('.') || filename.endsWith(' ')) {
            return {
                isValid: false,
                message: '檔案名稱不能以點號或空格結尾'
            };
        }

        // 檢查是否以點開頭且只有點
        if (filename.startsWith('.') && filename.replace(/\./g, '').length === 0) {
            return {
                isValid: false,
                message: '檔案名稱不能只包含點號'
            };
        }

        return { isValid: true, message: '' };
    },

    /**
     * 驗證檔案大小
     * @param {File|number} file - 檔案物件或大小（位元組）
     * @param {number} maxSize - 最大大小（位元組）
     * @returns {object} 驗證結果
     */
    validateFileSize(file, maxSize = API_CONFIG.upload.maxFileSize) {
        let fileSize;

        if (file instanceof File) {
            fileSize = file.size;
        } else if (typeof file === 'number') {
            fileSize = file;
        } else {
            return { isValid: false, message: '無效的檔案' };
        }

        if (fileSize <= 0) {
            return { isValid: false, message: '檔案不能為空' };
        }

        if (fileSize > maxSize) {
            return {
                isValid: false,
                message: `檔案大小不能超過 ${FileUtils.formatFileSize(maxSize)}，目前 ${FileUtils.formatFileSize(fileSize)}`
            };
        }

        return { isValid: true, message: '' };
    },

    /**
     * 驗證檔案類型
     * @param {File|string} file - 檔案物件或檔案名稱
     * @param {Array} allowedTypes - 允許的檔案類型
     * @returns {object} 驗證結果
     */
    validateFileType(file, allowedTypes = API_CONFIG.upload.allowedTypes) {
        let mimeType, filename;

        if (file instanceof File) {
            mimeType = file.type;
            filename = file.name;
        } else if (typeof file === 'string') {
            filename = file;
            mimeType = FileUtils.getMimeTypeFromExtension(
                FileUtils.getFileExtension(filename)
            );
        } else {
            return { isValid: false, message: '無效的檔案' };
        }

        // 檢查 MIME 類型
        if (mimeType && allowedTypes.includes(mimeType)) {
            return { isValid: true, message: '' };
        }

        // 檢查副檔名
        const extension = FileUtils.getFileExtension(filename);
        const isExtensionAllowed = Object.values(CONSTANTS.FILE_TYPES).some(typeInfo =>
            typeInfo.extensions && typeInfo.extensions.includes(extension)
        );

        if (!isExtensionAllowed) {
            return {
                isValid: false,
                message: `不支援的檔案類型：${extension || '未知'}`
            };
        }

        return { isValid: true, message: '' };
    },

    /**
     * 綜合驗證檔案
     * @param {File} file - 檔案物件
     * @param {object} options - 驗證選項
     * @returns {object} 驗證結果
     */
    validateFile(file, options = {}) {
        const {
            maxSize = API_CONFIG.upload.maxFileSize,
            allowedTypes = API_CONFIG.upload.allowedTypes,
            checkName = true
        } = options;

        // 檢查檔案物件
        if (!file || !(file instanceof File)) {
            return { isValid: false, message: '請選擇有效的檔案' };
        }

        // 驗證檔案名稱
        if (checkName) {
            const nameResult = this.validateFileName(file.name);
            if (!nameResult.isValid) {
                return nameResult;
            }
        }

        // 驗證檔案大小
        const sizeResult = this.validateFileSize(file, maxSize);
        if (!sizeResult.isValid) {
            return sizeResult;
        }

        // 驗證檔案類型
        const typeResult = this.validateFileType(file, allowedTypes);
        if (!typeResult.isValid) {
            return typeResult;
        }

        return { isValid: true, message: '檔案驗證通過' };
    },

    // ==========================================
    // 批量驗證
    // ==========================================

    /**
     * 驗證多個檔案
     * @param {FileList|Array} files - 檔案列表
     * @param {object} options - 驗證選項
     * @returns {object} 驗證結果
     */
    validateFiles(files, options = {}) {
        const {
            maxFiles = API_CONFIG.upload.maxConcurrentUploads,
            maxTotalSize = CONSTANTS.FILE_SIZE_LIMITS.MAX_BATCH_SIZE,
            individual = true // 是否個別驗證每個檔案
        } = options;

        // 轉換為陣列
        const fileArray = Array.from(files || []);

        // 檢查檔案數量
        if (fileArray.length === 0) {
            return { isValid: false, message: '請選擇至少一個檔案' };
        }

        if (fileArray.length > maxFiles) {
            return {
                isValid: false,
                message: `最多只能選擇 ${maxFiles} 個檔案，目前選擇了 ${fileArray.length} 個檔案`
            };
        }

        // 檢查總檔案大小
        const totalSize = fileArray.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalSize > maxTotalSize) {
            return {
                isValid: false,
                message: `檔案總大小不能超過 ${FileUtils.formatFileSize(maxTotalSize)}，目前 ${FileUtils.formatFileSize(totalSize)}`
            };
        }

        // 個別驗證每個檔案
        if (individual) {
            const invalidFiles = [];

            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                const result = this.validateFile(file, options);

                if (!result.isValid) {
                    invalidFiles.push({
                        file: file,
                        index: i,
                        message: result.message
                    });
                }
            }

            if (invalidFiles.length > 0) {
                const errorMessage = invalidFiles.length === 1
                    ? `檔案 "${invalidFiles[0].file.name}" ${invalidFiles[0].message}`
                    : `${invalidFiles.length} 個檔案驗證失敗`;

                return {
                    isValid: false,
                    message: errorMessage,
                    invalidFiles: invalidFiles
                };
            }
        }

        return {
            isValid: true,
            message: `${fileArray.length} 個檔案驗證通過`,
            totalSize: totalSize,
            fileCount: fileArray.length
        };
    },

    /**
     * 檢查檔案名稱重複
     * @param {Array} files - 檔案列表
     * @param {Array} existingNames - 已存在的檔案名稱
     * @returns {object} 檢查結果
     */
    checkDuplicateNames(files, existingNames = []) {
        const fileArray = Array.from(files || []);
        const allNames = [...existingNames];
        const duplicates = [];
        const newFiles = [];

        fileArray.forEach((file, index) => {
            const filename = file.name || file.fileName;

            if (allNames.includes(filename)) {
                duplicates.push({
                    file: file,
                    index: index,
                    name: filename
                });
            } else {
                allNames.push(filename);
                newFiles.push(file);
            }
        });

        return {
            hasDuplicates: duplicates.length > 0,
            duplicates: duplicates,
            validFiles: newFiles,
            message: duplicates.length > 0
                ? `發現 ${duplicates.length} 個重複的檔案名稱`
                : '沒有重複的檔案名稱'
        };
    },

    // ==========================================
    // 搜尋和輸入驗證
    // ==========================================

    /**
     * 驗證搜尋關鍵字
     * @param {string} query - 搜尋關鍵字
     * @returns {object} 驗證結果
     */
    validateSearchQuery(query) {
        if (this.isEmpty(query)) {
            return { isValid: false, message: '請輸入搜尋關鍵字' };
        }

        const trimmedQuery = query.trim();

        if (trimmedQuery.length < API_CONFIG.search.minSearchLength) {
            return {
                isValid: false,
                message: `搜尋關鍵字至少需要 ${API_CONFIG.search.minSearchLength} 個字元`
            };
        }

        if (trimmedQuery.length > 100) {
            return {
                isValid: false,
                message: '搜尋關鍵字不能超過 100 個字元'
            };
        }

        // 檢查特殊字元
        const invalidPattern = /[<>]/;
        if (invalidPattern.test(trimmedQuery)) {
            return {
                isValid: false,
                message: '搜尋關鍵字不能包含 < 或 > 字元'
            };
        }

        return { isValid: true, message: '', query: trimmedQuery };
    },

    /**
     * 驗證分頁參數
     * @param {number} page - 頁碼
     * @param {number} pageSize - 每頁大小
     * @returns {object} 驗證結果
     */
    validatePagination(page, pageSize) {
        const pageNum = parseInt(page);
        const pageSizeNum = parseInt(pageSize);

        if (isNaN(pageNum) || pageNum < 1) {
            return {
                isValid: false,
                message: '頁碼必須是大於 0 的整數'
            };
        }

        if (isNaN(pageSizeNum) || pageSizeNum < 1) {
            return {
                isValid: false,
                message: '每頁大小必須是大於 0 的整數'
            };
        }

        if (pageSizeNum > API_CONFIG.pagination.maxPageSize) {
            return {
                isValid: false,
                message: `每頁大小不能超過 ${API_CONFIG.pagination.maxPageSize}`
            };
        }

        return {
            isValid: true,
            message: '',
            page: pageNum,
            pageSize: pageSizeNum
        };
    },

    // ==========================================
    // URL 和連結驗證
    // ==========================================

    /**
     * 驗證 URL 格式
     * @param {string} url - URL 字串
     * @returns {object} 驗證結果
     */
    validateUrl(url) {
        if (this.isEmpty(url)) {
            return { isValid: false, message: 'URL 不能為空' };
        }

        try {
            new URL(url);
            return { isValid: true, message: '' };
        } catch (e) {
            return { isValid: false, message: 'URL 格式不正確' };
        }
    },

    /**
     * 驗證電子郵件格式
     * @param {string} email - 電子郵件地址
     * @returns {object} 驗證結果
     */
    validateEmail(email) {
        if (this.isEmpty(email)) {
            return { isValid: false, message: '電子郵件不能為空' };
        }

        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!emailPattern.test(email)) {
            return { isValid: false, message: '電子郵件格式不正確' };
        }

        return { isValid: true, message: '' };
    },

    // ==========================================
    // 表單驗證組合函數
    // ==========================================

    /**
     * 驗證表單欄位
     * @param {object} formData - 表單數據
     * @param {object} rules - 驗證規則
     * @returns {object} 驗證結果
     */
    validateForm(formData, rules) {
        const errors = {};
        let isValid = true;

        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];

            // 檢查必填欄位
            if (fieldRules.required && this.isEmpty(value)) {
                errors[field] = fieldRules.requiredMessage || `${field} 為必填欄位`;
                isValid = false;
                return;
            }

            // 如果不是必填且為空，跳過其他驗證
            if (!fieldRules.required && this.isEmpty(value)) {
                return;
            }

            // 檢查長度
            if (fieldRules.minLength || fieldRules.maxLength) {
                const lengthResult = this.validateLength(
                    value,
                    fieldRules.minLength || 0,
                    fieldRules.maxLength || Infinity
                );
                if (!lengthResult.isValid) {
                    errors[field] = lengthResult.message;
                    isValid = false;
                    return;
                }
            }

            // 檢查數值範圍
            if (fieldRules.min !== undefined || fieldRules.max !== undefined) {
                const rangeResult = this.validateRange(
                    value,
                    fieldRules.min || -Infinity,
                    fieldRules.max || Infinity
                );
                if (!rangeResult.isValid) {
                    errors[field] = rangeResult.message;
                    isValid = false;
                    return;
                }
            }

            // 檢查正則表達式
            if (fieldRules.pattern) {
                const patternResult = this.validatePattern(
                    value,
                    fieldRules.pattern,
                    fieldRules.patternMessage || '格式不正確'
                );
                if (!patternResult.isValid) {
                    errors[field] = patternResult.message;
                    isValid = false;
                    return;
                }
            }

            // 自定義驗證函數
            if (fieldRules.validator && typeof fieldRules.validator === 'function') {
                const customResult = fieldRules.validator(value, formData);
                if (!customResult.isValid) {
                    errors[field] = customResult.message;
                    isValid = false;
                    return;
                }
            }
        });

        return {
            isValid: isValid,
            errors: errors,
            message: isValid ? '表單驗證通過' : '表單驗證失敗'
        };
    },

    /**
     * 實時驗證欄位
     * @param {string} field - 欄位名稱
     * @param {any} value - 欄位值
     * @param {object} rule - 驗證規則
     * @returns {object} 驗證結果
     */
    validateField(field, value, rule) {
        if (!rule) return { isValid: true, message: '' };

        const formData = { [field]: value };
        const rules = { [field]: rule };

        const result = this.validateForm(formData, rules);

        return {
            isValid: result.isValid,
            message: result.errors[field] || ''
        };
    },

    // ==========================================
    // 工具函數
    // ==========================================

    /**
     * 清理和標準化輸入值
     * @param {string} value - 輸入值
     * @param {object} options - 清理選項
     * @returns {string} 清理後的值
     */
    sanitizeInput(value, options = {}) {
        if (typeof value !== 'string') return '';

        const {
            trim = true,
            removeHtml = false,
            maxLength = null
        } = options;

        let cleaned = value;

        // 去除前後空格
        if (trim) {
            cleaned = cleaned.trim();
        }

        // 移除 HTML 標籤
        if (removeHtml) {
            cleaned = cleaned.replace(/<[^>]*>/g, '');
        }

        // 限制長度
        if (maxLength && cleaned.length > maxLength) {
            cleaned = cleaned.substring(0, maxLength);
        }

        return cleaned;
    },

    /**
     * 建立驗證錯誤訊息
     * @param {string} field - 欄位名稱
     * @param {string} rule - 規則名稱
     * @param {object} params - 參數
     * @returns {string} 錯誤訊息
     */
    buildErrorMessage(field, rule, params = {}) {
        const messages = {
            required: `${field} 為必填欄位`,
            minLength: `${field} 最少需要 ${params.min} 個字元`,
            maxLength: `${field} 最多允許 ${params.max} 個字元`,
            min: `${field} 不能小於 ${params.min}`,
            max: `${field} 不能大於 ${params.max}`,
            email: `${field} 格式不正確`,
            url: `${field} URL 格式不正確`,
            pattern: `${field} 格式不正確`
        };

        return messages[rule] || `${field} 驗證失敗`;
    }
};

// 導出到全域
window.ValidationUtils = ValidationUtils;