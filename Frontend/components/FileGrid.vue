<template>
    <div class="file-grid">
        <div class="grid-container">
            <div v-for="file in files"
                 :key="file.id"
                 class="file-item"
                 :class="{
          'selected': isFileSelected(file),
          'is-image': isImage(file.originalName || file.fileName),
          'loading': file.isLoading
        }"
                 @click="handleFileClick(file, $event)"
                 @dblclick="handleFileDoubleClick(file)"
                 @contextmenu="handleFileContextMenu(file, $event)">
                <!-- 選擇框 -->
                <div class="file-checkbox" v-if="!file.isLoading">
                    <input type="checkbox"
                           :checked="isFileSelected(file)"
                           @click.stop="handleFileSelect(file)"
                           @change="handleFileSelect(file)"
                           class="form-check-input">
                </div>

                <!-- 檔案縮圖/圖標 -->
                <div class="file-thumbnail">
                    <!-- 載入狀態 -->
                    <div v-if="file.isLoading" class="thumbnail-loading">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">載入中...</span>
                        </div>
                    </div>

                    <!-- 圖片檔案縮圖 -->
                    <img v-else-if="isImage(file.originalName || file.fileName)"
                         :src="getThumbnailUrl(file)"
                         :alt="file.originalName || file.fileName"
                         class="thumbnail-image"
                         @load="handleImageLoad"
                         @error="handleImageError"
                         loading="lazy">

                    <!-- 非圖片檔案圖標 -->
                    <div v-else class="file-icon-container">
                        <img :src="getFileIcon(file.originalName || file.fileName)"
                             :alt="getFileTypeName(file.originalName || file.fileName)"
                             class="file-icon">

                        <!-- 檔案大小標籤 -->
                        <div class="file-size-badge">
                            {{ formatFileSize(file.fileSize) }}
                        </div>
                    </div>

                    <!-- 檔案狀態覆蓋層 -->
                    <div v-if="file.status" class="file-status-overlay">
                        <i v-if="file.status === 'uploading'" class="bi bi-cloud-upload text-primary"></i>
                        <i v-else-if="file.status === 'error'" class="bi bi-exclamation-triangle text-danger"></i>
                        <i v-else-if="file.status === 'success'" class="bi bi-check-circle text-success"></i>
                    </div>

                    <!-- 懸停操作按鈕 -->
                    <div class="file-actions" v-if="!file.isLoading">
                        <button class="btn btn-sm btn-light action-btn"
                                @click.stop="handleFilePreview(file)"
                                title="預覽">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-light action-btn"
                                @click.stop="handleFileDownload(file)"
                                title="下載">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn-sm btn-light action-btn"
                                @click.stop="handleFileMenu(file, $event)"
                                title="更多選項">
                            <i class="bi bi-three-dots"></i>
                        </button>
                    </div>
                </div>

                <!-- 檔案資訊 -->
                <div class="file-info">
                    <!-- 檔案名稱 -->
                    <div class="file-name" :title="file.originalName || file.fileName">
                        {{ formatFileName(file.originalName || file.fileName) }}
                    </div>

                    <!-- 檔案詳細資訊 -->
                    <div class="file-details">
                        <small class="text-muted">
                            <!-- 檔案大小 -->
                            <span v-if="isImage(file.originalName || file.fileName)">
                                {{ formatFileSize(file.fileSize) }}
                            </span>

                            <!-- 上傳日期 -->
                            <span class="upload-date">
                                {{ formatDate(file.uploadedAt, 'short') }}
                            </span>
                        </small>
                    </div>

                    <!-- 檔案類型標籤 -->
                    <div v-if="showFileTypeBadge(file)" class="file-type-badge">
                        {{ getFileTypeLabel(file.originalName || file.fileName) }}
                    </div>
                </div>

                <!-- 進度條 (上傳中) -->
                <div v-if="file.progress !== undefined && file.progress < 100" class="upload-progress">
                    <div class="progress">
                        <div class="progress-bar bg-primary"
                             role="progressbar"
                             :style="{ width: file.progress + '%' }"
                             :aria-valuenow="file.progress"
                             aria-valuemin="0"
                             aria-valuemax="100">
                            {{ file.progress }}%
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空狀態提示 -->
        <div v-if="files.length === 0" class="empty-grid">
            <div class="text-center py-5">
                <i class="bi bi-grid-3x3-gap empty-icon"></i>
                <h5 class="mt-3 text-muted">沒有檔案可顯示</h5>
                <p class="text-muted">上傳一些檔案來填滿您的網格視圖</p>
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
    thumbnailSize: {
      type: Number,
      default: 150
    }
  },

  data() {
    return {
      imageLoadErrors: new Set(), // 記錄載入失敗的圖片
      lastClickTime: 0,
      lastClickedFile: null
    }
  },

  methods: {
    // ==========================================
    // 檔案操作事件
    // ==========================================

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
    // 圖片載入處理
    // ==========================================

    handleImageLoad(event) {
      // 圖片載入成功
      const img = event.target;
      img.classList.add('loaded');
    },

    handleImageError(event) {
      // 圖片載入失敗，記錄並使用備用圖標
      const img = event.target;
      const src = img.getAttribute('src');
      this.imageLoadErrors.add(src);

      console.warn('⚠️ 圖片載入失敗:', src);

      // 隱藏失敗的圖片，顯示檔案圖標
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
      // 如果有縮圖 URL，使用縮圖
      if (file.thumbnailUrl) {
        return file.thumbnailUrl;
      }

      // 如果是圖片且有檔案 URL，使用檔案 URL
      if (this.isImage(file.originalName || file.fileName) && file.fileUrl) {
        return file.fileUrl;
      }

      // 使用預覽服務生成縮圖 URL
      if (file.id) {
        return FileUtils.buildThumbnailUrl(file.id) + `?size=${this.thumbnailSize}`;
      }

      // 返回預設圖標
      return this.getFileIcon(file.originalName || file.fileName);
    },

    getFileIcon(filename) {
      const iconName = FileUtils.getFileIcon(filename);
      return FileUtils.buildIconPath(iconName);
    },

    getFileTypeName(filename) {
      const typeInfo = FileUtils.getFileTypeInfo(filename);
      return typeInfo.category || 'file';
    },

    getFileTypeLabel(filename) {
      const extension = FileUtils.getFileExtension(filename);
      return extension.toUpperCase();
    },

    formatFileName(filename, maxLength = 25) {
      return FormatUtils.formatFileName(filename, maxLength);
    },

    formatFileSize(bytes) {
      return FileUtils.formatFileSize(bytes);
    },

    formatDate(dateString, format = 'short') {
      return FormatUtils.formatDate(dateString, format);
    },

    showFileTypeBadge(file) {
      // 對於非圖片檔案顯示類型標籤
      return !this.isImage(file.originalName || file.fileName);
    }
  }
}
</script>

