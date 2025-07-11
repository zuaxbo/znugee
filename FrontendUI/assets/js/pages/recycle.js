// assets/js/pages/recycle.js

// 註冊 Vue 組件
Vue.component('deleted-file-list', httpVueLoader('assets/js/components/DeletedFileList.vue'));
Vue.component('file-preview-modal', httpVueLoader('assets/js/components/FilePreviewModal.vue'));

new Vue({
    el: '#app',
    data: {
        // 使用者資訊
        /*currentUser: Auth.getCurrentUser(),*/

        // 檔案資料
        files: [],
        selectedFiles: [],

        // 檢視狀態
        loading: false,

        // 搜尋和排序
        searchQuery: '',
        sortOption: 'DeletedAt-desc',
        searchTimeout: null,

        // 分頁
        currentPage: 1,
        totalPages: 1,
        totalFiles: 0,
        pageSize: FILE_CONFIG.PAGE_SIZE,

        // Modal 狀態
        modals: {
            preview: false
        },

        // Modal 資料
        previewFile: null,

        // 確認對話框
        confirmModal: {
            show: false,
            title: '',
            message: '',
            warning: '',
            icon: '',
            buttonClass: '',
            confirmText: '',
            callback: null,
            loading: false
        },

        // 統計資訊
        statistics: {
            totalSize: '0 B',
            oldestDeletedDays: 0,
            expiringSoonCount: 0
        }
    },

    computed: {
        // 分頁顯示頁碼
        visiblePages() {
            const pages = [];
            const maxVisible = 5;
            let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
            let end = Math.min(this.totalPages, start + maxVisible - 1);

            if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            return pages;
        },

        // 是否有選中的檔案
        hasSelection() {
            return this.selectedFiles.length > 0;
        },

        // 是否全選
        isAllSelected() {
            return this.files.length > 0 && this.selectedFiles.length === this.files.length;
        },

        // 總大小
        totalSize() {
            if (this.files.length === 0) return '0 B';
            const total = this.files.reduce((sum, file) => sum + file.FileSize, 0);
            return Utils.formatFileSize(total);
        },

        // 最舊檔案的刪除天數
        oldestDeletedDays() {
            if (this.files.length === 0) return 0;

            const oldest = this.files.reduce((oldest, file) => {
                const deletedDate = new Date(file.UpdatedAt); // 假設 UpdatedAt 是刪除時間
                const oldestDate = new Date(oldest.UpdatedAt);
                return deletedDate < oldestDate ? file : oldest;
            });

            const deletedDate = new Date(oldest.UpdatedAt);
            const now = new Date();
            const diffTime = Math.abs(now - deletedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays;
        },

        // 即將到期的檔案數量（7天內）
        expiringSoonCount() {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

            return this.files.filter(file => {
                const deletedDate = new Date(file.UpdatedAt);
                const expiryDate = new Date(deletedDate);
                expiryDate.setDate(expiryDate.getDate() + 30); // 30天後到期

                return expiryDate <= sevenDaysFromNow;
            }).length;
        }
    },

    async mounted() {
        // 檢查登入狀態
        //if (!Auth.isLoggedIn()) {
        //    window.location.href = 'login.html';
        //    return;
        //}

        // 初始化頁面
        await this.loadFiles();

        // 設定鍵盤快捷鍵
        this.setupKeyboardShortcuts();
    },

    methods: {
        // 載入已刪除檔案列表
        async loadFiles() {
            this.loading = true;

            try {
                const params = {
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    fileName: this.searchQuery,
                    sortBy: this.sortOption.split('-')[0],
                    sortOrder: this.sortOption.split('-')[1]
                };

                const result = await RecycleAPI.getDeletedFiles(params);

                if (result.success) {
                    this.files = result.data;
                    this.totalFiles = result.totalCount;
                    this.totalPages = result.totalPages;
                    this.currentPage = result.currentPage;

                    // 清除不存在檔案的選擇
                    this.selectedFiles = this.selectedFiles.filter(id =>
                        this.files.some(file => file.Id === id)
                    );
                } else {
                    Utils.showToast(result.message || '載入回收筒檔案失敗', 'danger');
                    this.files = [];
                }
            } catch (error) {
                console.error('Load deleted files error:', error);
                Utils.showToast(MESSAGES.ERROR.NETWORK_ERROR, 'danger');
                this.files = [];
            } finally {
                this.loading = false;
            }
        },

        // 搜尋輸入處理
        onSearchInput: Utils.debounce(function () {
            this.currentPage = 1;
            this.loadFiles();
        }, 500),

        // 排序變更處理
        onSortChange() {
            this.currentPage = 1;
            this.loadFiles();
        },

        // 清除搜尋
        clearSearch() {
            this.searchQuery = '';
            this.currentPage = 1;
            this.loadFiles();
        },

        // 分頁變更
        async changePage(page) {
            if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
                this.currentPage = page;
                await this.loadFiles();
            }
        },

        // 檔案選擇切換
        toggleFileSelection(fileId) {
            const index = this.selectedFiles.indexOf(fileId);
            if (index > -1) {
                this.selectedFiles.splice(index, 1);
            } else {
                this.selectedFiles.push(fileId);
            }
        },

        // 全選/取消全選
        toggleSelectAll() {
            if (this.isAllSelected) {
                this.selectedFiles = [];
            } else {
                this.selectedFiles = this.files.map(file => file.Id);
            }
        },

        // 清除選擇
        clearSelection() {
            this.selectedFiles = [];
        },

        // 顯示檔案預覽
        async showFilePreview(file) {
            try {
                // 即使是已刪除的檔案也可以預覽
                const result = await PreviewAPI.getPreviewInfo(file.Id);
                if (result.success) {
                    this.previewFile = result.data;
                    this.modals.preview = true;
                } else {
                    Utils.showToast('無法預覽此檔案', 'warning');
                }
            } catch (error) {
                console.error('Preview error:', error);
                Utils.showToast('預覽檔案時發生錯誤', 'danger');
            }
        },

        // 關閉預覽 Modal
        closePreviewModal() {
            this.modals.preview = false;
            this.previewFile = null;
        },

        // 還原檔案
        async restoreFile(file) {
            this.showConfirmDialog({
                title: '還原檔案',
                message: `確定要還原檔案 "${file.FileName}" 嗎？`,
                icon: 'fas fa-undo text-success',
                buttonClass: 'btn-success',
                confirmText: '還原',
                callback: async () => {
                    await this.performRestoreFile(file.Id, file.FileName);
                }
            });
        },

        // 執行檔案還原
        async performRestoreFile(fileId, fileName) {
            this.confirmModal.loading = true;

            try {
                const result = await RecycleAPI.restoreFile(fileId);
                if (result.success) {
                    Utils.showToast(result.message || `檔案 "${fileName}" 還原成功`, 'success');

                    // 從選擇列表中移除
                    const index = this.selectedFiles.indexOf(fileId);
                    if (index > -1) {
                        this.selectedFiles.splice(index, 1);
                    }

                    // 關閉對話框並重新載入
                    this.hideConfirmDialog();
                    await this.loadFiles();
                } else {
                    Utils.showToast(result.message || '還原檔案失敗', 'danger');
                }
            } catch (error) {
                console.error('Restore error:', error);
                Utils.showToast('還原檔案時發生錯誤', 'danger');
            } finally {
                this.confirmModal.loading = false;
            }
        },

        // 永久刪除檔案
        async permanentDeleteFile(file) {
            this.showConfirmDialog({
                title: '永久刪除檔案',
                message: `確定要永久刪除檔案 "${file.FileName}" 嗎？`,
                warning: '此操作無法復原，檔案將被永久刪除！',
                icon: 'fas fa-exclamation-triangle text-danger',
                buttonClass: 'btn-danger',
                confirmText: '永久刪除',
                callback: async () => {
                    await this.performPermanentDelete(file.Id, file.FileName);
                }
            });
        },

        // 執行永久刪除
        async performPermanentDelete(fileId, fileName) {
            this.confirmModal.loading = true;

            try {
                const result = await RecycleAPI.permanentDelete(fileId);
                if (result.success) {
                    Utils.showToast(result.message || `檔案 "${fileName}" 已永久刪除`, 'success');

                    // 從選擇列表中移除
                    const index = this.selectedFiles.indexOf(fileId);
                    if (index > -1) {
                        this.selectedFiles.splice(index, 1);
                    }

                    // 關閉對話框並重新載入
                    this.hideConfirmDialog();
                    await this.loadFiles();
                } else {
                    Utils.showToast(result.message || '永久刪除失敗', 'danger');
                }
            } catch (error) {
                console.error('Permanent delete error:', error);
                Utils.showToast('永久刪除時發生錯誤', 'danger');
            } finally {
                this.confirmModal.loading = false;
            }
        },

        // 批量還原
        async batchRestore() {
            if (this.selectedFiles.length === 0) {
                Utils.showToast('請先選擇要還原的檔案', 'warning');
                return;
            }

            this.showConfirmDialog({
                title: '批量還原',
                message: `確定要還原 ${this.selectedFiles.length} 個檔案嗎？`,
                icon: 'fas fa-undo text-success',
                buttonClass: 'btn-success',
                confirmText: '批量還原',
                callback: async () => {
                    await this.performBatchRestore();
                }
            });
        },

        // 執行批量還原
        async performBatchRestore() {
            this.confirmModal.loading = true;

            try {
                // 逐個還原檔案
                let successCount = 0;
                let failCount = 0;

                for (const fileId of this.selectedFiles) {
                    try {
                        const result = await RecycleAPI.restoreFile(fileId);
                        if (result.success) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } catch (error) {
                        failCount++;
                    }
                }

                // 顯示結果
                if (successCount > 0) {
                    Utils.showToast(`成功還原 ${successCount} 個檔案${failCount > 0 ? `，${failCount} 個失敗` : ''}`,
                        failCount > 0 ? 'warning' : 'success');
                } else {
                    Utils.showToast('批量還原失敗', 'danger');
                }

                // 清除選擇並重新載入
                this.selectedFiles = [];
                this.hideConfirmDialog();
                await this.loadFiles();

            } catch (error) {
                console.error('Batch restore error:', error);
                Utils.showToast('批量還原時發生錯誤', 'danger');
            } finally {
                this.confirmModal.loading = false;
            }
        },

        // 批量永久刪除
        async batchPermanentDelete() {
            if (this.selectedFiles.length === 0) {
                Utils.showToast('請先選擇要永久刪除的檔案', 'warning');
                return;
            }

            this.showConfirmDialog({
                title: '批量永久刪除',
                message: `確定要永久刪除 ${this.selectedFiles.length} 個檔案嗎？`,
                warning: '此操作無法復原，所有檔案將被永久刪除！',
                icon: 'fas fa-exclamation-triangle text-danger',
                buttonClass: 'btn-danger',
                confirmText: '永久刪除',
                callback: async () => {
                    await this.performBatchPermanentDelete();
                }
            });
        },

        // 執行批量永久刪除
        async performBatchPermanentDelete() {
            this.confirmModal.loading = true;

            try {
                // 逐個永久刪除檔案
                let successCount = 0;
                let failCount = 0;

                for (const fileId of this.selectedFiles) {
                    try {
                        const result = await RecycleAPI.permanentDelete(fileId);
                        if (result.success) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } catch (error) {
                        failCount++;
                    }
                }

                // 顯示結果
                if (successCount > 0) {
                    Utils.showToast(`成功永久刪除 ${successCount} 個檔案${failCount > 0 ? `，${failCount} 個失敗` : ''}`,
                        failCount > 0 ? 'warning' : 'success');
                } else {
                    Utils.showToast('批量永久刪除失敗', 'danger');
                }

                // 清除選擇並重新載入
                this.selectedFiles = [];
                this.hideConfirmDialog();
                await this.loadFiles();

            } catch (error) {
                console.error('Batch permanent delete error:', error);
                Utils.showToast('批量永久刪除時發生錯誤', 'danger');
            } finally {
                this.confirmModal.loading = false;
            }
        },

        // 清空回收筒
        async cleanupRecycleBin() {
            this.showConfirmDialog({
                title: '清空回收筒',
                message: '確定要清空整個資源回收筒嗎？',
                warning: '此操作會永久刪除回收筒中的所有檔案，且無法復原！',
                icon: 'fas fa-trash-alt text-danger',
                buttonClass: 'btn-danger',
                confirmText: '清空回收筒',
                callback: async () => {
                    await this.performCleanup();
                }
            });
        },

        // 執行清空回收筒
        async performCleanup() {
            this.confirmModal.loading = true;

            try {
                const result = await RecycleAPI.cleanup();
                if (result.success) {
                    Utils.showToast(result.message || '資源回收筒已清空', 'success');

                    // 清除選擇並重新載入
                    this.selectedFiles = [];
                    this.hideConfirmDialog();
                    await this.loadFiles();
                } else {
                    Utils.showToast(result.message || '清空回收筒失敗', 'danger');
                }
            } catch (error) {
                console.error('Cleanup error:', error);
                Utils.showToast('清空回收筒時發生錯誤', 'danger');
            } finally {
                this.confirmModal.loading = false;
            }
        },

        // 顯示確認對話框
        showConfirmDialog(options) {
            this.confirmModal = {
                show: true,
                title: options.title,
                message: options.message,
                warning: options.warning || '',
                icon: options.icon,
                buttonClass: options.buttonClass,
                confirmText: options.confirmText,
                callback: options.callback,
                loading: false
            };

            // 使用 Bootstrap Modal
            this.$nextTick(() => {
                const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
                modal.show();
            });
        },

        // 隱藏確認對話框
        hideConfirmDialog() {
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
            if (modal) {
                modal.hide();
            }
            this.confirmModal.show = false;
        },

        // 登出
        async handleLogout() {
            if (confirm('確定要登出嗎？')) {
                try {
                    await AuthAPI.logout();
                } catch (error) {
                    // 即使 API 失敗也要登出
                    Auth.logout();
                }
            }
        },

        // 設定鍵盤快捷鍵
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+A 全選
                if (e.ctrlKey && e.key === 'a' && !e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.toggleSelectAll();
                }

                // Ctrl+R 批量還原
                if (e.ctrlKey && e.key === 'r' && this.selectedFiles.length > 0 && !e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.batchRestore();
                }

                // Delete 鍵永久刪除選中檔案
                if (e.key === 'Delete' && this.selectedFiles.length > 0 && !e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.batchPermanentDelete();
                }

                // Escape 鍵清除選擇
                if (e.key === 'Escape') {
                    this.clearSelection();
                }
            });
        }
    },

    // 組件銷毀前清理
    beforeDestroy() {
        // 清理定時器
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
});