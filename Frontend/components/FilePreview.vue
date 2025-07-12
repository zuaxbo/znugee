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

<style scoped>
    /* ==========================================
    主容器
    ========================================== */

    .file-preview-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1050;
        animation: fadeIn 0.3s ease-out;
    }

    .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.4s ease-out;
    }

    /* ==========================================
    模態框頭部
    ========================================== */

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-bottom: 1px solid #dee2e6;
    }

    .file-info {
        flex: 1;
        min-width: 0;
    }

    .modal-title {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #495057;
        display: flex;
        align-items: center;
        margin-bottom: 4px;
    }

    .file-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .file-name {
        font-weight: 500;
        color: #212529;
        font-size: 0.95rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .file-meta {
        font-size: 0.8rem;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .action-buttons {
        display: flex;
        gap: 6px;
    }

        .action-buttons .btn {
            padding: 6px 10px;
            border-radius: 6px;
            transition: all 0.3s ease;
        }

            .action-buttons .btn:hover {
                transform: translateY(-1px);
            }

    .btn-close {
        background: none;
        border: none;
        color: #6c757d;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

        .btn-close:hover {
            background: rgba(108, 117, 125, 0.1);
            color: #495057;
            transform: scale(1.1);
        }

    /* ==========================================
    模態框主體
    ========================================== */

    .modal-body {
        flex: 1;
        overflow: hidden;
        position: relative;
        background: #f8f9fa;
    }

    .preview-loading,
    .preview-error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 300px;
        background: white;
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .error-actions {
        margin-top: 1.5rem;
    }

    .preview-content {
        height: 100%;
        overflow: hidden;
        background: white;
    }

    /* ==========================================
    圖片預覽
    ========================================== */

    .image-preview {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .image-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: #000;
        position: relative;
    }

    .preview-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        cursor: grab;
        transition: transform 0.3s ease;
    }

        .preview-image:active {
            cursor: grabbing;
        }

    .image-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .zoom-level {
        min-width: 60px;
        text-align: center;
        font-weight: 500;
        font-size: 0.9rem;
    }

    .image-controls .btn {
        padding: 6px 10px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 0.85rem;
    }

        .image-controls .btn:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
            color: white;
        }

        .image-controls .btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

    /* ==========================================
    PDF 預覽
    ========================================== */

    .pdf-preview {
        height: 100%;
    }

    .pdf-iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

    /* ==========================================
    Office 預覽
    ========================================== */

    .office-preview {
        height: 100%;
    }

    .office-iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

    /* ==========================================
    文字預覽
    ========================================== */

    .text-preview {
        height: 100%;
        overflow: auto;
        padding: 20px;
    }

    .text-content {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #e9ecef;
    }

    /* ==========================================
    影片預覽
    ========================================== */

    .video-preview {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
    }

    .preview-video {
        max-width: 100%;
        max-height: 100%;
        outline: none;
    }

    /* ==========================================
    音頻預覽
    ========================================== */

    .audio-preview {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
    }

    .audio-container {
        text-align: center;
        max-width: 400px;
        width: 100%;
    }

    .audio-info {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30px;
        gap: 15px;
    }

    .audio-icon {
        font-size: 2.5rem;
        color: #6f42c1;
    }

    .audio-details h6 {
        margin: 0;
        font-weight: 600;
        color: #495057;
    }

    .preview-audio {
        width: 100%;
        margin-top: 20px;
    }

    /* ==========================================
    不支援預覽
    ========================================== */

    .unsupported-preview {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .unsupported-icon {
        font-size: 4rem;
        color: #6c757d;
        opacity: 0.5;
    }

    /* ==========================================
    模態框底部
    ========================================== */

    .modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: #f8f9fa;
        border-top: 1px solid #dee2e6;
    }

    .footer-info {
        flex: 1;
    }

    .footer-actions {
        display: flex;
        gap: 8px;
    }

        .footer-actions .btn {
            padding: 8px 16px;
            font-weight: 500;
            border-radius: 6px;
            transition: all 0.3s ease;
        }

    /* ==========================================
    響應式設計
    ========================================== */

    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            max-height: 95vh;
            margin: 20px;
        }

        .modal-header {
            padding: 16px 20px;
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }

        .header-actions {
            width: 100%;
            justify-content: space-between;
        }

        .file-name {
            font-size: 0.9rem;
        }

        .action-buttons .btn {
            padding: 4px 8px;
            font-size: 0.8rem;
        }

        .image-controls {
            padding: 10px 15px;
            flex-direction: column;
            gap: 10px;
        }

        .control-group {
            gap: 6px;
        }

        .text-content {
            font-size: 0.8rem;
            padding: 12px;
        }

        .modal-footer {
            padding: 12px 20px;
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
        }

        .footer-actions {
            width: 100%;
            justify-content: center;
        }

            .footer-actions .btn {
                flex: 1;
                max-width: 120px;
                font-size: 0.85rem;
                padding: 6px 12px;
            }
    }

    @media (max-width: 576px) {
        .modal-content {
            width: 100%;
            height: 100%;
            max-height: 100vh;
            border-radius: 0;
            margin: 0;
        }

        .modal-header {
            padding: 12px 16px;
        }

        .modal-title {
            font-size: 1rem;
        }

        .file-name {
            font-size: 0.85rem;
        }

        .file-meta {
            font-size: 0.75rem;
        }

        .action-buttons .btn {
            padding: 4px 6px;
        }

        .btn-close {
            width: 32px;
            height: 32px;
            font-size: 1rem;
        }

        .text-preview {
            padding: 15px;
        }

        .text-content {
            padding: 10px;
            font-size: 0.75rem;
        }

        .audio-container {
            padding: 20px;
        }

        .audio-icon {
            font-size: 2rem;
        }

        .footer-actions .btn {
            font-size: 0.8rem;
            padding: 6px 10px;
        }
    }

    /* ==========================================
    深色主題支持
    ========================================== */

    @media (prefers-color-scheme: dark) {
        .theme-auto .modal-content {
            background: #1e1e1e;
            color: #ffffff;
        }

        .theme-auto .modal-header {
            background: linear-gradient(135deg, #2a2a2a, #333333);
            border-bottom-color: #444444;
        }

        .theme-auto .modal-footer {
            background: #2a2a2a;
            border-top-color: #444444;
        }

        .theme-auto .modal-body {
            background: #1e1e1e;
        }

        .theme-auto .preview-content {
            background: #1e1e1e;
        }

        .theme-auto .text-content {
            background: #2a2a2a;
            border-color: #444444;
            color: #ffffff;
        }
    }

    .theme-dark .modal-content {
        background: #1e1e1e;
        color: #ffffff;
    }

    .theme-dark .modal-header {
        background: linear-gradient(135deg, #2a2a2a, #333333);
        border-bottom-color: #444444;
    }

    .theme-dark .modal-title {
        color: #ffffff;
    }

    .theme-dark .file-name {
        color: #ffffff;
    }

    .theme-dark .btn-close {
        color: #cccccc;
    }

        .theme-dark .btn-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }

    .theme-dark .modal-footer {
        background: #2a2a2a;
        border-top-color: #444444;
    }

    .theme-dark .modal-body {
        background: #1e1e1e;
    }

    .theme-dark .preview-content {
        background: #1e1e1e;
    }

    .theme-dark .text-content {
        background: #2a2a2a;
        border-color: #444444;
        color: #ffffff;
    }

    /* ==========================================
    動畫效果
    ========================================== */

    @keyframes fadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
        }

        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* ==========================================
    可訪問性增強
    ========================================== */

    @media (prefers-reduced-motion: reduce) {
        .file-preview-modal,
        .modal-content,
        .preview-image,
        .btn {
            animation: none;
            transition: none;
        }

        .preview-image {
            transition: transform 0.1s ease;
        }
    }

    /* 高對比度模式 */
    @media (prefers-contrast: high) {
        .modal-content {
            border: 2px solid currentColor;
        }

        .modal-header,
        .modal-footer {
            border-width: 2px;
        }

        .btn {
            border-width: 2px;
        }
    }

    /* 焦點可見性 */
    .btn:focus-visible,
    .btn-close:focus-visible {
        outline: 3px solid #007bff;
        outline-offset: 2px;
    }

    .modal-content:focus-within {
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 3px #007bff;
    }

    /* ==========================================
    滾動條樣式
    ========================================== */

    .text-preview::-webkit-scrollbar,
    .modal-body::-webkit-scrollbar {
        width: 8px;
    }

    .text-preview::-webkit-scrollbar-track,
    .modal-body::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .text-preview::-webkit-scrollbar-thumb,
    .modal-body::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
        transition: background 0.3s ease;
    }

        .text-preview::-webkit-scrollbar-thumb:hover,
        .modal-body::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
        }
</style>