/**
 * 用戶服務
 * 提供用戶資訊管理和偏好設定功能
 */

const UserService = {

    // 用戶資訊快取
    _currentUser: null,
    _userPreferences: null,

    // ==========================================
    // 用戶資訊管理
    // ==========================================

    /**
     * 獲取當前用戶資訊
     * @param {boolean} useCache - 是否使用快取
     * @returns {Promise<object>} 用戶資訊
     */
    async getCurrentUser(useCache = true) {
        // 檢查快取
        if (useCache && this._currentUser) {
            console.log('👤 使用用戶資訊快取');
            return {
                success: true,
                data: this._currentUser,
                user: this._currentUser,
                fromCache: true
            };
        }

        try {
            console.log('👤 獲取當前用戶資訊');

            const response = await axios.get(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.userProfile),
                { timeout: API_CONFIG.request.timeout }
            );

            console.log('✅ 用戶資訊獲取成功:', response.data);

            // 更新快取
            this._currentUser = response.data.user || response.data;

            return {
                success: true,
                data: response.data,
                user: this._currentUser
            };

        } catch (error) {
            console.error('❌ 獲取用戶資訊失敗:', error);

            // 如果是開發模式且後端不可用，返回測試用戶
            if (API_CONFIG.isDevelopment && this._isBackendUnavailable(error)) {
                const testUser = this._getTestUser();
                this._currentUser = testUser;

                return {
                    success: true,
                    data: { user: testUser },
                    user: testUser,
                    isTestUser: true,
                    message: '使用測試用戶資料'
                };
            }

            if (this._isBackendUnavailable(error)) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'GET_USER_FAILED',
                message: error.response?.data?.message || '獲取用戶資訊失敗'
            };
        }
    },

    /**
     * 更新用戶資訊
     * @param {object} userData - 用戶數據
     * @returns {Promise<object>} 更新結果
     */
    async updateUserProfile(userData) {
        if (!userData || typeof userData !== 'object') {
            return {
                success: false,
                error: 'INVALID_USER_DATA',
                message: '用戶數據不正確'
            };
        }

        // 基本驗證
        const validation = this._validateUserData(userData);
        if (!validation.isValid) {
            return {
                success: false,
                error: 'VALIDATION_FAILED',
                message: validation.message
            };
        }

        try {
            console.log('👤 更新用戶資訊:', userData);

            const response = await axios.put(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.userProfile),
                userData,
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 用戶資訊更新成功:', response.data);

            // 更新快取
            this._currentUser = response.data.user || response.data;

            return {
                success: true,
                data: response.data,
                user: this._currentUser,
                message: '用戶資訊更新成功'
            };

        } catch (error) {
            console.error('❌ 更新用戶資訊失敗:', error);

            if (this._isBackendUnavailable(error)) {
                return {
                    success: false,
                    error: 'BACKEND_NOT_AVAILABLE',
                    message: CONSTANTS.ERROR_MESSAGES.BACKEND_NOT_AVAILABLE,
                    isBackendDown: true
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'UPDATE_USER_FAILED',
                message: error.response?.data?.message || '更新用戶資訊失敗'
            };
        }
    },

    // ==========================================
    // 用戶偏好設定
    // ==========================================

    /**
     * 獲取用戶偏好設定
     * @param {boolean} useCache - 是否使用快取
     * @returns {Promise<object>} 偏好設定
     */
    async getUserPreferences(useCache = true) {
        // 檢查快取
        if (useCache && this._userPreferences) {
            console.log('⚙️ 使用偏好設定快取');
            return {
                success: true,
                data: this._userPreferences,
                preferences: this._userPreferences,
                fromCache: true
            };
        }

        try {
            console.log('⚙️ 獲取用戶偏好設定');

            const response = await axios.get(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.userProfile + '/preferences'),
                { timeout: API_CONFIG.request.timeout }
            );

            console.log('✅ 偏好設定獲取成功:', response.data);

            // 更新快取
            this._userPreferences = response.data.preferences || response.data;

            return {
                success: true,
                data: response.data,
                preferences: this._userPreferences
            };

        } catch (error) {
            console.error('❌ 獲取偏好設定失敗:', error);

            // 如果後端不可用，使用本地儲存的偏好設定
            if (this._isBackendUnavailable(error)) {
                const localPreferences = this._getLocalPreferences();
                this._userPreferences = localPreferences;

                return {
                    success: true,
                    data: { preferences: localPreferences },
                    preferences: localPreferences,
                    isLocal: true,
                    message: '使用本地偏好設定'
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'GET_PREFERENCES_FAILED',
                message: error.response?.data?.message || '獲取偏好設定失敗'
            };
        }
    },

    /**
     * 更新用戶偏好設定
     * @param {object} preferences - 偏好設定
     * @returns {Promise<object>} 更新結果
     */
    async updateUserPreferences(preferences) {
        if (!preferences || typeof preferences !== 'object') {
            return {
                success: false,
                error: 'INVALID_PREFERENCES',
                message: '偏好設定數據不正確'
            };
        }

        try {
            console.log('⚙️ 更新用戶偏好設定:', preferences);

            const response = await axios.put(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.userProfile + '/preferences'),
                { preferences },
                {
                    headers: API_CONFIG.request.defaultHeaders,
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 偏好設定更新成功:', response.data);

            // 更新快取
            this._userPreferences = response.data.preferences || preferences;

            // 同時保存到本地儲存
            this._saveLocalPreferences(this._userPreferences);

            return {
                success: true,
                data: response.data,
                preferences: this._userPreferences,
                message: '偏好設定更新成功'
            };

        } catch (error) {
            console.error('❌ 更新偏好設定失敗:', error);

            // 如果後端不可用，僅保存到本地
            if (this._isBackendUnavailable(error)) {
                this._userPreferences = preferences;
                this._saveLocalPreferences(preferences);

                return {
                    success: true,
                    data: { preferences },
                    preferences: preferences,
                    isLocal: true,
                    message: '偏好設定已保存到本地'
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'UPDATE_PREFERENCES_FAILED',
                message: error.response?.data?.message || '更新偏好設定失敗'
            };
        }
    },

    /**
     * 重置偏好設定為預設值
     * @returns {Promise<object>} 重置結果
     */
    async resetUserPreferences() {
        const defaultPreferences = this._getDefaultPreferences();
        return await this.updateUserPreferences(defaultPreferences);
    },

    // ==========================================
    // 用戶使用統計
    // ==========================================

    /**
     * 獲取用戶使用統計
     * @param {object} options - 統計選項
     * @returns {Promise<object>} 使用統計
     */
    async getUserStatistics(options = {}) {
        const {
            period = '30days',
            includeStorage = true,
            includeActivity = true
        } = options;

        try {
            console.log('📊 獲取用戶使用統計:', { period, includeStorage, includeActivity });

            const response = await axios.get(
                API_CONFIG.buildUrl(API_CONFIG.endpoints.userProfile + '/statistics'),
                {
                    params: {
                        period,
                        includeStorage,
                        includeActivity
                    },
                    timeout: API_CONFIG.request.timeout
                }
            );

            console.log('✅ 使用統計獲取成功:', response.data);

            return {
                success: true,
                data: response.data,
                statistics: response.data.statistics || response.data
            };

        } catch (error) {
            console.error('❌ 獲取使用統計失敗:', error);

            if (this._isBackendUnavailable(error)) {
                // 返回模擬統計數據
                const mockStatistics = this._getMockStatistics();

                return {
                    success: true,
                    data: { statistics: mockStatistics },
                    statistics: mockStatistics,
                    isMock: true,
                    message: '使用模擬統計數據'
                };
            }

            return {
                success: false,
                error: error.response?.data?.error || 'GET_STATISTICS_FAILED',
                message: error.response?.data?.message || '獲取使用統計失敗'
            };
        }
    },

    // ==========================================
    // 快取和本地儲存管理
    // ==========================================

    /**
     * 清除用戶資訊快取
     */
    clearUserCache() {
        this._currentUser = null;
        this._userPreferences = null;
        console.log('🧹 用戶資訊快取已清除');
    },

    /**
     * 同步本地偏好設定到伺服器
     * @returns {Promise<object>} 同步結果
     */
    async syncLocalPreferences() {
        const localPreferences = this._getLocalPreferences();
        if (!localPreferences || Object.keys(localPreferences).length === 0) {
            return {
                success: false,
                error: 'NO_LOCAL_PREFERENCES',
                message: '沒有本地偏好設定需要同步'
            };
        }

        console.log('🔄 同步本地偏好設定到伺服器');
        return await this.updateUserPreferences(localPreferences);
    },

    // ==========================================
    // 私有方法
    // ==========================================

    /**
     * 獲取測試用戶資料
     * @returns {object} 測試用戶
     * @private
     */
    _getTestUser() {
        return {
            id: 'test_user_001',
            username: '測試用戶',
            email: 'test@example.com',
            displayName: '測試用戶',
            avatar: null,
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            storageUsed: 0,
            storageLimit: 1024 * 1024 * 1024, // 1GB
            isActive: true
        };
    },

    /**
     * 獲取預設偏好設定
     * @returns {object} 預設偏好設定
     * @private
     */
    _getDefaultPreferences() {
        return {
            // 顯示設定
            viewMode: CONSTANTS.VIEW_MODES.GRID,
            sortBy: 'uploadedAt',
            sortDirection: 'desc',
            pageSize: API_CONFIG.pagination.pageSize,

            // 語言和地區
            language: 'zh-TW',
            timezone: 'Asia/Taipei',
            dateFormat: 'YYYY/MM/DD',
            timeFormat: '24h',

            // 功能設定
            autoPreview: true,
            showThumbnails: true,
            enableHotkeys: true,
            autoSave: true,

            // 通知設定
            showUploadProgress: true,
            showSuccessMessages: true,
            showErrorMessages: true,
            soundNotifications: false,

            // 隱私設定
            shareAnalytics: false,
            rememberPreferences: true,

            // 主題設定
            theme: 'auto', // auto, light, dark
            colorScheme: 'default',

            // 進階設定
            enableDebugMode: false,
            maxConcurrentUploads: API_CONFIG.upload.maxConcurrentUploads
        };
    },

    /**
     * 從本地儲存獲取偏好設定
     * @returns {object} 本地偏好設定
     * @private
     */
    _getLocalPreferences() {
        try {
            const stored = localStorage.getItem(CONSTANTS.STORAGE_KEYS.USER_PREFERENCES);
            if (stored) {
                const preferences = JSON.parse(stored);
                console.log('📱 從本地儲存載入偏好設定');
                return { ...this._getDefaultPreferences(), ...preferences };
            }
        } catch (error) {
            console.warn('⚠️ 載入本地偏好設定失敗:', error);
        }

        return this._getDefaultPreferences();
    },

    /**
     * 保存偏好設定到本地儲存
     * @param {object} preferences - 偏好設定
     * @private
     */
    _saveLocalPreferences(preferences) {
        try {
            localStorage.setItem(
                CONSTANTS.STORAGE_KEYS.USER_PREFERENCES,
                JSON.stringify(preferences)
            );
            console.log('💾 偏好設定已保存到本地儲存');
        } catch (error) {
            console.warn('⚠️ 保存偏好設定到本地失敗:', error);
        }
    },

    /**
     * 驗證用戶數據
     * @param {object} userData - 用戶數據
     * @returns {object} 驗證結果
     * @private
     */
    _validateUserData(userData) {
        // 檢查電子郵件格式
        if (userData.email) {
            const emailValidation = ValidationUtils.validateEmail(userData.email);
            if (!emailValidation.isValid) {
                return emailValidation;
            }
        }

        // 檢查用戶名長度
        if (userData.username) {
            const usernameValidation = ValidationUtils.validateLength(userData.username, 2, 50);
            if (!usernameValidation.isValid) {
                return {
                    isValid: false,
                    message: '用戶名' + usernameValidation.message
                };
            }
        }

        // 檢查顯示名稱長度
        if (userData.displayName) {
            const displayNameValidation = ValidationUtils.validateLength(userData.displayName, 1, 100);
            if (!displayNameValidation.isValid) {
                return {
                    isValid: false,
                    message: '顯示名稱' + displayNameValidation.message
                };
            }
        }

        return { isValid: true, message: '' };
    },

    /**
     * 獲取模擬統計數據
     * @returns {object} 模擬統計
     * @private
     */
    _getMockStatistics() {
        return {
            storage: {
                used: 0,
                limit: 1024 * 1024 * 1024, // 1GB
                percentage: 0
            },
            files: {
                total: 0,
                uploaded: 0,
                deleted: 0
            },
            activity: {
                loginCount: 1,
                lastLogin: new Date().toISOString(),
                uploadSessions: 0,
                downloadCount: 0
            },
            period: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString(),
                days: 30
            }
        };
    },

    /**
     * 檢查後端是否不可用
     * @param {Error} error - 錯誤物件
     * @returns {boolean} 是否不可用
     * @private
     */
    _isBackendUnavailable(error) {
        return (
            error.code === 'ECONNREFUSED' ||
            error.code === 'ERR_NETWORK' ||
            error.code === 'NETWORK_ERROR' ||
            !error.response ||
            error.response?.status === 404 ||
            error.response?.status >= 500
        );
    }
};

// 導出到全域
window.UserService = UserService;