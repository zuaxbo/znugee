<template>
    <div class="file-manager">
        <!-- 頂部工具欄 -->
        <div class="file-manager-header">
            <div class="header-left">
                <!-- 搜尋欄 -->
                <div class="search-section">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="bi bi-search"></i>
                        </span>
                        <input type="text"
                               class="form-control"
                               placeholder="搜尋檔案..."
                               v-model="searchQuery"
                               @input="handleSearchInput"
                               @keyup.enter="performSearch">
                        <button v-if="searchQuery"
                                class="btn btn-outline-secondary"
                                type="button"
                                @click="clearSearch">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>

                <!-- 篩選器 -->
                <div class="filter-section">
                    <select class="form-select" v-model="filterType" @change="handleFilterChange">
                        <option value="all">所有檔案</option>
                        <option value="image">圖片</option>
                        <option value="document">文檔</option>
                        <option value="video">影片</option>
                        <option value="audio">音頻</option>
                        <option value="code">程式碼</option>
                        <option value="archive">壓縮檔</option>
                    </select>
                </div>
            </div>

            <div class="header-right">
                <!-- 排序選擇器 -->
                <div class="sort-section">
                    <select class="form-select" v-model="sortOption" @change="handleSortChange">
                        <option value="uploadedAt_desc">日期 (新到舊)</option>
                        <option value="uploadedAt_asc">日期 (舊到新)</option>
                        <option value="name_asc">名稱 (A-Z)</option>
                        <option value="name_desc">名稱 (Z-A)</option>
                        <option value="size_desc">大小 (大到小)</option>
                        <option value="size_asc">大小 (小到大)</option>
                        <option value="type_asc">類型 (A-Z)</option>
                    </select>
                </div>

                <!-- 視圖模式切換 -->
                <div class="view-mode-section">
                    <div class="btn-group" role="group">
                        <button type="button"
                                class="btn"
                                :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
                                @click="setViewMode('grid')"
                                title="網格視圖">
                            <i class="bi bi-grid-3x3-gap"></i>
                        </button>
                        <button type="button"
                                class="btn"
                                :class="viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'"
                                @click="setViewMode('list')"
                                title="列表視圖">
                            <i class="bi bi-list-ul"></i>
                        </button>
                    </div>
                </div>

                <!-- 上傳按鈕 -->
                <button class="btn btn-success upload-btn" @click="openUpload" title="上傳檔案">
                    <i class="bi bi-cloud-upload-fill me-1"></i>
                    上傳
                </button>
            </div>
        </div>

        <!-- 批量操作工具欄 -->
        <div v-if="selectedFiles.length > 0" class="batch-operations-bar">
            <div class="batch-info">
                <i class="bi bi-check-square me-2"></i>
                已選中 {{ selectedFiles.length }} 個檔案
            </div>
            <div class="batch-actions">
                <button class="btn btn-outline-primary btn-sm" @click="downloadSelected">
                    <i class="bi bi-download me-1"></i>
                    下載
                </button>
                <button class="btn btn-outline-danger btn-sm" @click="deleteSelected">
                    <i class="bi bi-trash me-1"></i>
                    刪除
                </button>
                <button class="btn btn-outline-secondary btn-sm" @click="clearSelection">
                    <i class="bi bi-x me-1"></i>
                    取消選擇
                </button>
            </div>
        </div>

        <!-- 檔案列表區域 -->
        <div class="file-content" ref="fileContent">
            <!-- 後端不可用提示 -->
            <div v-if="isBackendDown" class="backend-warning">
                <div class="alert alert-warning d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill me-3"></i>
                    <div>
                        <h5 class="alert-heading">後端服務暫時無法使用</h5>
                        <p class="mb-0">前端界面已就緒，等待後端 API 啟動後即可完整使用所有功能。</p>
                        <small class="text-muted">預期後端地址：{{ apiBaseUrl }}</small>
                    </div>
                </div>
            </div>

            <!-- 載入指示器 -->
            <div v-if="isLoading && !isLoadingMore" class="loading-container">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">載入中...</span>
                    </div>
                    <p class="text-muted">{{ loadingMessage }}</p>
                </div>
            </div>

            <!-- 空狀態 -->
            <div v-else-if="files.length === 0 && !isLoading" class="empty-state">
                <div class="text-center py-5">
                    <i class="bi bi-folder2-open empty-icon"></i>
                    <h4 class="mt-3">{{ getEmptyStateTitle() }}</h4>
                    <p class="text-muted">{{ getEmptyStateMessage() }}</p>
                    <button v-if="!searchQuery" class="btn btn-primary" @click="openUpload">
                        <i class="bi bi-cloud-upload-fill me-1"></i>
                        上傳第一個檔案
                    </button>
                    <button v-else class="btn btn-outline-primary" @click="clearSearch">
                        <i class="bi bi-arrow-left me-1"></i>
                        返回所有檔案
                    </button>
                </div>
            </div>

            <!-- 檔案網格視圖 -->
            <file-grid v-else-if="viewMode === 'grid'"
                       :files="files"
                       :selected-files="selectedFiles"
                       @file-select="handleFileSelect"
                       @file-preview="handleFilePreview"
                       @file-context-menu="handleFileContextMenu" />

            <!-- 檔案列表視圖 -->
            <file-list v-else
                       :files="files"
                       :selected-files="selectedFiles"
                       @file-select="handleFileSelect"
                       @file-preview="handleFilePreview"
                       @file-context-menu="handleFileContextMenu"
                       @sort-change="handleSortChange" />

            <!-- 載入更多指示器 -->
            <div v-if="isLoadingMore" class="loading-more">
                <div class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span class="visually-hidden">載入中...</span>
                    </div>
                    載入更多檔案...
                </div>
            </div>

            <!-- 無限滾動觸發器 -->
            <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
        </div>

        <!-- 檔案統計資訊 -->
        <div v-if="files.length > 0" class="file-stats">
            <small class="text-muted">
                共 {{ totalCount }} 個檔案
                <span v-if="searchQuery">（搜尋結果）</span>
                <span v-if="filterType !== 'all'">（{{ getFilterTypeName(filterType) }}）</span>
            </small>
        </div>

        <!-- 檔案上傳 Modal -->
        <file-upload v-if="showUpload"
                     @close="closeUpload"
                     @upload-success="handleUploadSuccess"
                     @upload-error="handleUploadError" />

        <!-- 檔案預覽 Modal -->
        <file-preview v-if="showPreview"
                      :file="previewFile"
                      @close="closePreview"
                      @file-delete="handleFileDelete"
                      @file-rename="handleFileRename" />

        <!-- 檔案重命名 Modal -->
        <file-rename v-if="showRename"
                     :file="renameFile"
                     @close="closeRename"
                     @rename-success="handleRenameSuccess" />

        <!-- 右鍵選單 -->
        <context-menu v-if="showContextMenu"
                      :file="contextMenuFile"
                      :position="contextMenuPosition"
                      @close="closeContextMenu"
                      @preview="handleFilePreview"
                      @download="handleFileDownload"
                      @rename="handleFileRename"
                      @delete="handleFileDelete"
                      @copy-link="handleCopyLink" />

        <!-- 確認刪除對話框 -->
        <confirm-dialog v-if="showDeleteConfirm"
                        :title="deleteConfirmTitle"
                        :message="deleteConfirmMessage"
                        @confirm="confirmDelete"
                        @cancel="cancelDelete" />
    </div>
</template>

<script>
module.exports = {
  data() {
    return {
      // 檔案列表數據
      files: [],
      totalCount: 0,
      currentPage: 1,
      hasMore: true,

      // 載入狀態
      isLoading: false,
      isLoadingMore: false,
      loadingMessage: '載入檔案列表...',
      isBackendDown: false,

      // 搜尋和篩選
      searchQuery: '',
      searchDebounceTimer: null,
      filterType: 'all',
      sortOption: 'uploadedAt_desc',

      // 視圖模式
      viewMode: 'grid',

      // 檔案選擇
      selectedFiles: [],

      // Modal 狀態
      showUpload: false,
      showPreview: false,
      showRename: false,
      showContextMenu: false,
      showDeleteConfirm: false,

      // Modal 數據
      previewFile: null,
      renameFile: null,
      contextMenuFile: null,
      contextMenuPosition: { x: 0, y: 0 },

      // 刪除確認
      deleteConfirmTitle: '',
      deleteConfirmMessage: '',
      deleteTarget: null,

      // 無限滾動
      intersectionObserver: null
    }
  },

  computed: {
    // 排序配置
    sortBy() {
      return this.sortOption.split('_')[0];
    },

    sortDirection() {
      return this.sortOption.split('_')[1];
    },

    // API 基礎 URL
    apiBaseUrl() {
      return API_CONFIG.baseUrl;
    }
  },

  async mounted() {
    console.log('📂 檔案管理器已掛載');

    // 載入用戶偏好設定
    this.loadUserPreferences();

    // 載入檔案列表
    await this.loadFiles();

    // 設置無限滾動
    this.setupInfiniteScroll();

    // 監聽全域事件
    this.$eventBus.$on('file-uploaded', this.handleUploadSuccess);
    this.$eventBus.$on('preferences-applied', this.applyPreferences);
  },

  beforeDestroy() {
    // 清理事件監聽器
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.$eventBus.$off('file-uploaded', this.handleUploadSuccess);
    this.$eventBus.$off('preferences-applied', this.applyPreferences);
  },

  methods: {
    // ==========================================
    // 檔案列表載入
    // ==========================================

    async loadFiles(reset = true) {
      if (reset) {
        this.isLoading = true;
        this.currentPage = 1;
        this.files = [];
        this.isBackendDown = false;
      } else {
        this.isLoadingMore = true;
      }

      try {
        const params = {
          page: this.currentPage,
          pageSize: API_CONFIG.pagination.pageSize,
          search: this.searchQuery.trim(),
          sortBy: this.sortBy,
          sortDirection: this.sortDirection,
          fileType: this.filterType
        };

        console.log('📂 載入檔案列表:', params);

        const result = await FileService.getFiles(params);

        if (result.success) {
          if (reset) {
            this.files = result.files;
          } else {
            this.files.push(...result.files);
          }

          this.totalCount = result.totalCount;
          this.hasMore = result.hasMore;

          console.log('✅ 檔案列表載入成功:', {
            count: result.files.length,
            total: this.totalCount,
            hasMore: this.hasMore
          });

        } else {
          console.error('❌ 載入檔案列表失敗:', result.message);

          if (result.isBackendDown) {
            this.isBackendDown = true;
          } else {
            this.showError(result.message);
          }
        }

      } catch (error) {
        console.error('❌ 載入檔案列表時發生錯誤:', error);
        this.showError('載入檔案列表失敗');
      } finally {
        this.isLoading = false;
        this.isLoadingMore = false;
      }
    },

    async loadMoreFiles() {
      if (!this.hasMore || this.isLoading || this.isLoadingMore) {
        return;
      }

      this.currentPage++;
      await this.loadFiles(false);
    },

    // ==========================================
    // 搜尋和篩選
    // ==========================================

    handleSearchInput() {
      // 防抖處理
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }

      this.searchDebounceTimer = setTimeout(() => {
        this.performSearch();
      }, API_CONFIG.search.debounceDelay);
    },

    async performSearch() {
      console.log('🔍 執行搜尋:', this.searchQuery);
      await this.loadFiles(true);
    },

    clearSearch() {
      this.searchQuery = '';
      this.loadFiles(true);
    },

    async handleFilterChange() {
      console.log('🏷️ 篩選類型變更:', this.filterType);
      await this.loadFiles(true);
    },

    async handleSortChange() {
      console.log('📊 排序變更:', this.sortOption);
      await this.loadFiles(true);
    },

    // ==========================================
    // 視圖模式
    // ==========================================

    setViewMode(mode) {
      if (this.viewMode !== mode) {
        this.viewMode = mode;
        this.saveUserPreferences();
        console.log('👁️ 視圖模式變更:', mode);
      }
    },

    // ==========================================
    // 檔案選擇
    // ==========================================

    handleFileSelect(file, isSelected) {
      const index = this.selectedFiles.findIndex(f => f.id === file.id);

      if (isSelected && index === -1) {
        this.selectedFiles.push(file);
      } else if (!isSelected && index !== -1) {
        this.selectedFiles.splice(index, 1);
      }

      console.log('✅ 檔案選擇狀態:', {
        file: file.originalName,
        selected: isSelected,
        totalSelected: this.selectedFiles.length
      });
    },

    clearSelection() {
      this.selectedFiles = [];
      console.log('🧹 清除所有選擇');
    },

    // ==========================================
    // 檔案操作
    // ==========================================

    handleFilePreview(file) {
      this.previewFile = file;
      this.showPreview = true;
      console.log('👁️ 預覽檔案:', file.originalName);
    },

    closePreview() {
      this.showPreview = false;
      this.previewFile = null;
    },

    handleFileRename(file) {
      this.renameFile = file;
      this.showRename = true;
      console.log('✏️ 重命名檔案:', file.originalName);
    },

    closeRename() {
      this.showRename = false;
      this.renameFile = null;
    },

    async handleRenameSuccess(file) {
      // 更新檔案列表中的檔案資訊
      const index = this.files.findIndex(f => f.id === file.id);
      if (index !== -1) {
        this.files.splice(index, 1, file);
      }

      this.closeRename();
      this.showSuccess('檔案重命名成功');
    },

    handleFileDelete(file) {
      this.deleteTarget = [file];
      this.deleteConfirmTitle = '確認刪除檔案';
      this.deleteConfirmMessage = `確定要刪除檔案「${file.originalName}」嗎？檔案將移至回收筒。`;
      this.showDeleteConfirm = true;
    },

    async handleFileDownload(file) {
      try {
        console.log('💾 下載檔案:', file.originalName);

        const result = await PreviewService.downloadFile(file.id, {
          filename: file.originalName
        });

        if (result.success) {
          this.showSuccess('檔案下載已開始');
        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 下載檔案失敗:', error);
        this.showError('下載檔案失敗');
      }
    },

    async handleCopyLink(file) {
      try {
        console.log('🔗 複製熱連結:', file.originalName);

        const result = await FileService.copyHotLink(file.id);

        if (result.success) {
          this.showSuccess(result.message);
        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 複製熱連結失敗:', error);
        this.showError('複製熱連結失敗');
      }
    },

    // ==========================================
    // 右鍵選單
    // ==========================================

    handleFileContextMenu(event, file) {
      event.preventDefault();

      this.contextMenuFile = file;
      this.contextMenuPosition = {
        x: event.clientX,
        y: event.clientY
      };
      this.showContextMenu = true;

      console.log('📝 顯示右鍵選單:', file.originalName);
    },

    closeContextMenu() {
      this.showContextMenu = false;
      this.contextMenuFile = null;
    },

    // ==========================================
    // 批量操作
    // ==========================================

    deleteSelected() {
      if (this.selectedFiles.length === 0) return;

      this.deleteTarget = [...this.selectedFiles];
      this.deleteConfirmTitle = '確認批量刪除';
      this.deleteConfirmMessage = `確定要刪除選中的 ${this.selectedFiles.length} 個檔案嗎？檔案將移至回收筒。`;
      this.showDeleteConfirm = true;
    },

    async downloadSelected() {
      if (this.selectedFiles.length === 0) return;

      console.log('💾 批量下載檔案:', this.selectedFiles.length);

      for (const file of this.selectedFiles) {
        try {
          await this.handleFileDownload(file);
          // 添加短暫延遲避免瀏覽器阻止多個下載
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('下載失敗:', file.originalName, error);
        }
      }

      this.clearSelection();
    },

    // ==========================================
    // 刪除確認
    // ==========================================

    async confirmDelete() {
      if (!this.deleteTarget || this.deleteTarget.length === 0) {
        this.cancelDelete();
        return;
      }

      try {
        this.setLoading(true, '正在刪除檔案...');

        let result;
        if (this.deleteTarget.length === 1) {
          result = await FileService.deleteFile(this.deleteTarget[0].id);
        } else {
          const fileIds = this.deleteTarget.map(f => f.id);
          result = await FileService.deleteFiles(fileIds);
        }

        if (result.success) {
          // 從列表中移除已刪除的檔案
          this.deleteTarget.forEach(deletedFile => {
            const index = this.files.findIndex(f => f.id === deletedFile.id);
            if (index !== -1) {
              this.files.splice(index, 1);
              this.totalCount--;
            }
          });

          // 清除選擇
          this.clearSelection();

          this.showSuccess(result.message);
          console.log('✅ 檔案刪除成功');

        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 刪除檔案失敗:', error);
        this.showError('刪除檔案失敗');
      } finally {
        this.setLoading(false);
        this.cancelDelete();
      }
    },

    cancelDelete() {
      this.showDeleteConfirm = false;
      this.deleteTarget = null;
      this.deleteConfirmTitle = '';
      this.deleteConfirmMessage = '';
    },

    // ==========================================
    // 檔案上傳
    // ==========================================

    openUpload() {
      this.showUpload = true;
      console.log('📤 打開上傳對話框');
    },

    closeUpload() {
      this.showUpload = false;
    },

    async handleUploadSuccess(result) {
      console.log('✅ 檔案上傳成功:', result);

      // 重新載入檔案列表
      await this.loadFiles(true);

      this.showSuccess('檔案上傳成功');
      this.closeUpload();
    },

    handleUploadError(error) {
      console.error('❌ 檔案上傳失敗:', error);
      this.showError(error.message || '檔案上傳失敗');
    },

    // ==========================================
    // 無限滾動
    // ==========================================

    setupInfiniteScroll() {
      if (!this.$refs.infiniteScrollTrigger) return;

      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && this.hasMore && !this.isLoading && !this.isLoadingMore) {
            this.loadMoreFiles();
          }
        },
        {
          rootMargin: `${API_CONFIG.pagination.infiniteScrollThreshold}px`
        }
      );

      this.intersectionObserver.observe(this.$refs.infiniteScrollTrigger);
      console.log('♾️ 無限滾動已設置');
    },

    // ==========================================
    // 用戶偏好設定
    // ==========================================

    loadUserPreferences() {
      try {
        const stored = localStorage.getItem(CONSTANTS.STORAGE_KEYS.VIEW_MODE);
        if (stored) {
          this.viewMode = stored;
        }

        const sortStored = localStorage.getItem(CONSTANTS.STORAGE_KEYS.SORT_OPTION);
        if (sortStored) {
          this.sortOption = sortStored;
        }

        console.log('📱 載入用戶偏好設定:', { viewMode: this.viewMode, sortOption: this.sortOption });
      } catch (error) {
        console.warn('⚠️ 載入用戶偏好設定失敗:', error);
      }
    },

    saveUserPreferences() {
      try {
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.VIEW_MODE, this.viewMode);
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.SORT_OPTION, this.sortOption);
        console.log('💾 保存用戶偏好設定');
      } catch (error) {
        console.warn('⚠️ 保存用戶偏好設定失敗:', error);
      }
    },

    applyPreferences(preferences) {
      if (preferences.viewMode) {
        this.viewMode = preferences.viewMode;
      }
      if (preferences.sortBy && preferences.sortDirection) {
        this.sortOption = `${preferences.sortBy}_${preferences.sortDirection}`;
      }
    },

    // ==========================================
    // 工具方法
    // ==========================================

    getEmptyStateTitle() {
      if (this.searchQuery) {
        return '找不到相關檔案';
      } else if (this.filterType !== 'all') {
        return `沒有${this.getFilterTypeName(this.filterType)}檔案`;
      } else {
        return '還沒有任何檔案';
      }
    },

    getEmptyStateMessage() {
      if (this.searchQuery) {
        return `沒有找到包含「${this.searchQuery}」的檔案，請嘗試其他關鍵字。`;
      } else if (this.filterType !== 'all') {
        return `當前沒有${this.getFilterTypeName(this.filterType)}類型的檔案。`;
      } else {
        return '開始上傳檔案來建立您的檔案庫。';
      }
    },

    getFilterTypeName(type) {
      const names = {
        image: '圖片',
        document: '文檔',
        video: '影片',
        audio: '音頻',
        code: '程式碼',
        archive: '壓縮檔'
      };
      return names[type] || type;
    }
  }
}
</script>

