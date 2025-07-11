// assets/js/pages/files.js

// 註冊 Vue 組件
Vue.component('file-grid-item', httpVueLoader('assets/js/components/FileGridItem.vue'));
Vue.component('file-list-view', httpVueLoader('assets/js/components/FileListView.vue'));
Vue.component('file-upload-modal', httpVueLoader('assets/js/components/FileUploadModal.vue'));
Vue.component('file-preview-modal', httpVueLoader('assets/js/components/FilePreviewModal.vue'));
Vue.component('file-rename-modal', httpVueLoader('assets/js/components/FileRenameModal.vue'));

new Vue({
    el: '#app',
    data: {
        // 使用者資訊
        /*currentUser: Auth.getCurrentUser(),*/

        // 檔案資料
        files: [],
        selectedFiles: [],

        // 檢視狀態
        viewMode: AppState.currentView, // 'grid' 或 'list'
        loading: false,

        // 搜尋和排序
        searchQuery: '',
        sortOption: 'UploadedAt-desc',
        searchTimeout: null,

        // 分頁
        currentPage: 1,
        totalPages: 1,
        totalFiles: 0,
        pageSize: FILE_CONFIG.PAGE_SIZE,

        // Modal 狀態
        modals: {
            upload: false,
            preview: false,
            rename: false
        },

        // Modal 資料
        previewFile: null,
        renameFile: null,

        // 統計資訊
        statistics: null
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
        }
    },

    async mounted() {
        // 檢查登入狀態
        //if (!Auth.isLoggedIn()) {
        //    window.location.href = 'login.html';
        //    return;
        //}

        // 初始化
        await this.initializePage();

        // 設定拖放上傳
        this.setupDragAndDrop();

        // 設定鍵盤快捷鍵
        this.setupKeyboardShortcuts();
    },

    methods: {
        // 初始化頁面
        async initializePage() {
            await Promise.all([
                this.loadFiles(),
                this.loadStatistics()
            ]);
        },

        // 載入檔案列表
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

                const result = await FileAPI.getFiles(params);

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
                    Utils.showToast(result.message || '載入檔案列表失敗', 'danger');
                    this.files = [];
                }
            } catch (error) {
                console.error('Load files error:', error);
                Utils.showToast(MESSAGES.ERROR.NETWORK_ERROR, 'danger');
                this.files = [];
            } finally {
                this.loading = false;
            }
        },

        // 載入統計資訊
        async loadStatistics() {
            try {
                const result = await FileAPI.getStatistics();
                if (result.success) {
                    this.statistics = result.data;
                }
            } catch (error) {
                console.error('Load statistics error:', error);
            }
        },

        // 設定檢視模式
        setViewMode(mode) {
            this.viewMode = mode;
            AppState.setViewMode(mode);
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

        // 顯示上傳 Modal
        showUploadModal() {
            this.modals.upload = true;
        },

        // 關閉上傳 Modal
        closeUploadModal() {
            this.modals.upload = false;
        },

        // 檔案上傳完成處理
        async onFileUploaded(uploadedFile) {
            // 重新載入檔案列表
            await this.loadFiles();
            await this.loadStatistics();

            Utils.showToast(`檔案 "${uploadedFile.FileName}" 上傳成功`, 'success');
        },

        // 顯示檔案預覽
        async showFilePreview(file) {
            try {
                const result = await FileAPI.getFilePreview(file.Id);
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

        // 下載檔案
        async downloadFile(file) {
            try {
                const result = await FileAPI.downloadFile(file.Id, file.FileName);
                if (result.success) {
                    Utils.showToast(`正在下載 "${file.FileName}"`, 'info');
                } else {
                    Utils.showToast('下載檔案失敗', 'danger');
                }
            } catch (error) {
                console.error('Download error:', error);
                Utils.showToast('下載檔案時發生錯誤', 'danger');
            }
        },

        // 顯示重新命名 Modal
        showRenameModal(file) {
            this.renameFile = file;
            this.modals.rename = true;
        },

        // 關閉重新命名 Modal
        closeRenameModal() {
            this.modals.rename = false;
            this.renameFile = null;
        },

        // 檔案重新命名完成
        async onFileRenamed(renamedFile) {
            // 重新載入檔案列表
            await this.loadFiles();
            Utils.showToast(`檔案重新命名成功`, 'success');
        },

        // 刪除檔案
        async deleteFile(file) {
            if (!confirm(`確定要刪除檔案 "${file.FileName}" 嗎？\n檔案將移至資源回收筒。`)) {
                return;
            }

            try {
                const result = await FileAPI.deleteFile(file.Id);
                if (result.success) {
                    Utils.showToast(result.message || `檔案 "${file.FileName}" 已移至資源回收筒`, 'success');

                    // 從選擇列表中移除
                    const index = this.selectedFiles.indexOf(file.Id);
                    if (index > -1) {
                        this.selectedFiles.splice(index, 1);
                    }

                    // 重新載入檔案列表
                    await this.loadFiles();
                    await this.loadStatistics();
                } else {
                    Utils.showToast(result.message || '刪除檔案失敗', 'danger');
                }
            } catch (error) {
                console.error('Delete error:', error);
                Utils.showToast('刪除檔案時發生錯誤', 'danger');
            }
        },

        // 批量刪除
        async batchDelete() {
            if (this.selectedFiles.length === 0) {
                Utils.showToast('請先選擇要刪除的檔案', 'warning');
                return;
            }

            if (!confirm(`確定要刪除 ${this.selectedFiles.length} 個檔案嗎？\n檔案將移至資源回收筒。`)) {
                return;
            }

            try {
                const result = await FileAPI.batchOperation(this.selectedFiles, 'delete');
                if (result.success) {
                    Utils.showToast(result.message || '批量刪除完成', 'success');
                    this.selectedFiles = [];

                    // 重新載入檔案列表
                    await this.loadFiles();
                    await this.loadStatistics();
                } else {
                    Utils.showToast(result.message || '批量刪除失敗', 'danger');
                }
            } catch (error) {
                console.error('Batch delete error:', error);
                Utils.showToast('批量刪除時發生錯誤', 'danger');
            }
        },

        // 複製檔案連結
        async copyFileLink(file) {
            try {
                const success = await FileUtils.copyFileLink(file.Id, file.FileName);
                if (!success) {
                    // 降級方案：顯示連結讓使用者手動複製
                    const url = FileAPI.getDownloadUrl(file.Id);
                    prompt('請手動複製下面的連結：', url);
                }
            } catch (error) {
                console.error('Copy link error:', error);
                Utils.showToast('複製連結時發生錯誤', 'danger');
            }
        },

        // 前往資源回收筒
        goToRecycleBin() {
            window.location.href = 'recycle.html';
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

        // 設定拖放上傳
        setupDragAndDrop() {
            const dropZone = document.body;

            FileUtils.setupDragAndDrop(dropZone, (files) => {
                // 驗證檔案
                const validation = FileUtils.validateFiles(files);

                if (validation.invalid.length > 0) {
                    Utils.showToast(`${validation.invalid.length} 個檔案格式不正確`, 'warning');
                }

                if (validation.valid.length > 0) {
                    // 如果有有效檔案，開啟上傳 Modal 並傳入檔案
                    this.showUploadModal();

                    // 通知上傳組件有拖放的檔案
                    this.$nextTick(() => {
                        this.$emit('files-dropped', validation.valid);
                    });
                }
            });
        },

        // 設定鍵盤快捷鍵
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+A 全選
                if (e.ctrlKey && e.key === 'a' && !e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.toggleSelectAll();
                }

                // Delete 鍵刪除選中檔案
                if (e.key === 'Delete' && this.selectedFiles.length > 0 && !e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.batchDelete();
                }

                // Ctrl+U 上傳檔案
                if (e.ctrlKey && e.key === 'u') {
                    e.preventDefault();
                    this.showUploadModal();
                }

                // Escape 鍵清除選擇
                if (e.key === 'Escape') {
                    this.clearSelection();
                }
            });
        }
    },

    watch: {
        // 監聽搜尋查詢變化
        searchQuery(newValue) {
            AppState.setSearchQuery(newValue);
        },

        // 監聽選中檔案變化
        selectedFiles(newValue) {
            AppState.selectedFiles = newValue;
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