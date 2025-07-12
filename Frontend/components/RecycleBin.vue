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

