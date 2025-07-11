<!-- FrontendUI/assets/js/components/FilePreview.vue -->
<template>
    <div class="modal fade" id="filePreviewModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
                <!-- Modal Header -->
                <div class="modal-header">
                    <div class="file-preview-header">
                        <h5 class="modal-title">
                            <i :class="getFileIcon(file.FileExtension)" class="me-2"></i>
                            {{ file.FileName }}
                        </h5>
                        <div class="file-meta">
                            <span class="badge bg-secondary me-2">{{ file.FileSizeFormatted }}</span>
                            <span class="text-muted">{{ file.UploadedByUsername }}</span>
                            <span class="text-muted ms-2">{{ formatDate(file.UploadedAt) }}</span>
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" @click="closePreview"></button>
                </div>

                <!-- Modal Body -->
                <div class="modal-body p-0">
                    <!-- 載入中 -->
                    <div v-if="loading" class="preview-loading">
                        <div class="d-flex flex-column align-items-center justify-content-center h-100">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">載入中...</span>
                            </div>
                            <p class="text-muted">載入預覽中...</p>
                        </div>
                    </div>

                    <!-- 預覽內容 -->
                    <div v-else class="preview-content">
                        <!-- 圖片預覽 -->
                        <div v-if="isImageFile" class="image-preview">
                            <div class="image-container">
                                <img :src="file.PreviewUrl || file.PublicUrl"
                                     :alt="file.FileName"
                                     class="preview-image"
                                     :style="imageStyle"
                                     @load="onImageLoad"
                                     @error="onPreviewError">
                            </div>

                            <!-- 圖片控制列 -->
                            <div class="image-controls">
                                <div class="control-group">
                                    <button class="btn btn-sm btn-outline-secondary" @click="zoomOut" :disabled="scale <= 0.1">
                                        <i class="fas fa-search-minus"></i>
                                    </button>
                                    <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
                                    <button class="btn btn-sm btn-outline-secondary" @click="zoomIn" :disabled="scale >= 3">
                                        <i class="fas fa-search-plus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" @click="resetZoom">
                                        <i class="fas fa-expand-arrows-alt"></i>
                                    </button>
                                </div>
                                <div class="control-group">
                                    <button class="btn btn-sm btn-outline-secondary" @click="rotateLeft">
                                        <i class="fas fa-undo"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" @click="rotateRight">
                                        <i class="fas fa-redo"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- PDF 預覽 -->
                        <div v-else-if="isPdfFile" class="pdf-preview">
                            <iframe :src="file.PreviewUrl || file.PublicUrl"
                                    class="pdf-frame"
                                    @load="onPreviewLoad"
                                    @error="onPreviewError">
                            </iframe>
                        </div>

                        <!-- 文字檔案預覽 -->
                        <div v-else-if="isTextFile" class="text-preview">
                            <div class="text-content">
                                <pre v-if="textContent">{{ textContent }}</pre>
                                <div v-else class="text-center text-muted py-5">
                                    <i class="fas fa-file-text fa-3x mb-3"></i>
                                    <p>無法載入文字內容</p>
                                </div>
                            </div>
                        </div>

                        <!-- 影片預覽 -->
                        <div v-else-if="isVideoFile" class="video-preview">
                            <video :src="file.PreviewUrl || file.PublicUrl"
                                   class="preview-video"
                                   controls
                                   preload="metadata"
                                   @loadeddata="onPreviewLoad"
                                   @error="onPreviewError">
                                您的瀏覽器不支援影片播放。
                            </video>
                        </div>

                        <!-- 音訊預覽 -->
                        <div v-else-if="isAudioFile" class="audio-preview">
                            <div class="audio-container">
                                <div class="audio-info">
                                    <i class="fas fa-music fa-4x text-primary mb-3"></i>
                                    <h5>{{ file.FileName }}</h5>
                                    <p class="text-muted">{{ file.FileSizeFormatted }}</p>
                                </div>
                                <audio :src="file.PreviewUrl || file.PublicUrl"
                                       class="audio-player"
                                       controls
                                       preload="metadata"
                                       @loadeddata="onPreviewLoad"
                                       @error="onPreviewError">
                                    您的瀏覽器不支援音訊播放。
                                </audio>
                            </div>
                        </div>

                        <!-- Office 文件預覽 -->
                        <div v-else-if="isOfficeFile" class="office-preview">
                            <div class="office-container">
                                <div class="office-info">
                                    <i :class="getFileIcon(file.FileExtension)" class="fa-4x mb-3"></i>
                                    <h5>{{ file.FileName }}</h5>
                                    <p class="text-muted">Office 文件預覽</p>
                                    <p class="text-muted small">{{ file.FileSizeFormatted }}</p>
                                </div>
                                <div class="office-actions">
                                    <button class="btn btn-primary" @click="downloadFile">
                                        <i class="fas fa-download me-2"></i>
                                        下載檔案
                                    </button>
                                    <button class="btn btn-outline-secondary" @click="openInNewTab">
                                        <i class="fas fa-external-link-alt me-2"></i>
                                        在新視窗開啟
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 不支援的檔案類型 -->
                        <div v-else class="unsupported-preview">
                            <div class="unsupported-container">
                                <div class="unsupported-info">
                                    <i class="fas fa-file fa-4x text-muted mb-3"></i>
                                    <h5>無法預覽此檔案</h5>
                                    <p class="text-muted">不支援 {{ file.FileExtension.toUpperCase() }} 檔案的線上預覽</p>
                                    <p class="text-muted small">檔案大小：{{ file.FileSizeFormatted }}</p>
                                </div>
                                <div class="unsupported-actions">
                                    <button class="btn btn-primary" @click="downloadFile">
                                        <i class="fas fa-download me-2"></i>
                                        下載檔案
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 預覽錯誤 -->
                        <div v-if="previewError" class="preview-error">
                            <div class="error-container">
                                <div class="error-info">
                                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                                    <h5>預覽載入失敗</h5>
                                    <p class="text-muted">{{ errorMessage }}</p>
                                </div>
                                <div class="error-actions">
                                    <button class="btn btn-outline-secondary" @click="retryPreview">
                                        <i class="fas fa-redo me-2"></i>
                                        重新載入
                                    </button>
                                    <button class="btn btn-primary" @click="downloadFile">
                                        <i class="fas fa-download me-2"></i>
                                        下載檔案
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="modal-footer">
                    <div class="d-flex justify-content-between w-100">
                        <div class="file-actions">
                            <button type="button" class="btn btn-outline-secondary" @click="downloadFile">
                                <i class="fas fa-download me-2"></i>
                                下載
                            </button>
                            <button type="button" class="btn btn-outline-secondary" @click="copyFileLink">
                                <i class="fas fa-link me-2"></i>
                                複製連結
                            </button>
                            <button type="button" class="btn btn-outline-secondary" @click="showFileInfo = !showFileInfo">
                                <i class="fas fa-info-circle me-2"></i>
                                檔案資訊
                            </button>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="closePreview">
                                關閉
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 檔案資訊側邊欄 -->
                <div v-if="showFileInfo" class="file-info-sidebar">
                    <div class="sidebar-header">
                        <h6 class="mb-0">檔案資訊</h6>
                        <button type="button" class="btn-close btn-sm" @click="showFileInfo = false"></button>
                    </div>
                    <div class="sidebar-content">
                        <div class="info-group">
                            <label>檔案名稱</label>
                            <p>{{ file.FileName }}</p>
                        </div>
                        <div class="info-group">
                            <label>原始名稱</label>
                            <p>{{ file.OriginalFileName }}</p>
                        </div>
                        <div class="info-group">
                            <label>檔案大小</label>
                            <p>{{ file.FileSizeFormatted }}</p>
                        </div>
                        <div class="info-group">
                            <label>檔案類型</label>
                            <p>{{ file.ContentType }}</p>
                        </div>
                        <div class="info-group">
                            <label>上傳者</label>
                            <p>{{ file.UploadedByUsername }}</p>
                        </div>
                        <div class="info-group">
                            <label>上傳時間</label>
                            <p>{{ formatDateTime(file.UploadedAt) }}</p>
                        </div>
                        <div class="info-group">
                            <label>最後修改</label>
                            <p>{{ formatDateTime(file.UpdatedAt) }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'FilePreview',
    props: {
        file: {
            type: Object,
            required: true
        }
    },

    data() {
        return {
            loading: true,
            previewError: false,
            errorMessage: '',
            textContent: '',
            showFileInfo: false,

            // 圖片控制
            scale: 1,
            rotation: 0,

            // 預覽狀態
            previewLoaded: false
        }
    },

    computed: {
        // 檔案類型判斷
        isImageFile() {
            const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
            return imageTypes.includes(this.file.FileExtension.toLowerCase());
        },

        isPdfFile() {
            return this.file.FileExtension.toLowerCase() === '.pdf';
        },

        isTextFile() {
            const textTypes = ['.txt', '.csv', '.json', '.xml', '.html', '.css', '.js'];
            return textTypes.includes(this.file.FileExtension.toLowerCase());
        },

        isVideoFile() {
            const videoTypes = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
            return videoTypes.includes(this.file.FileExtension.toLowerCase());
        },

        isAudioFile() {
            const audioTypes = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
            return audioTypes.includes(this.file.FileExtension.toLowerCase());
        },

        isOfficeFile() {
            const officeTypes = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
            return officeTypes.includes(this.file.FileExtension.toLowerCase());
        },

        // 圖片樣式
        imageStyle() {
            return {
                transform: `scale(${this.scale}) rotate(${this.rotation}deg)`,
                transition: 'transform 0.3s ease'
            };
        }
    },

    mounted() {
        this.initPreview();
    },

    methods: {
        // 初始化預覽
        async initPreview() {
            this.loading = true;
            this.previewError = false;

            try {
                if (this.isTextFile) {
                    await this.loadTextContent();
                } else {
                    // 其他檔案類型直接標記為載入完成
                    this.loading = false;
                }
            } catch (error) {
                this.onPreviewError(error);
            }
        },

        // 載入文字內容
        async loadTextContent() {
            try {
                const response = await fetch(this.file.PreviewUrl || this.file.PublicUrl);
                if (!response.ok) {
                    throw new Error('載入文字內容失敗');
                }
                this.textContent = await response.text();
                this.loading = false;
            } catch (error) {
                this.onPreviewError(error);
            }
        },

        // 預覽載入完成
        onPreviewLoad() {
            this.loading = false;
            this.previewLoaded = true;
        },

        // 圖片載入完成
        onImageLoad() {
            this.loading = false;
            this.previewLoaded = true;
        },

        // 預覽錯誤
        onPreviewError(error) {
            this.loading = false;
            this.previewError = true;
            this.errorMessage = error.message || '載入預覽時發生錯誤';
        },

        // 重新載入預覽
        retryPreview() {
            this.previewError = false;
            this.initPreview();
        },

        // 圖片縮放控制
        zoomIn() {
            if (this.scale < 3) {
                this.scale = Math.min(3, this.scale + 0.2);
            }
        },

        zoomOut() {
            if (this.scale > 0.1) {
                this.scale = Math.max(0.1, this.scale - 0.2);
            }
        },

        resetZoom() {
            this.scale = 1;
            this.rotation = 0;
        },

        // 圖片旋轉控制
        rotateLeft() {
            this.rotation -= 90;
        },

        rotateRight() {
            this.rotation += 90;
        },

        // 下載檔案
        downloadFile() {
            this.$emit('download', this.file);
        },

        // 複製檔案連結
        copyFileLink() {
            this.$emit('copy-link', this.file);
        },

        // 在新視窗開啟
        openInNewTab() {
            window.open(this.file.PreviewUrl || this.file.PublicUrl, '_blank');
        },

        // 關閉預覽
        closePreview() {
            this.$emit('close');
        },

        // 取得檔案圖示
        getFileIcon(extension) {
            const iconMap = {
                '.pdf': 'fas fa-file-pdf text-danger',
                '.doc': 'fas fa-file-word text-primary',
                '.docx': 'fas fa-file-word text-primary',
                '.xls': 'fas fa-file-excel text-success',
                '.xlsx': 'fas fa-file-excel text-success',
                '.ppt': 'fas fa-file-powerpoint text-warning',
                '.pptx': 'fas fa-file-powerpoint text-warning',
                '.txt': 'fas fa-file-text text-secondary',
                '.csv': 'fas fa-file-csv text-success',
                '.jpg': 'fas fa-file-image text-info',
                '.jpeg': 'fas fa-file-image text-info',
                '.png': 'fas fa-file-image text-info',
                '.gif': 'fas fa-file-image text-info',
                '.mp4': 'fas fa-file-video text-primary',
                '.mp3': 'fas fa-file-audio text-warning',
                '.zip': 'fas fa-file-archive text-secondary'
            };
            return iconMap[extension.toLowerCase()] || 'fas fa-file text-muted';
        },

        // 格式化日期
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        // 格式化日期時間
        formatDateTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
}
</script>

<style scoped>
    .modal-xl {
        max-width: 90vw;
    }

    .file-preview-header {
        flex: 1;
    }

    .file-meta {
        margin-top: 0.5rem;
        font-size: 0.875rem;
    }

    .modal-body {
        height: 70vh;
        min-height: 400px;
    }

    .preview-loading {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .preview-content {
        height: 100%;
        position: relative;
    }

    /* 圖片預覽 */
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
        background: #f8f9fa;
        position: relative;
    }

    .preview-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        cursor: grab;
    }

        .preview-image:active {
            cursor: grabbing;
        }

    .image-controls {
        padding: 1rem;
        background: white;
        border-top: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .zoom-level {
        font-size: 0.875rem;
        color: #6c757d;
        min-width: 50px;
        text-align: center;
    }

    /* PDF 預覽 */
    .pdf-preview {
        height: 100%;
    }

    .pdf-frame {
        width: 100%;
        height: 100%;
        border: none;
    }

    /* 文字預覽 */
    .text-preview {
        height: 100%;
        overflow: auto;
    }

    .text-content {
        padding: 1rem;
        height: 100%;
    }

        .text-content pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            margin: 0;
        }

    /* 影片預覽 */
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
    }

    /* 音訊預覽 */
    .audio-preview {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
    }

    .audio-container {
        text-align: center;
        max-width: 400px;
    }

    .audio-info {
        margin-bottom: 2rem;
    }

    .audio-player {
        width: 100%;
    }

    /* Office 文件和不支援的檔案 */
    .office-preview,
    .unsupported-preview {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
    }

    .office-container,
    .unsupported-container {
        text-align: center;
        max-width: 400px;
    }

    .office-info,
    .unsupported-info {
        margin-bottom: 2rem;
    }

    .office-actions,
    .unsupported-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    /* 預覽錯誤 */
    .preview-error {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(248, 249, 250, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    }

    .error-container {
        text-align: center;
        max-width: 400px;
    }

    .error-info {
        margin-bottom: 2rem;
    }

    .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    /* 檔案資訊側邊欄 */
    .file-info-sidebar {
        position: absolute;
        top: 0;
        right: 0;
        width: 300px;
        height: 100%;
        background: white;
        border-left: 1px solid #dee2e6;
        z-index: 20;
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: between;
        align-items: center;
    }

    .sidebar-content {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
    }

    .info-group {
        margin-bottom: 1rem;
    }

        .info-group label {
            font-weight: 600;
            font-size: 0.875rem;
            color: #495057;
            margin-bottom: 0.25rem;
            display: block;
        }

        .info-group p {
            margin: 0;
            font-size: 0.875rem;
            color: #6c757d;
            word-break: break-word;
        }

    /* 響應式設計 */
    @media (max-width: 768px) {
        .modal-xl {
            max-width: 95vw;
        }

        .modal-body {
            height: 60vh;
        }

        .file-info-sidebar {
            width: 250px;
        }

        .image-controls {
            padding: 0.5rem;
            flex-direction: column;
            gap: 0.5rem;
        }

        .office-actions,
        .unsupported-actions,
        .error-actions {
            flex-direction: column;
            align-items: center;
        }
    }

    @media (max-width: 576px) {
        .modal-body {
            height: 50vh;
            min-height: 300px;
        }

        .file-info-sidebar {
            width: 100%;
        }

        .file-meta {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .modal-footer .d-flex {
            flex-direction: column;
            gap: 1rem;
        }

        .file-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
        }
    }
</style>