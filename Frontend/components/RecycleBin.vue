<template>
    <div class="recycle-bin">
        <!-- 頂部工具欄 -->
        <div class="recycle-bin-header">
            <div class="header-left">
                <!-- 回收筒標題 -->
                <div class="page-title">
                    <h3 class="title-text">
                        <i class="bi bi-trash-fill me-3"></i>
                        回收筒
                    </h3>
                    <div class="title-subtitle">
                        <small class="text-muted">
                            已刪除的檔案將在 {{ retentionDays }} 天後自動永久刪除
                        </small>
                    </div>
                </div>

                <!-- 搜尋欄 -->
                <div class="search-section">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="bi bi-search"></i>
                        </span>
                        <input type="text"
                               class="form-control"
                               placeholder="搜尋回收筒中的檔案..."
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
                        <option value="deletedAt_desc">刪除日期 (新到舊)</option>
                        <option value="deletedAt_asc">刪除日期 (舊到新)</option>
                        <option value="name_asc">名稱 (A-Z)</option>
                        <option value="name_desc">名稱 (Z-A)</option>
                        <option value="size_desc">大小 (大到小)</option>
                        <option value="size_asc">大小 (小到大)</option>
                        <option value="uploadedAt_desc">原上傳日期 (新到舊)</option>
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

                <!-- 清空回收筒按鈕 -->
                <button class="btn btn-danger empty-bin-btn"
                        @click="confirmEmptyBin"
                        :disabled="files.length === 0"
                        title="清空回收筒">
                    <i class="bi bi-trash-fill me-1"></i>
                    清空回收筒
                </button>
            </div>
        </div>

        <!-- 統計資訊欄 -->
        <div v-if="statistics.totalFiles > 0" class="statistics-bar">
            <div class="stats-info">
                <div class="stat-item">
                    <i class="bi bi-files me-1"></i>
                    <span class="stat-value">{{ statistics.totalFiles }}</span>
                    <span class="stat-label">個檔案</span>
                </div>
                <div class="stat-item">
                    <i class="bi bi-hdd me-1"></i>
                    <span class="stat-value">{{ formatFileSize(statistics.totalSize) }}</span>
                    <span class="stat-label">總大小</span>
                </div>
                <div v-if="statistics.autoDeleteCount > 0" class="stat-item warning">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    <span class="stat-value">{{ statistics.autoDeleteCount }}</span>
                    <span class="stat-label">個檔案即將自動刪除</span>
                </div>
                <div v-if="statistics.oldestFile" class="stat-item">
                    <i class="bi bi-calendar me-1"></i>
                    <span class="stat-label">最早刪除：</span>
                    <span class="stat-value">{{ formatDate(statistics.oldestFile.deletedAt, 'short') }}</span>
                </div>
            </div>
        </div>

        <!-- 批量操作工具欄 -->
        <div v-if="selectedFiles.length > 0" class="batch-operations-bar">
            <div class="batch-info">
                <i class="bi bi-check-square me-2"></i>
                已選中 {{ selectedFiles.length }} 個檔案
            </div>
            <div class="batch-actions">
                <button class="btn btn-outline-success btn-sm" @click="restoreSelected">
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    還原
                </button>
                <button class="btn btn-outline-danger btn-sm" @click="permanentDeleteSelected">
                    <i class="bi bi-trash-fill me-1"></i>
                    永久刪除
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
                    <i class="bi bi-trash empty-icon"></i>
                    <h4 class="mt-3">{{ getEmptyStateTitle() }}</h4>
                    <p class="text-muted">{{ getEmptyStateMessage() }}</p>
                    <button v-if="searchQuery" class="btn btn-outline-primary" @click="clearSearch">
                        <i class="bi bi-arrow-left me-1"></i>
                        返回所有檔案
                    </button>
                    <div v-else class="empty-actions">
                        <button class="btn btn-outline-primary" @click="navigateToFileManager">
                            <i class="bi bi-folder-fill me-1"></i>
                            前往檔案管理
                        </button>
                    </div>
                </div>
            </div>

            <!-- 檔案網格視圖 -->
            <file-grid v-else-if="viewMode === 'grid'"
                       :files="displayFiles"
                       :selected-files="selectedFiles"
                       @file-select="handleFileSelect"
                       @file-preview="handleFilePreview"
                       @file-context-menu="handleFileContextMenu" />

            <!-- 檔案列表視圖 -->
            <file-list v-else
                       :files="displayFiles"
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
                共 {{ totalCount }} 個已刪除檔案
                <span v-if="searchQuery">（搜尋結果）</span>
                <span v-if="filterType !== 'all'">（{{ getFilterTypeName(filterType) }}）</span>
                · 顯示 {{ files.length }} 個
            </small>
        </div>

        <!-- 檔案預覽 Modal -->
        <file-preview v-if="showPreview"
                      :file="previewFile"
                      @close="closePreview"
                      @file-delete="handlePermanentDelete"
                      @file-rename="handleFileRestore" />

        <!-- 右鍵選單 -->
        <context-menu v-if="showContextMenu"
                      :file="contextMenuFile"
                      :position="contextMenuPosition"
                      :is-recycle-bin="true"
                      :selected-count="selectedFiles.length"
                      @close="closeContextMenu"
                      @preview="handleFilePreview"
                      @download="handleFileDownload"
                      @restore="handleFileRestore"
                      @restore-to="handleFileRestoreTo"
                      @permanent-delete="handlePermanentDelete" />

        <!-- 確認對話框 -->
        <confirm-dialog v-if="showConfirmDialog"
                        :title="confirmTitle"
                        :message="confirmMessage"
                        :type="confirmType"
                        @confirm="handleConfirm"
                        @cancel="handleCancel" />
    </div>
</template>

<script>
module.exports = {
  data() {
    return {
      // 檔案列表數據
      files: [],
      displayFiles: [], // 處理過期時間的檔案列表
      totalCount: 0,
      currentPage: 1,
      hasMore: true,

      // 載入狀態
      isLoading: false,
      isLoadingMore: false,
      loadingMessage: '載入回收筒...',
      isBackendDown: false,

      // 搜尋和篩選
      searchQuery: '',
      searchDebounceTimer: null,
      filterType: 'all',
      sortOption: 'deletedAt_desc',

      // 視圖模式
      viewMode: 'grid',

      // 檔案選擇
      selectedFiles: [],

      // Modal 狀態
      showPreview: false,
      showContextMenu: false,
      showConfirmDialog: false,

      // Modal 數據
      previewFile: null,
      contextMenuFile: null,
      contextMenuPosition: { x: 0, y: 0 },

      // 確認對話框
      confirmTitle: '',
      confirmMessage: '',
      confirmType: 'danger',
      confirmAction: null,

      // 統計資訊
      statistics: {
        totalFiles: 0,
        totalSize: 0,
        autoDeleteCount: 0,
        oldestFile: null,
        newestFile: null
      },

      // 系統設定
      retentionDays: 365, // 檔案保留天數

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
    console.log('🗑️ 回收筒組件已掛載');

    // 載入用戶偏好設定
    this.loadUserPreferences();

    // 載入回收筒統計
    await this.loadStatistics();

    // 載入檔案列表
    await this.loadFiles();

    // 設置無限滾動
    this.setupInfiniteScroll();

    // 監聽全域事件
    this.$eventBus.$on('file-deleted', this.handleFileDeleted);
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

    this.$eventBus.$off('file-deleted', this.handleFileDeleted);
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

        console.log('🗑️ 載入回收筒檔案列表:', params);

        const result = await RecycleBinService.getDeletedFiles(params);

        if (result.success) {
          if (reset) {
            this.files = result.files;
          } else {
            this.files.push(...result.files);
          }

          this.totalCount = result.totalCount;
          this.hasMore = result.hasMore;

          // 處理檔案過期資訊
          this.processFileExpirationInfo();

          console.log('✅ 回收筒檔案列表載入成功:', {
            count: result.files.length,
            total: this.totalCount,
            hasMore: this.hasMore
          });

        } else {
          console.error('❌ 載入回收筒檔案列表失敗:', result.message);

          if (result.isBackendDown) {
            this.isBackendDown = true;
          } else {
            this.showError(result.message);
          }
        }

      } catch (error) {
        console.error('❌ 載入回收筒檔案列表時發生錯誤:', error);
        this.showError('載入回收筒檔案失敗');
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

    async loadStatistics() {
      try {
        console.log('📊 載入回收筒統計資訊');

        const result = await RecycleBinService.getRecycleBinStatistics();

        if (result.success) {
          this.statistics = result.statistics;
          console.log('✅ 統計資訊載入成功:', this.statistics);
        } else {
          console.warn('⚠️ 統計資訊載入失敗:', result.message);
        }

      } catch (error) {
        console.error('❌ 載入統計資訊時發生錯誤:', error);
      }
    },

    processFileExpirationInfo() {
      this.displayFiles = this.files.map(file => {
        return RecycleBinService.formatDeletedFileInfo(file);
      });
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
      console.log('🔍 執行回收筒搜尋:', this.searchQuery);
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

    async handleFileRestore(file) {
      console.log('♻️ 還原檔案:', file.originalName);

      try {
        const result = await RecycleBinService.restoreFile(file.id);

        if (result.success) {
          // 從列表中移除已還原的檔案
          const index = this.files.findIndex(f => f.id === file.id);
          if (index !== -1) {
            this.files.splice(index, 1);
            this.totalCount--;
          }

          // 清除選擇
          this.clearSelection();

          this.showSuccess(result.message);
          await this.loadStatistics(); // 更新統計資訊

        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 還原檔案失敗:', error);
        this.showError('還原檔案失敗');
      }
    },

    handleFileRestoreTo(file) {
      // TODO: 實現還原到指定位置功能
      console.log('📁 還原檔案到指定位置:', file.originalName);
      this.showInfo('還原到指定位置功能開發中');
    },

    handlePermanentDelete(file) {
      this.confirmTitle = '確認永久刪除';
      this.confirmMessage = `確定要永久刪除檔案「${file.originalName}」嗎？此操作無法復原。`;
      this.confirmType = 'danger';
      this.confirmAction = () => this.performPermanentDelete([file]);
      this.showConfirmDialog = true;
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

    restoreSelected() {
      if (this.selectedFiles.length === 0) return;

      this.confirmTitle = '確認批量還原';
      this.confirmMessage = `確定要還原選中的 ${this.selectedFiles.length} 個檔案嗎？`;
      this.confirmType = 'success';
      this.confirmAction = () => this.performBatchRestore();
      this.showConfirmDialog = true;
    },

    permanentDeleteSelected() {
      if (this.selectedFiles.length === 0) return;

      this.confirmTitle = '確認批量永久刪除';
      this.confirmMessage = `確定要永久刪除選中的 ${this.selectedFiles.length} 個檔案嗎？此操作無法復原。`;
      this.confirmType = 'danger';
      this.confirmAction = () => this.performPermanentDelete(this.selectedFiles);
      this.showConfirmDialog = true;
    },

    async performBatchRestore() {
      if (this.selectedFiles.length === 0) return;

      try {
        this.setLoading(true, '正在還原檔案...');

        const fileIds = this.selectedFiles.map(f => f.id);
        const result = await RecycleBinService.restoreFiles(fileIds);

        if (result.success) {
          // 從列表中移除已還原的檔案
          result.successful.forEach(successItem => {
            const index = this.files.findIndex(f => f.id === successItem.fileId);
            if (index !== -1) {
              this.files.splice(index, 1);
              this.totalCount--;
            }
          });

          // 清除選擇
          this.clearSelection();

          this.showSuccess(result.message);
          await this.loadStatistics(); // 更新統計資訊

        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 批量還原失敗:', error);
        this.showError('批量還原失敗');
      } finally {
        this.setLoading(false);
      }
    },

    async performPermanentDelete(files) {
      if (!files || files.length === 0) return;

      try {
        this.setLoading(true, '正在永久刪除檔案...');

        let result;
        if (files.length === 1) {
          result = await RecycleBinService.permanentDeleteFile(files[0].id);
        } else {
          const fileIds = files.map(f => f.id);
          result = await RecycleBinService.permanentDeleteFiles(fileIds);
        }

        if (result.success) {
          // 從列表中移除已刪除的檔案
          files.forEach(deletedFile => {
            const index = this.files.findIndex(f => f.id === deletedFile.id);
            if (index !== -1) {
              this.files.splice(index, 1);
              this.totalCount--;
            }
          });

          // 清除選擇
          this.clearSelection();

          this.showSuccess(result.message || '檔案已永久刪除');
          await this.loadStatistics(); // 更新統計資訊

        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 永久刪除失敗:', error);
        this.showError('永久刪除失敗');
      } finally {
        this.setLoading(false);
      }
    },

    // ==========================================
    // 清空回收筒
    // ==========================================

    confirmEmptyBin() {
      this.confirmTitle = '確認清空回收筒';
      this.confirmMessage = `確定要清空整個回收筒嗎？這將永久刪除所有 ${this.totalCount} 個檔案，此操作無法復原。`;
      this.confirmType = 'danger';
      this.confirmAction = () => this.performEmptyBin();
      this.showConfirmDialog = true;
    },

    async performEmptyBin() {
      try {
        this.setLoading(true, '正在清空回收筒...');

        const result = await RecycleBinService.emptyRecycleBin({
          confirm: true
        });

        if (result.success) {
          this.files = [];
          this.displayFiles = [];
          this.totalCount = 0;
          this.clearSelection();

          this.showSuccess(result.message);
          await this.loadStatistics(); // 更新統計資訊

        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 清空回收筒失敗:', error);
        this.showError('清空回收筒失敗');
      } finally {
        this.setLoading(false);
      }
    },

    // ==========================================
    // 確認對話框處理
    // ==========================================

    handleConfirm() {
      if (this.confirmAction) {
        this.confirmAction();
      }
      this.handleCancel();
    },

    handleCancel() {
      this.showConfirmDialog = false;
      this.confirmAction = null;
    },

    // ==========================================
    // 事件處理
    // ==========================================

    handleFileDeleted(file) {
      // 當有檔案被刪除時，重新載入列表
      console.log('📨 接收到檔案刪除事件:', file);
      this.loadFiles(true);
      this.loadStatistics();
    },

    navigateToFileManager() {
      this.$emit('navigate', '/');
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
        return '回收筒是空的';
      }
    },

    getEmptyStateMessage() {
      if (this.searchQuery) {
        return `沒有找到包含「${this.searchQuery}」的已刪除檔案，請嘗試其他關鍵字。`;
      } else if (this.filterType !== 'all') {
        return `回收筒中沒有${this.getFilterTypeName(this.filterType)}類型的檔案。`;
      } else {
        return '回收筒中沒有任何已刪除的檔案。刪除的檔案會出現在這裡。';
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
    },

    formatFileSize(bytes) {
      return FileUtils.formatFileSize(bytes);
    },

    formatDate(dateString, format) {
      return FormatUtils.formatDate(dateString, format);
    },

    setLoading(status, message = '') {
      this.isLoading = status;
      this.loadingMessage = message || (status ? '載入中...' : '');
    },

    showSuccess(message) {
      this.$emit('show-success', message);
    },

    showError(message) {
      this.$emit('show-error', message);
    },

    showInfo(message) {
      this.$emit('show-info', message);
    }
  }
}
</script>

<style scoped>
     /* ==========================================
    主容器
    ========================================== */

     .recycle-bin {
         height: 100vh;
         display: flex;
         flex-direction: column;
         background-color: #f8f9fa;
         overflow: hidden;
     }

     /* ==========================================
    頂部工具欄
    ========================================== */

     .recycle-bin-header {
         display: flex;
         justify-content: space-between;
         align-items: flex-start;
         padding: 20px;
         background: white;
         border-bottom: 1px solid #e9ecef;
         box-shadow: 0 2px 4px rgba(0,0,0,0.08);
         gap: 20px;
         flex-shrink: 0;
     }

     .header-left {
         display: flex;
         align-items: flex-start;
         gap: 20px;
         flex: 1;
         max-width: 800px;
     }

     .header-right {
         display: flex;
         align-items: center;
         gap: 15px;
         flex-shrink: 0;
     }

     /* 頁面標題區域 */
     .page-title {
         min-width: 200px;
         margin-right: 10px;
     }

     .title-text {
         margin: 0;
         font-size: 1.5rem;
         font-weight: 700;
         color: #dc3545;
         display: flex;
         align-items: center;
         margin-bottom: 4px;
     }

         .title-text i {
             font-size: 1.3rem;
         }

     .title-subtitle {
         margin-top: 2px;
     }

         .title-subtitle small {
             font-size: 0.8rem;
             line-height: 1.3;
         }

     /* 搜尋區域 */
     .search-section {
         flex: 1;
         max-width: 350px;
         min-width: 250px;
     }

         .search-section .input-group-text {
             background-color: #f8f9fa;
             border-color: #ced4da;
             color: #6c757d;
         }

         .search-section .form-control {
             border-color: #ced4da;
             transition: border-color 0.3s ease, box-shadow 0.3s ease;
         }

             .search-section .form-control:focus {
                 border-color: #dc3545;
                 box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.15);
             }

     /* 篩選器區域 */
     .filter-section {
         min-width: 120px;
     }

         .filter-section .form-select {
             font-weight: 500;
             border-color: #ced4da;
             transition: border-color 0.3s ease;
         }

             .filter-section .form-select:focus {
                 border-color: #dc3545;
                 box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.15);
             }

     /* 排序區域 */
     .sort-section {
         min-width: 180px;
     }

         .sort-section .form-select {
             font-weight: 500;
             border-color: #ced4da;
             transition: border-color 0.3s ease;
         }

             .sort-section .form-select:focus {
                 border-color: #dc3545;
                 box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.15);
             }

     /* 視圖模式切換 */
     .view-mode-section .btn {
         padding: 8px 12px;
         border-radius: 6px;
         transition: all 0.3s ease;
         font-weight: 500;
     }

         .view-mode-section .btn:hover {
             transform: translateY(-1px);
             box-shadow: 0 2px 4px rgba(0,0,0,0.1);
         }

         .view-mode-section .btn i {
             font-size: 1.1rem;
         }

     /* 清空回收筒按鈕 */
     .empty-bin-btn {
         font-weight: 600;
         padding: 8px 16px;
         border-radius: 6px;
         box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
         transition: all 0.3s ease;
         border: none;
         background: linear-gradient(135deg, #dc3545, #bd2130);
     }

         .empty-bin-btn:hover:not(:disabled) {
             transform: translateY(-1px);
             box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
             background: linear-gradient(135deg, #bd2130, #a71e2a);
         }

         .empty-bin-btn:disabled {
             opacity: 0.5;
             cursor: not-allowed;
             transform: none;
             background: #6c757d;
         }

     /* ==========================================
    統計資訊欄
    ========================================== */

     .statistics-bar {
         padding: 12px 20px;
         background: linear-gradient(135deg, #fff3cd, #ffeaa7);
         border-bottom: 1px solid #ffecb5;
         flex-shrink: 0;
     }

     .stats-info {
         display: flex;
         flex-wrap: wrap;
         gap: 20px;
         align-items: center;
     }

     .stat-item {
         display: flex;
         align-items: center;
         gap: 4px;
         font-size: 0.875rem;
         color: #856404;
         font-weight: 500;
     }

         .stat-item i {
             font-size: 0.9rem;
             color: #ffc107;
         }

     .stat-value {
         font-weight: 700;
         color: #533f03;
     }

     .stat-label {
         color: #856404;
     }

     .stat-item.warning {
         color: #721c24;
         background: rgba(220, 53, 69, 0.1);
         padding: 4px 8px;
         border-radius: 12px;
         border: 1px solid rgba(220, 53, 69, 0.2);
     }

         .stat-item.warning i {
             color: #dc3545;
         }

         .stat-item.warning .stat-value {
             color: #dc3545;
             font-weight: 700;
         }

     /* ==========================================
    批量操作工具欄
    ========================================== */

     .batch-operations-bar {
         display: flex;
         justify-content: space-between;
         align-items: center;
         padding: 12px 20px;
         background: linear-gradient(135deg, #d1ecf1, #bee5eb);
         border-bottom: 1px solid #b8daff;
         flex-shrink: 0;
         animation: slideDown 0.3s ease-out;
     }

     @keyframes slideDown {
         from {
             opacity: 0;
             transform: translateY(-20px);
         }

         to {
             opacity: 1;
             transform: translateY(0);
         }
     }

     .batch-info {
         display: flex;
         align-items: center;
         color: #0c5460;
         font-weight: 600;
         font-size: 0.95rem;
     }

         .batch-info i {
             color: #17a2b8;
         }

     .batch-actions {
         display: flex;
         gap: 8px;
     }

         .batch-actions .btn {
             font-size: 0.875rem;
             padding: 6px 12px;
             border-radius: 4px;
             font-weight: 500;
             transition: all 0.3s ease;
         }

             .batch-actions .btn:hover {
                 transform: translateY(-1px);
                 box-shadow: 0 2px 4px rgba(0,0,0,0.1);
             }

     /* ==========================================
    檔案內容區域
    ========================================== */

     .file-content {
         flex: 1;
         overflow-y: auto;
         padding: 20px;
         position: relative;
         background-color: #f8f9fa;
     }

     /* 後端警告 */
     .backend-warning {
         margin-bottom: 20px;
         animation: fadeIn 0.5s ease-out;
     }

         .backend-warning .alert {
             border: none;
             border-radius: 8px;
             box-shadow: 0 2px 8px rgba(0,0,0,0.1);
             border-left: 4px solid #ffc107;
         }

         .backend-warning .alert-heading {
             font-size: 1.1rem;
             font-weight: 600;
             margin-bottom: 8px;
         }

     /* 載入容器 */
     .loading-container {
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         height: 100%;
         min-height: 300px;
         animation: fadeIn 0.3s ease-out;
     }

         .loading-container .spinner-border {
             width: 3rem;
             height: 3rem;
             border-width: 3px;
         }

         .loading-container p {
             color: #6c757d;
             font-weight: 500;
             margin-top: 1rem;
         }

     /* 空狀態 */
     .empty-state {
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         height: 100%;
         min-height: 400px;
         text-align: center;
         animation: fadeIn 0.5s ease-out;
     }

     .empty-icon {
         font-size: 4rem;
         color: #dc3545;
         opacity: 0.6;
         margin-bottom: 1rem;
     }

     .empty-state h4 {
         color: #495057;
         font-weight: 600;
         margin-bottom: 0.5rem;
     }

     .empty-state p {
         color: #6c757d;
         margin-bottom: 2rem;
         max-width: 400px;
         line-height: 1.5;
     }

     .empty-actions {
         display: flex;
         gap: 12px;
         justify-content: center;
     }

     .empty-state .btn {
         padding: 10px 24px;
         font-weight: 600;
         border-radius: 6px;
         transition: all 0.3s ease;
     }

         .empty-state .btn:hover {
             transform: translateY(-2px);
             box-shadow: 0 4px 12px rgba(0,0,0,0.15);
         }

     /* 載入更多 */
     .loading-more {
         border-top: 1px solid #e9ecef;
         background: white;
         margin: 20px -20px -20px;
         border-radius: 0 0 8px 8px;
         animation: fadeIn 0.3s ease-out;
     }

         .loading-more .spinner-border-sm {
             width: 1.5rem;
             height: 1.5rem;
         }

     /* 無限滾動觸發器 */
     .infinite-scroll-trigger {
         height: 1px;
         opacity: 0;
         pointer-events: none;
     }

     /* ==========================================
    檔案統計
    ========================================== */

     .file-stats {
         padding: 10px 20px;
         background: white;
         border-top: 1px solid #e9ecef;
         text-align: center;
         flex-shrink: 0;
     }

         .file-stats small {
             font-weight: 500;
             color: #6c757d;
         }

     /* ==========================================
    動畫效果
    ========================================== */

     @keyframes fadeIn {
         from {
             opacity: 0;
             transform: translateY(10px);
         }

         to {
             opacity: 1;
             transform: translateY(0);
         }
     }

     @keyframes pulse {
         0%, 100% {
             opacity: 1;
         }

         50% {
             opacity: 0.5;
         }
     }

     /* 載入動畫 */
     .loading-pulse {
         animation: pulse 1.5s ease-in-out infinite;
     }

     /* ==========================================
    響應式設計
    ========================================== */

     /* 平板設備 (1024px 以下) */
     @media (max-width: 1024px) {
         .recycle-bin-header {
             flex-direction: column;
             gap: 15px;
             align-items: stretch;
             padding: 15px;
         }

         .header-left {
             flex-direction: column;
             gap: 12px;
             max-width: none;
         }

         .page-title {
             min-width: auto;
             margin-right: 0;
         }

         .title-text {
             font-size: 1.3rem;
         }

         .header-right {
             justify-content: space-between;
             flex-wrap: wrap;
             gap: 10px;
         }

         .search-section {
             max-width: none;
             min-width: auto;
             order: 1;
         }

         .filter-section,
         .sort-section {
             flex: 1;
             min-width: 120px;
             order: 2;
         }

         .view-mode-section {
             order: 3;
             flex-shrink: 0;
         }

         .empty-bin-btn {
             width: 100%;
             order: 4;
             margin-top: 10px;
         }
     }

     /* 平板設備 (768px 以下) */
     @media (max-width: 768px) {
         .recycle-bin-header {
             padding: 12px;
         }

         .title-text {
             font-size: 1.2rem;
         }

             .title-text i {
                 font-size: 1.1rem;
             }

         .header-right {
             flex-direction: column;
             gap: 8px;
         }

         .filter-section,
         .sort-section {
             width: 100%;
             min-width: auto;
         }

         .view-mode-section {
             width: 100%;
             display: flex;
             justify-content: center;
         }

             .view-mode-section .btn-group {
                 width: 100%;
             }

             .view-mode-section .btn {
                 flex: 1;
             }

         .empty-bin-btn {
             font-size: 0.9rem;
             padding: 10px 16px;
         }

         .statistics-bar {
             padding: 10px 12px;
         }

         .stats-info {
             flex-direction: column;
             gap: 8px;
             align-items: flex-start;
         }

         .stat-item {
             font-size: 0.8rem;
         }

         .batch-operations-bar {
             flex-direction: column;
             gap: 10px;
             text-align: center;
             padding: 12px;
         }

         .batch-actions {
             width: 100%;
             justify-content: center;
             flex-wrap: wrap;
         }

         .file-content {
             padding: 15px 12px;
         }

         .empty-state {
             min-height: 300px;
             padding: 20px;
         }

         .empty-icon {
             font-size: 3rem;
         }

         .empty-state h4 {
             font-size: 1.25rem;
         }

         .empty-actions {
             flex-direction: column;
             width: 100%;
             max-width: 200px;
         }
     }

     /* 手機設備 (576px 以下) */
     @media (max-width: 576px) {
         .recycle-bin-header {
             padding: 10px;
         }

         .title-text {
             font-size: 1.1rem;
             flex-direction: column;
             align-items: flex-start;
             gap: 4px;
         }

             .title-text i {
                 font-size: 1rem;
             }

         .title-subtitle small {
             font-size: 0.75rem;
         }

         .search-section .form-control {
             font-size: 0.9rem;
         }

         .filter-section .form-select,
         .sort-section .form-select {
             font-size: 0.9rem;
         }

         .view-mode-section .btn {
             padding: 6px 10px;
             font-size: 0.9rem;
         }

         .empty-bin-btn {
             font-size: 0.85rem;
             padding: 8px 12px;
         }

         .statistics-bar {
             padding: 8px 10px;
         }

         .stat-item {
             font-size: 0.75rem;
             flex-wrap: wrap;
         }

             .stat-item.warning {
                 padding: 3px 6px;
                 font-size: 0.7rem;
             }

         .batch-operations-bar {
             padding: 10px;
         }

         .batch-info {
             font-size: 0.85rem;
         }

         .batch-actions {
             gap: 6px;
         }

             .batch-actions .btn {
                 flex: 1;
                 max-width: 80px;
                 font-size: 0.8rem;
                 padding: 6px 8px;
             }

         .file-content {
             padding: 12px 8px;
         }

         .empty-state {
             min-height: 250px;
             padding: 15px;
         }

         .empty-icon {
             font-size: 2.5rem;
         }

         .empty-state h4 {
             font-size: 1.1rem;
         }

         .empty-state p {
             font-size: 0.9rem;
             margin-bottom: 1.5rem;
         }

         .file-stats {
             padding: 8px 10px;
         }

             .file-stats small {
                 font-size: 0.75rem;
             }

         .loading-container {
             min-height: 200px;
         }

             .loading-container .spinner-border {
                 width: 2.5rem;
                 height: 2.5rem;
             }
     }

     /* ==========================================
    深色主題支持
    ========================================== */

     @media (prefers-color-scheme: dark) {
         .theme-auto .recycle-bin {
             background-color: #121212;
             color: #ffffff;
         }

         .theme-auto .recycle-bin-header {
             background: #1e1e1e;
             border-bottom-color: #333;
         }

         .theme-auto .title-text {
             color: #f87171;
         }

         .theme-auto .statistics-bar {
             background: linear-gradient(135deg, #2a2520, #353020);
             border-bottom-color: #4a4520;
         }

         .theme-auto .stat-item {
             color: #fbbf24;
         }

             .theme-auto .stat-item i {
                 color: #f59e0b;
             }

         .theme-auto .stat-value {
             color: #fbbf24;
         }

         .theme-auto .batch-operations-bar {
             background: linear-gradient(135deg, #1e3a3a, #2a4a4a);
             border-bottom-color: #3a5a5a;
         }

         .theme-auto .batch-info {
             color: #67e8f9;
         }

         .theme-auto .file-content {
             background-color: #121212;
         }

         .theme-auto .file-stats {
             background: #1e1e1e;
             border-top-color: #333;
         }

         .theme-auto .loading-more {
             background: #1e1e1e;
             border-top-color: #333;
         }
     }

     .theme-dark .recycle-bin {
         background-color: #121212;
         color: #ffffff;
     }

     .theme-dark .recycle-bin-header {
         background: #1e1e1e;
         border-bottom-color: #333;
     }

     .theme-dark .title-text {
         color: #f87171;
     }

     .theme-dark .statistics-bar {
         background: linear-gradient(135deg, #2a2520, #353020);
         border-bottom-color: #4a4520;
     }

     .theme-dark .stat-item {
         color: #fbbf24;
     }

         .theme-dark .stat-item i {
             color: #f59e0b;
         }

     .theme-dark .stat-value {
         color: #fbbf24;
     }

     .theme-dark .stat-label {
         color: #fbbf24;
     }

     .theme-dark .stat-item.warning {
         background: rgba(248, 113, 113, 0.1);
         border-color: rgba(248, 113, 113, 0.2);
         color: #f87171;
     }

         .theme-dark .stat-item.warning i {
             color: #ef4444;
         }

         .theme-dark .stat-item.warning .stat-value {
             color: #ef4444;
         }

     .theme-dark .batch-operations-bar {
         background: linear-gradient(135deg, #1e3a3a, #2a4a4a);
         border-bottom-color: #3a5a5a;
         color: #67e8f9;
     }

     .theme-dark .batch-info {
         color: #67e8f9;
     }

         .theme-dark .batch-info i {
             color: #22d3ee;
         }

     .theme-dark .file-content {
         background-color: #121212;
     }

     .theme-dark .empty-state h4 {
         color: #ffffff;
     }

     .theme-dark .empty-state p {
         color: #b0b0b0;
     }

     .theme-dark .file-stats {
         background: #1e1e1e;
         border-top-color: #333;
     }

     .theme-dark .loading-more {
         background: #1e1e1e;
         border-top-color: #333;
     }

     .theme-dark .loading-container p {
         color: #cccccc;
     }

     /* ==========================================
    可訪問性增強
    ========================================== */

     /* 高對比度模式 */
     @media (prefers-contrast: high) {
         .recycle-bin-header {
             border-bottom-width: 2px;
         }

         .statistics-bar {
             border-bottom-width: 2px;
         }

         .batch-operations-bar {
             border-bottom-width: 2px;
         }

         .file-stats {
             border-top-width: 2px;
         }

         .btn {
             border-width: 2px;
         }

         .form-control,
         .form-select {
             border-width: 2px;
         }
     }

     /* 減少動畫模式 */
     @media (prefers-reduced-motion: reduce) {
         *,
         *::before,
         *::after {
             animation-duration: 0.01ms !important;
             animation-iteration-count: 1 !important;
             transition-duration: 0.01ms !important;
         }

         .empty-bin-btn:hover:not(:disabled),
         .batch-actions .btn:hover,
         .view-mode-section .btn:hover,
         .empty-state .btn:hover {
             transform: none;
         }
     }

     /* 焦點可見性增強 */
     .btn:focus-visible,
     .form-control:focus-visible,
     .form-select:focus-visible {
         outline: 2px solid #dc3545;
         outline-offset: 2px;
     }

     /* ==========================================
    打印樣式
    ========================================== */

     @media print {
         .recycle-bin-header,
         .batch-operations-bar,
         .file-stats {
             background: white !important;
             color: black !important;
         }

         .statistics-bar {
             background: #f8f9fa !important;
             color: black !important;
         }

         .empty-bin-btn,
         .batch-actions {
             display: none;
         }

         .file-content {
             background: white !important;
         }
     }
</style>