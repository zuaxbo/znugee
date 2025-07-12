<template>
    <div class="file-preview-modal">
        <!-- 模態框背景 -->
        <div class="modal-backdrop" @click="closeModal"></div>

        <!-- 模態框內容 -->
        <div class="modal-content">
            <!-- 模態框頭部 -->
            <div class="modal-header">
                <div class="file-info">
                    <h5 class="modal-title">
                        <i class="bi bi-eye me-2"></i>
                        檔案預覽
                    </h5>
                    <div class="file-details">
                        <span class="file-name">{{ file.originalName || file.fileName }}</span>
                        <small class="file-meta text-muted">
                            {{ formatFileSize(file.fileSize) }} · {{ formatDate(file.uploadedAt, 'short') }}
                        </small>
                    </div>
                </div>
                <div class="header-actions">
                    <!-- 工具按鈕 -->
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary"
                                @click="downloadFile"
                                title="下載檔案">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success"
                                @click="copyLink"
                                title="複製連結">
                            <i class="bi bi-link-45deg"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary"
                                @click="openFileMenu"
                                title="更多選項">
                            <i class="bi bi-three-dots"></i>
                        </button>
                    </div>
                    <!-- 關閉按鈕 -->
                    <button type="button" class="btn-close" @click="closeModal" title="關閉">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>

            <!-- 模態框主體 -->
            <div class="modal-body">
                <!-- 載入狀態 -->
                <div v-if="isLoading" class="preview-loading">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">載入中...</span>
                        </div>
                        <p class="text-muted">正在載入預覽...</p>
                    </div>
                </div>

                <!-- 錯誤狀態 -->
                <div v-else-if="hasError" class="preview-error">
                    <div class="text-center py-5">
                        <i class="bi bi-exclamation-triangle text-warning error-icon"></i>
                        <h5 class="mt-3">無法預覽此檔案</h5>
                        <p class="text-muted">{{ errorMessage }}</p>
                        <div class="error-actions">
                            <button class="btn btn-primary" @click="downloadFile">
                                <i class="bi bi-download me-1"></i>
                                下載檔案
                            </button>
                            <button class="btn btn-outline-secondary ms-2" @click="retryPreview">
                                <i class="bi bi-arrow-clockwise me-1"></i>
                                重試
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 預覽內容 -->
                <div v-else class="preview-content">
                    <!-- 圖片預覽 -->
                    <div v-if="previewType === 'image'" class="image-preview">
                        <div class="image-container" ref="imageContainer">
                            <img :src="previewUrl"
                                 :alt="file.originalName || file.fileName"
                                 class="preview-image"
                                 @load="handleImageLoad"
                                 @error="handleImageError"
                                 :style="imageStyles">
                        </div>
                        <div class="image-controls">
                            <div class="control-group">
                                <button class="btn btn-sm btn-outline-secondary"
                                        @click="zoomOut"
                                        :disabled="zoom <= minZoom"
                                        title="縮小">
                                    <i class="bi bi-zoom-out"></i>
                                </button>
                                <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
                                <button class="btn btn-sm btn-outline-secondary"
                                        @click="zoomIn"
                                        :disabled="zoom >= maxZoom"
                                        title="放大">
                                    <i class="bi bi-zoom-in"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary"
                                        @click="resetZoom"
                                        title="重置縮放">
                                    <i class="bi bi-aspect-ratio"></i>
                                </button>
                            </div>
                            <div class="control-group">
                                <button class="btn btn-sm btn-outline-secondary"
                                        @click="rotateLeft"
                                        title="向左旋轉">
                                    <i class="bi bi-arrow-counterclockwise"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary"
                                        @click="rotateRight"
                                        title="向右旋轉">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary"
                                        @click="toggleFullscreen"
                                        title="全屏">
                                    <i class="bi bi-fullscreen"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- PDF 預覽 -->
                    <div v-else-if="previewType === 'pdf'" class="pdf-preview">
                        <iframe :src="previewUrl"
                                class="pdf-iframe"
                                frameborder="0">
                            <p>
                                您的瀏覽器不支援 PDF 預覽。
                                <a :href="previewUrl" target="_blank">點擊這裡下載檔案</a>
                            </p>
                        </iframe>
                    </div>

                    <!-- Office 文檔預覽 -->
                    <div v-else-if="previewType === 'office'" class="office-preview">
                        <iframe :src="officePreviewUrl"
                                class="office-iframe"
                                frameborder="0">
                            <p>
                                無法預覽 Office 文檔。
                                <a :href="previewUrl" target="_blank">點擊這裡下載檔案</a>
                            </p>
                        </iframe>
                    </div>

                    <!-- 文字檔案預覽 -->
                    <div v-else-if="previewType === 'text'" class="text-preview">
                        <pre class="text-content" v-html="textContent"></pre>
                    </div>

                    <!-- 影片預覽 -->
                    <div v-else-if="previewType === 'video'" class="video-preview">
                        <video :src="previewUrl"
                               class="preview-video"
                               controls
                               preload="metadata">
                            您的瀏覽器不支援影片播放。
                        </video>
                    </div>

                    <!-- 音頻預覽 -->
                    <div v-else-if="previewType === 'audio'" class="audio-preview">
                        <div class="audio-container">
                            <div class="audio-info">
                                <i class="bi bi-music-note-beamed audio-icon"></i>
                                <div class="audio-details">
                                    <h6>{{ file.originalName || file.fileName }}</h6>
                                    <small class="text-muted">{{ formatFileSize(file.fileSize) }}</small>
                                </div>
                            </div>
                            <audio :src="previewUrl"
                                   class="preview-audio"
                                   controls
                                   preload="metadata">
                                您的瀏覽器不支援音頻播放。
                            </audio>
                        </div>
                    </div>

                    <!-- 不支援的檔案類型 -->
                    <div v-else class="unsupported-preview">
                        <div class="text-center py-5">
                            <i class="bi bi-file-earmark unsupported-icon"></i>
                            <h5 class="mt-3">此檔案類型不支援預覽</h5>
                            <p class="text-muted">您可以下載檔案後使用適當的應用程式開啟</p>
                            <button class="btn btn-primary" @click="downloadFile">
                                <i class="bi bi-download me-1"></i>
                                下載檔案
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 模態框底部 -->
            <div class="modal-footer">
                <div class="footer-info">
                    <small class="text-muted">
                        檔案類型：{{ getFileTypeDisplayName() }} ·
                        <span v-if="file.uploadedBy">上傳者：{{ file.uploadedBy }} ·</span>
                        檔案 ID：{{ file.id }}
                    </small>
                </div>
                <div class="footer-actions">
                    <button class="btn btn-outline-secondary" @click="openRename">
                        <i class="bi bi-pencil me-1"></i>
                        重命名
                    </button>
                    <button class="btn btn-outline-danger" @click="deleteFile">
                        <i class="bi bi-trash me-1"></i>
                        刪除
                    </button>
                    <button class="btn btn-secondary" @click="closeModal">
                        關閉
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
module.exports = {
  props: {
    file: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      // 預覽狀態
      isLoading: true,
      hasError: false,
      errorMessage: '',

      // 預覽內容
      previewUrl: '',
      previewType: 'none',
      textContent: '',

      // 圖片控制
      zoom: 1,
      rotation: 0,
      minZoom: 0.1,
      maxZoom: 5,

      // Office 預覽
      officePreviewUrl: ''
    }
  },

  computed: {
    imageStyles() {
      return {
        transform: `scale(${this.zoom}) rotate(${this.rotation}deg)`,
        transition: 'transform 0.3s ease'
      };
    }
  },

  async mounted() {
    console.log('📖 檔案預覽組件已掛載:', this.file);
    await this.loadPreview();

    // 監聽鍵盤事件
    document.addEventListener('keydown', this.handleKeydown);
  },

  beforeDestroy() {
    // 清理事件監聽器
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    // ==========================================
    // 預覽載入
    // ==========================================

    async loadPreview() {
      if (!this.file || !this.file.id) {
        this.showError('無效的檔案資訊');
        return;
      }

      this.isLoading = true;
      this.hasError = false;

      try {
        console.log('📖 載入檔案預覽:', this.file.id);

        const result = await PreviewService.getPreview(this.file.id, {
          width: 1200,
          height: 800,
          quality: 90
        });

        if (result.success) {
          this.previewUrl = result.previewUrl || result.data.previewUrl;
          this.previewType = result.previewType || this.detectPreviewType();

          // 特殊處理不同檔案類型
          await this.handleSpecialPreview();

          console.log('✅ 預覽載入成功:', this.previewType);
        } else {
          this.showError(result.message || '載入預覽失敗');
        }

      } catch (error) {
        console.error('❌ 載入預覽失敗:', error);
        this.showError('載入預覽時發生錯誤');
      } finally {
        this.isLoading = false;
      }
    },

    async handleSpecialPreview() {
      switch (this.previewType) {
        case 'text':
          await this.loadTextContent();
          break;
        case 'office':
          this.generateOfficePreviewUrl();
          break;
      }
    },

    async loadTextContent() {
      try {
        const response = await fetch(this.previewUrl);
        const text = await response.text();

        // 簡單的語法高亮（可以根據檔案類型進一步優化）
        this.textContent = this.highlightSyntax(text);
      } catch (error) {
        console.warn('載入文字內容失敗:', error);
        this.textContent = '無法載入文字內容';
      }
    },

    generateOfficePreviewUrl() {
      // 使用 Office Online Viewer
      this.officePreviewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(this.previewUrl)}`;
    },

    detectPreviewType() {
      const filename = this.file.originalName || this.file.fileName || '';
      const extension = FileUtils.getFileExtension(filename);

      if (FileUtils.isImage(filename)) return 'image';
      if (extension === 'pdf') return 'pdf';
      if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'office';
      if (['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'md'].includes(extension)) return 'text';
      if (FileUtils.isVideo(filename)) return 'video';
      if (FileUtils.isAudio(filename)) return 'audio';

      return 'unsupported';
    },

    highlightSyntax(text) {
      // 簡單的語法高亮實現
      const extension = FileUtils.getFileExtension(this.file.originalName || this.file.fileName || '');

      if (extension === 'json') {
        try {
          const parsed = JSON.parse(text);
          return JSON.stringify(parsed, null, 2);
        } catch (e) {
          return text;
        }
      }

      return text;
    },

    // ==========================================
    // 圖片控制
    // ==========================================

    zoomIn() {
      this.zoom = Math.min(this.zoom * 1.2, this.maxZoom);
    },

    zoomOut() {
      this.zoom = Math.max(this.zoom / 1.2, this.minZoom);
    },

    resetZoom() {
      this.zoom = 1;
      this.rotation = 0;
    },

    rotateLeft() {
      this.rotation -= 90;
    },

    rotateRight() {
      this.rotation += 90;
    },

    toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        this.$refs.imageContainer?.requestFullscreen();
      }
    },

    // ==========================================
    // 事件處理
    // ==========================================

    handleImageLoad() {
      console.log('✅ 圖片載入完成');
    },

    handleImageError() {
      console.error('❌ 圖片載入失敗');
      this.showError('圖片載入失敗');
    },

    handleKeydown(event) {
      switch (event.key) {
        case 'Escape':
          this.closeModal();
          break;
        case '+':
        case '=':
          if (this.previewType === 'image') {
            event.preventDefault();
            this.zoomIn();
          }
          break;
        case '-':
          if (this.previewType === 'image') {
            event.preventDefault();
            this.zoomOut();
          }
          break;
        case '0':
          if (this.previewType === 'image') {
            event.preventDefault();
            this.resetZoom();
          }
          break;
      }
    },

    // ==========================================
    // 檔案操作
    // ==========================================

    async downloadFile() {
      try {
        console.log('💾 下載檔案:', this.file.id);

        const result = await PreviewService.downloadFile(this.file.id, {
          filename: this.file.originalName
        });

        if (result.success) {
          this.showSuccess('檔案下載已開始');
        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 下載失敗:', error);
        this.showError('下載檔案失敗');
      }
    },

    async copyLink() {
      try {
        console.log('🔗 複製連結:', this.file.id);

        const result = await FileService.copyHotLink(this.file.id);

        if (result.success) {
          this.showSuccess(result.message);
        } else {
          this.showError(result.message);
        }

      } catch (error) {
        console.error('❌ 複製連結失敗:', error);
        this.showError('複製連結失敗');
      }
    },

    openFileMenu() {
      // 觸發父組件的右鍵選單
      this.$emit('file-context-menu', event, this.file);
    },

    openRename() {
      this.$emit('file-rename', this.file);
    },

    deleteFile() {
      this.$emit('file-delete', this.file);
    },

    async retryPreview() {
      await this.loadPreview();
    },

    // ==========================================
    // UI 控制
    // ==========================================

    closeModal() {
      console.log('📖 關閉預覽');
      this.$emit('close');
    },

    showError(message) {
      this.hasError = true;
      this.errorMessage = message;
      console.error('📖 預覽錯誤:', message);
    },

    showSuccess(message) {
      this.$emit('show-success', message);
    },

    // ==========================================
    // 工具方法
    // ==========================================

    getFileTypeDisplayName() {
      const extension = FileUtils.getFileExtension(this.file.originalName || this.file.fileName || '');
      const typeMap = {
        'jpg': 'JPEG 圖片', 'jpeg': 'JPEG 圖片', 'png': 'PNG 圖片', 'gif': 'GIF 圖片',
        'pdf': 'PDF 文檔', 'doc': 'Word 文檔', 'docx': 'Word 文檔',
        'xls': 'Excel 表格', 'xlsx': 'Excel 表格',
        'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
        'mp4': 'MP4 影片', 'avi': 'AVI 影片', 'mov': 'MOV 影片',
        'mp3': 'MP3 音頻', 'wav': 'WAV 音頻',
        'txt': '文字檔案', 'csv': 'CSV 表格', 'json': 'JSON 檔案'
      };

      return typeMap[extension] || extension.toUpperCase() + ' 檔案';
    }
  }
}
</script>

