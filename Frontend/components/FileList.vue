<template>
    <div class="file-list">
        <!-- 表格頭部 -->
        <div class="list-header">
            <div class="header-row">
                <!-- 全選框 -->
                <div class="header-cell select-cell" v-if="enableMultiSelect">
                    <input type="checkbox"
                           class="form-check-input"
                           :checked="isAllSelected"
                           :indeterminate.prop="isPartialSelected"
                           @change="handleSelectAll"
                           title="全選/取消全選">
                </div>

                <!-- 檔案名稱 -->
                <div class="header-cell name-cell sortable" @click="handleSort('name')">
                    <span class="header-label">
                        <i class="bi bi-file-earmark me-2"></i>
                        檔案名稱
                    </span>
                    <i class="sort-icon" :class="getSortIconClass('name')"></i>
                </div>

                <!-- 檔案大小 -->
                <div class="header-cell size-cell sortable" @click="handleSort('size')">
                    <span class="header-label">
                        <i class="bi bi-hdd me-2"></i>
                        大小
                    </span>
                    <i class="sort-icon" :class="getSortIconClass('size')"></i>
                </div>

                <!-- 檔案類型 -->
                <div class="header-cell type-cell sortable" @click="handleSort('type')">
                    <span class="header-label">
                        <i class="bi bi-tags me-2"></i>
                        類型
                    </span>
                    <i class="sort-icon" :class="getSortIconClass('type')"></i>
                </div>

                <!-- 上傳日期 -->
                <div class="header-cell date-cell sortable" @click="handleSort('uploadedAt')">
                    <span class="header-label">
                        <i class="bi bi-calendar me-2"></i>
                        上傳日期
                    </span>
                    <i class="sort-icon" :class="getSortIconClass('uploadedAt')"></i>
                </div>

                <!-- 上傳者 -->
                <div class="header-cell uploader-cell">
                    <span class="header-label">
                        <i class="bi bi-person me-2"></i>
                        上傳者
                    </span>
                </div>

                <!-- 操作 -->
                <div class="header-cell actions-cell" v-if="showActions">
                    <span class="header-label">
                        <i class="bi bi-gear me-2"></i>
                        操作
                    </span>
                </div>
            </div>
        </div>

        <!-- 表格內容 -->
        <div class="list-content" ref="listContent">
            <!-- 檔案行 -->
            <div v-for="file in files"
                 :key="file.id"
                 class="file-row"
                 :class="{
          'selected': isFileSelected(file),
          'loading': file.isLoading,
          'uploading': file.status === 'uploading'
        }"
                 @click="handleFileClick(file, $event)"
                 @dblclick="handleFileDoubleClick(file)"
                 @contextmenu="handleFileContextMenu(file, $event)">
                <!-- 選擇框 -->
                <div class="file-cell select-cell" v-if="enableMultiSelect">
                    <input type="checkbox"
                           class="form-check-input"
                           :checked="isFileSelected(file)"
                           @click.stop="handleFileSelect(file)"
                           @change="handleFileSelect(file)">
                </div>

                <!-- 檔案名稱和圖標 -->
                <div class="file-cell name-cell">
                    <div class="file-name-content">
                        <!-- 檔案圖標 -->
                        <div class="file-icon-wrapper">
                            <!-- 載入狀態 -->
                            <div v-if="file.isLoading" class="file-loading">
                                <div class="spinner-border spinner-border-sm text-primary" role="status">
                                    <span class="visually-hidden">載入中...</span>
                                </div>
                            </div>

                            <!-- 圖片縮圖 -->
                            <img v-else-if="isImage(file.originalName || file.fileName)"
                                 :src="getThumbnailUrl(file)"
                                 :alt="file.originalName || file.fileName"
                                 class="file-thumbnail"
                                 @error="handleImageError"
                                 loading="lazy">

                            <!-- 檔案圖標 -->
                            <img v-else
                                 :src="getFileIcon(file.originalName || file.fileName)"
                                 :alt="getFileTypeName(file.originalName || file.fileName)"
                                 class="file-type-icon">

                            <!-- 檔案狀態指示器 -->
                            <div v-if="file.status" class="file-status-indicator">
                                <i v-if="file.status === 'uploading'" class="bi bi-cloud-upload text-primary"></i>
                                <i v-else-if="file.status === 'error'" class="bi bi-exclamation-triangle text-danger"></i>
                                <i v-else-if="file.status === 'success'" class="bi bi-check-circle text-success"></i>
                            </div>
                        </div>

                        <!-- 檔案名稱和詳細資訊 -->
                        <div class="file-name-info">
                            <div class="file-name" :title="file.originalName || file.fileName">
                                {{ file.originalName || file.fileName }}
                            </div>

                            <!-- 上傳進度 -->
                            <div v-if="file.progress !== undefined && file.progress < 100" class="upload-progress">
                                <div class="progress">
                                    <div class="progress-bar bg-primary"
                                         role="progressbar"
                                         :style="{ width: file.progress + '%' }"
                                         :aria-valuenow="file.progress"
                                         aria-valuemin="0"
                                         aria-valuemax="100">
                                    </div>
                                </div>
                                <small class="progress-text">{{ file.progress }}% 已上傳</small>
                            </div>

                            <!-- 檔案路徑 (如果有) -->
                            <div v-if="file.path" class="file-path">
                                <small class="text-muted">{{ file.path }}</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 檔案大小 -->
                <div class="file-cell size-cell">
                    <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
                    <small v-if="isImage(file.originalName || file.fileName)" class="file-dimensions text-muted">
                        {{ getImageDimensions(file) }}
                    </small>
                </div>

                <!-- 檔案類型 -->
                <div class="file-cell type-cell">
                    <div class="file-type-info">
                        <span class="file-type-badge" :style="{ backgroundColor: getFileColor(file.originalName || file.fileName) }">
                            {{ getFileExtension(file.originalName || file.fileName) }}
                        </span>
                        <small class="file-type-name text-muted">
                            {{ getFileTypeDisplayName(file.originalName || file.fileName) }}
                        </small>
                    </div>
                </div>

                <!-- 上傳日期 -->
                <div class="file-cell date-cell">
                    <div class="date-info">
                        <span class="upload-date">{{ formatDate(file.uploadedAt, 'date') }}</span>
                        <small class="upload-time text-muted">{{ formatDate(file.uploadedAt, 'time') }}</small>
                    </div>
                </div>

                <!-- 上傳者 -->
                <div class="file-cell uploader-cell">
                    <div class="uploader-info">
                        <div class="uploader-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="uploader-details">
                            <span class="uploader-name">{{ file.uploadedBy || '未知' }}</span>
                            <small class="uploader-role text-muted">{{ getUserRole(file.uploadedBy) }}</small>
                        </div>
                    </div>
                </div>

                <!-- 操作按鈕 -->
                <div class="file-cell actions-cell" v-if="showActions">
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary action-btn"
                                @click.stop="handleFilePreview(file)"
                                title="預覽"
                                :disabled="!canPreview(file)">
                            <i class="bi bi-eye"></i>
                        </button>

                        <button class="btn btn-sm btn-outline-success action-btn"
                                @click.stop="handleFileDownload(file)"
                                title="下載">
                            <i class="bi bi-download"></i>
                        </button>

                        <button class="btn btn-sm btn-outline-secondary action-btn"
                                @click.stop="handleFileMenu(file, $event)"
                                title="更多選項">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空狀態 -->
        <div v-if="files.length === 0" class="empty-list">
            <div class="text-center py-5">
                <i class="bi bi-list-ul empty-icon"></i>
                <h5 class="mt-3 text-muted">沒有檔案可顯示</h5>
                <p class="text-muted">上傳一些檔案來填滿您的列表視圖</p>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
  props: {
    files: {
      type: Array,
      default: () => []
    },
    selectedFiles: {
      type: Array,
      default: () => []
    },
    showActions: {
      type: Boolean,
      default: true
    },
    enableMultiSelect: {
      type: Boolean,
      default: true
    },
    sortBy: {
      type: String,
      default: 'uploadedAt'
    },
    sortDirection: {
      type: String,
      default: 'desc'
    },
    thumbnailSize: {
      type: Number,
      default: 40
    }
  },

  data() {
    return {
      imageLoadErrors: new Set(),
      lastClickTime: 0,
      lastClickedFile: null
    }
  },

  computed: {
    isAllSelected() {
      return this.files.length > 0 && this.selectedFiles.length === this.files.length;
    },

    isPartialSelected() {
      return this.selectedFiles.length > 0 && this.selectedFiles.length < this.files.length;
    }
  },

  methods: {
    // ==========================================
    // 排序處理
    // ==========================================

    handleSort(field) {
      let direction = 'asc';

      if (this.sortBy === field) {
        // 如果點擊的是當前排序欄位，切換方向
        direction = this.sortDirection === 'asc' ? 'desc' : 'asc';
      }

      console.log('📊 列表排序:', { field, direction });
      this.$emit('sort-change', { sortBy: field, sortDirection: direction });
    },

    getSortIconClass(field) {
      if (this.sortBy !== field) {
        return 'bi bi-arrow-down-up text-muted';
      }

      return this.sortDirection === 'asc'
        ? 'bi bi-arrow-up text-primary'
        : 'bi bi-arrow-down text-primary';
    },

    // ==========================================
    // 檔案選擇處理
    // ==========================================

    handleSelectAll() {
      const selectAll = !this.isAllSelected;
      console.log('✅ 全選檔案:', selectAll);

      this.files.forEach(file => {
        const isCurrentlySelected = this.isFileSelected(file);
        if (selectAll && !isCurrentlySelected) {
          this.$emit('file-select', file, true);
        } else if (!selectAll && isCurrentlySelected) {
          this.$emit('file-select', file, false);
        }
      });
    },

    handleFileClick(file, event) {
      // 防止過快的連續點擊
      const now = Date.now();
      if (now - this.lastClickTime < 200 && this.lastClickedFile === file) {
        return;
      }
      this.lastClickTime = now;
      this.lastClickedFile = file;

      // 如果按住 Ctrl/Cmd 鍵，進行多選
      if (this.enableMultiSelect && (event.ctrlKey || event.metaKey)) {
        this.handleFileSelect(file);
      }
      // 如果按住 Shift 鍵，進行範圍選擇
      else if (this.enableMultiSelect && event.shiftKey) {
        this.handleRangeSelect(file);
      }
      // 普通點擊
      else {
        this.handleSingleSelect(file);
      }
    },

    handleFileDoubleClick(file) {
      console.log('📂 雙擊檔案:', file.originalName);
      this.$emit('file-preview', file);
    },

    handleFileContextMenu(file, event) {
      event.preventDefault();
      console.log('📝 右鍵檔案:', file.originalName);
      this.$emit('file-context-menu', event, file);
    },

    handleFileSelect(file) {
      const isSelected = this.isFileSelected(file);
      console.log('✅ 選擇檔案:', file.originalName, '→', !isSelected);
      this.$emit('file-select', file, !isSelected);
    },

    handleSingleSelect(file) {
      // 如果檔案未選中，清除其他選擇並選中此檔案
      if (!this.isFileSelected(file)) {
        // 先清除所有選擇
        this.selectedFiles.forEach(selectedFile => {
          this.$emit('file-select', selectedFile, false);
        });
        // 再選中當前檔案
        this.$emit('file-select', file, true);
      }
    },

    handleRangeSelect(file) {
      if (this.selectedFiles.length === 0) {
        this.handleFileSelect(file);
        return;
      }

      // 找到最後一個選中檔案的索引
      const lastSelectedFile = this.selectedFiles[this.selectedFiles.length - 1];
      const lastIndex = this.files.findIndex(f => f.id === lastSelectedFile.id);
      const currentIndex = this.files.findIndex(f => f.id === file.id);

      if (lastIndex === -1 || currentIndex === -1) {
        this.handleFileSelect(file);
        return;
      }

      // 計算選擇範圍
      const startIndex = Math.min(lastIndex, currentIndex);
      const endIndex = Math.max(lastIndex, currentIndex);

      // 選中範圍內的所有檔案
      for (let i = startIndex; i <= endIndex; i++) {
        const fileToSelect = this.files[i];
        if (!this.isFileSelected(fileToSelect)) {
          this.$emit('file-select', fileToSelect, true);
        }
      }
    },

    // ==========================================
    // 檔案操作
    // ==========================================

    handleFilePreview(file) {
      console.log('👁️ 預覽檔案:', file.originalName);
      this.$emit('file-preview', file);
    },

    handleFileDownload(file) {
      console.log('💾 下載檔案:', file.originalName);
      this.$emit('file-download', file);
    },

    handleFileMenu(file, event) {
      console.log('📋 檔案選單:', file.originalName);
      this.$emit('file-context-menu', event, file);
    },

    // ==========================================
    // 圖片處理
    // ==========================================

    handleImageError(event) {
      const img = event.target;
      const src = img.getAttribute('src');
      this.imageLoadErrors.add(src);

      console.warn('⚠️ 縮圖載入失敗:', src);

      // 隱藏失敗的圖片
      img.style.display = 'none';
    },

    // ==========================================
    // 工具方法
    // ==========================================

    isFileSelected(file) {
      return this.selectedFiles.some(f => f.id === file.id);
    },

    isImage(filename) {
      return FileUtils.isImage(filename);
    },

    getThumbnailUrl(file) {
      if (file.thumbnailUrl) {
        return file.thumbnailUrl;
      }

      if (file.id) {
        return FileUtils.buildThumbnailUrl(file.id) + `?size=${this.thumbnailSize}`;
      }

      return this.getFileIcon(file.originalName || file.fileName);
    },

    getFileIcon(filename) {
      const iconName = FileUtils.getFileIcon(filename);
      return FileUtils.buildIconPath(iconName);
    },

    getFileExtension(filename) {
      const ext = FileUtils.getFileExtension(filename);
      return ext ? ext.toUpperCase() : 'FILE';
    },

    getFileColor(filename) {
      return FileUtils.getFileColor(filename);
    },

    getFileTypeName(filename) {
      const typeInfo = FileUtils.getFileTypeInfo(filename);
      return typeInfo.category || 'file';
    },

    getFileTypeDisplayName(filename) {
      const extension = FileUtils.getFileExtension(filename);
      const typeMap = {
        'jpg': '圖片檔案', 'jpeg': '圖片檔案', 'png': '圖片檔案', 'gif': '圖片檔案',
        'pdf': 'PDF 文檔', 'doc': 'Word 文檔', 'docx': 'Word 文檔',
        'xls': 'Excel 表格', 'xlsx': 'Excel 表格',
        'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
        'mp4': '影片檔案', 'avi': '影片檔案', 'mov': '影片檔案',
        'mp3': '音頻檔案', 'wav': '音頻檔案',
        'zip': '壓縮檔案', 'rar': '壓縮檔案',
        'txt': '文字檔案', 'js': 'JavaScript', 'css': '樣式表'
      };

      return typeMap[extension] || '檔案';
    },

    getImageDimensions(file) {
      if (file.width && file.height) {
        return `${file.width} × ${file.height}`;
      }
      return '';
    },

    getUserRole(username) {
      // 這裡可以根據實際需求返回用戶角色
      return '用戶';
    },

    canPreview(file) {
      return FileUtils.isPreviewSupported(file.originalName || file.fileName);
    },

    formatFileSize(bytes) {
      return FileUtils.formatFileSize(bytes);
    },

    formatDate(dateString, format = 'datetime') {
      return FormatUtils.formatDate(dateString, format);
    }
  }
}
</script>


