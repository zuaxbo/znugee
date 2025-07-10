<!-- FrontendUI/assets/js/components/FileGrid.vue -->
<template>
    <div class="file-grid-container">
        <!-- 檔案網格 -->
        <div class="file-grid" :class="gridClass">
            <div v-for="file in files"
                 :key="file.Id"
                 class="file-grid-item"
                 :class="{
                    'selected': isSelected(file.Id),
                    'hover-effect': !isSelecting
                }"
                 @click="handleFileClick(file)"
                 @contextmenu.prevent="handleRightClick(file, $event)">

                <!-- 選擇框 -->
                <div class="file-checkbox" v-if="showCheckbox">
                    <input type="checkbox"
                           class="form-check-input"
                           :checked="isSelected(file.Id)"
                           @click.stop="toggleSelection(file.Id)"
                           @change="onSelectionChange(file.Id, $event)">
                </div>

                <!-- 檔案縮圖/圖示 -->
                <div class="file-thumbnail">
                    <!-- 圖片檔案顯示縮圖 -->
                    <img v-if="file.IsImage && file.ThumbnailUrl"
                         :src="file.ThumbnailUrl"
                         :alt="file.FileName"
                         class="thumbnail-image"
                         @error="onImageError"
                         @load="onImageLoad">

                    <!-- 非圖片檔案顯示圖示 -->
                    <div v-else class="file-icon">
                        <i :class="getFileIcon(file.FileExtension)" class="file-type-icon"></i>
                        <div class="file-extension">{{ file.FileExtension.replace('.', '').toUpperCase() }}</div>
                    </div>

                    <!-- 檔案狀態覆蓋層 -->
                    <div class="file-overlay">
                        <!-- 選擇狀態 -->
                        <div v-if="isSelected(file.Id)" class="selection-overlay">
                            <i class="fas fa-check-circle"></i>
                        </div>

                        <!-- 懸停操作按鈕 -->
                        <div class="hover-actions" v-if="showActions">
                            <button type="button"
                                    class="btn btn-sm btn-light action-btn"
                                    @click.stop="previewFile(file)"
                                    title="預覽">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button"
                                    class="btn btn-sm btn-light action-btn"
                                    @click.stop="downloadFile(file)"
                                    title="下載">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 檔案資訊 -->
                <div class="file-info">
                    <div class="file-name" :title="file.OriginalFileName">
                        {{ file.FileName }}
                    </div>
                    <div class="file-meta">
                        <span class="file-size">{{ file.FileSizeFormatted }}</span>
                        <span class="file-date">{{ formatDate(file.UploadedAt) }}</span>
                    </div>
                    <div v-if="showUploader" class="file-uploader">
                        <i class="fas fa-user text-muted"></i>
                        {{ file.UploadedByUsername }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 空狀態 -->
        <div v-if="files.length === 0" class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-folder-open"></i>
            </div>
            <h5 class="empty-title">沒有檔案</h5>
            <p class="empty-subtitle text-muted">{{ emptyMessage }}</p>
        </div>

        <!-- 右鍵選單 -->
        <div v-if="contextMenu.show"
             class="context-menu"
             :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
             @click.stop>
            <div class="context-menu-content">
                <button class="context-menu-item" @click="previewFile(contextMenu.file)">
                    <i class="fas fa-eye me-2"></i>
                    預覽
                </button>
                <button class="context-menu-item" @click="downloadFile(contextMenu.file)">
                    <i class="fas fa-download me-2"></i>
                    下載
                </button>
                <button class="context-menu-item" @click="copyFileLink(contextMenu.file)">
                    <i class="fas fa-link me-2"></i>
                    複製連結
                </button>
                <div class="context-menu-divider"></div>
                <button class="context-menu-item" @click="renameFile(contextMenu.file)">
                    <i class="fas fa-edit me-2"></i>
                    重新命名
                </button>
                <button class="context-menu-item text-danger" @click="deleteFile(contextMenu.file)">
                    <i class="fas fa-trash me-2"></i>
                    刪除
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'FileGrid',
    props: {
        // 檔案數據
        files: {
            type: Array,
            required: true,
            default: () => []
        },

        // 選中的檔案ID列表
        selectedFiles: {
            type: Array,
            default: () => []
        },

        // 顯示設定
        showCheckbox: {
            type: Boolean,
            default: true
        },
        showActions: {
            type: Boolean,
            default: true
        },
        showUploader: {
            type: Boolean,
            default: true
        },

        // 網格設定
        gridSize: {
            type: String,
            default: 'medium', // small, medium, large
            validator: value => ['small', 'medium', 'large'].includes(value)
        },

        // 互動設定
        allowMultiSelect: {
            type: Boolean,
            default: true
        },
        allowRightClick: {
            type: Boolean,
            default: true
        },

        // 空狀態訊息
        emptyMessage: {
            type: String,
            default: '這裡還沒有任何檔案'
        }
    },

    data() {
        return {
            isSelecting: false,
            contextMenu: {
                show: false,
                x: 0,
                y: 0,
                file: null
            }
        }
    },

    computed: {
        // 網格樣式類別
        gridClass() {
            return `grid-${this.gridSize}`;
        }
    },

    mounted() {
        // 監聽點擊事件以關閉右鍵選單
        document.addEventListener('click', this.closeContextMenu);
        document.addEventListener('contextmenu', this.closeContextMenu);
        document.addEventListener('scroll', this.closeContextMenu);
    },

    beforeDestroy() {
        // 清理事件監聽器
        document.removeEventListener('click', this.closeContextMenu);
        document.removeEventListener('contextmenu', this.closeContextMenu);
        document.removeEventListener('scroll', this.closeContextMenu);
    },

    methods: {
        // 檢查檔案是否被選中
        isSelected(fileId) {
            return this.selectedFiles.includes(fileId);
        },

        // 處理檔案點擊
        handleFileClick(file) {
            if (this.isSelecting || this.allowMultiSelect) {
                this.toggleSelection(file.Id);
            } else {
                this.previewFile(file);
            }
        },

        // 處理右鍵點擊
        handleRightClick(file, event) {
            if (!this.allowRightClick) return;

            this.contextMenu = {
                show: true,
                x: event.clientX,
                y: event.clientY,
                file: file
            };
        },

        // 切換選擇狀態
        toggleSelection(fileId) {
            this.$emit('select', fileId);
        },

        // 選擇變更處理
        onSelectionChange(fileId, event) {
            if (event.target.checked) {
                this.$emit('select', fileId);
            } else {
                this.$emit('unselect', fileId);
            }
        },

        // 預覽檔案
        previewFile(file) {
            this.closeContextMenu();
            this.$emit('preview', file);
        },

        // 下載檔案
        downloadFile(file) {
            this.closeContextMenu();
            this.$emit('download', file);
        },

        // 複製檔案連結
        copyFileLink(file) {
            this.closeContextMenu();
            this.$emit('copy-link', file);
        },

        // 重新命名檔案
        renameFile(file) {
            this.closeContextMenu();
            this.$emit('rename', file);
        },

        // 刪除檔案
        deleteFile(file) {
            this.closeContextMenu();
            this.$emit('delete', file);
        },

        // 關閉右鍵選單
        closeContextMenu() {
            this.contextMenu.show = false;
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
                '.mp4': 'fas fa-file-video text-primary',
                '.avi': 'fas fa-file-video text-primary',
                '.mov': 'fas fa-file-video text-primary',
                '.wmv': 'fas fa-file-video text-primary',
                '.mp3': 'fas fa-file-audio text-warning',
                '.wav': 'fas fa-file-audio text-warning',
                '.flac': 'fas fa-file-audio text-warning',
                '.aac': 'fas fa-file-audio text-warning',
                '.zip': 'fas fa-file-archive text-secondary',
                '.rar': 'fas fa-file-archive text-secondary',
                '.7z': 'fas fa-file-archive text-secondary'
            };
            return iconMap[extension.toLowerCase()] || 'fas fa-file text-muted';
        },

        // 格式化日期
        formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                return '今天';
            } else if (diffDays === 2) {
                return '昨天';
            } else if (diffDays <= 7) {
                return `${diffDays} 天前`;
            } else {
                return date.toLocaleDateString('zh-TW', {
                    month: '2-digit',
                    day: '2-digit'
                });
            }
        },

        // 圖片載入錯誤處理
        onImageError(event) {
            // 圖片載入失敗時隱藏圖片，顯示檔案圖示
            event.target.style.display = 'none';
        },

        // 圖片載入成功處理
        onImageLoad(event) {
            // 圖片載入成功時顯示圖片
            event.target.style.display = 'block';
        }
    }
}
</script>

<style scoped>
    .file-grid-container {
        position: relative;
    }

    .file-grid {
        display: grid;
        gap: 1rem;
        padding: 1rem 0;
    }

        /* 網格大小變體 */
        .file-grid.grid-small {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }

        .file-grid.grid-medium {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        }

        .file-grid.grid-large {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }

    .file-grid-item {
        position: relative;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 0.5rem;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

        .file-grid-item.hover-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-color: #0d6efd;
        }

        .file-grid-item.selected {
            border-color: #0d6efd;
            background-color: #f0f8ff;
            box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
        }

    .file-checkbox {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        z-index: 2;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 0.25rem;
        padding: 0.25rem;
    }

    .file-thumbnail {
        position: relative;
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        overflow: hidden;
    }

    .thumbnail-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.2s ease;
    }

    .file-grid-item:hover .thumbnail-image {
        transform: scale(1.05);
    }

    .file-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #6c757d;
    }

    .file-type-icon {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
    }

    .file-extension {
        font-size: 0.75rem;
        font-weight: 600;
        color: #495057;
        background: rgba(108, 117, 125, 0.1);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }

    .file-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        opacity: 0;
        transition: opacity 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .file-grid-item:hover .file-overlay,
    .file-grid-item.selected .file-overlay {
        opacity: 1;
    }

    .selection-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #0d6efd;
        font-size: 2rem;
        text-shadow: 0 0 4px white;
    }

    .hover-actions {
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

        .action-btn:hover {
            background-color: white !important;
            transform: scale(1.1);
        }

    .file-info {
        padding: 0.75rem;
        border-top: 1px solid #dee2e6;
    }

    .file-name {
        font-weight: 500;
        font-size: 0.875rem;
        line-height: 1.2;
        margin-bottom: 0.25rem;
        word-break: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .file-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #6c757d;
        margin-bottom: 0.25rem;
    }

    .file-uploader {
        font-size: 0.7rem;
        color: #6c757d;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #6c757d;
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .empty-title {
        margin-bottom: 0.5rem;
        color: #495057;
    }

    .empty-subtitle {
        font-size: 0.875rem;
    }

    /* 右鍵選單 */
    .context-menu {
        position: fixed;
        z-index: 1050;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        padding: 0.5rem 0;
        min-width: 160px;
    }

    .context-menu-content {
        display: flex;
        flex-direction: column;
    }

    .context-menu-item {
        background: none;
        border: none;
        padding: 0.5rem 1rem;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.15s ease;
        display: flex;
        align-items: center;
        font-size: 0.875rem;
    }

        .context-menu-item:hover {
            background-color: #f8f9fa;
        }

        .context-menu-item.text-danger:hover {
            background-color: #f8d7da;
            color: #721c24;
        }

    .context-menu-divider {
        height: 1px;
        background-color: #dee2e6;
        margin: 0.5rem 0;
    }

    /* 響應式設計 */
    @media (max-width: 768px) {
        .file-grid.grid-small {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 0.75rem;
        }

        .file-grid.grid-medium {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 0.75rem;
        }

        .file-grid.grid-large {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 0.75rem;
        }

        .file-info {
            padding: 0.5rem;
        }

        .file-name {
            font-size: 0.8rem;
        }

        .file-meta {
            font-size: 0.7rem;
        }

        .file-uploader {
            font-size: 0.65rem;
        }
    }

    @media (max-width: 576px) {
        .file-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)) !important;
            gap: 0.5rem;
        }

        .file-type-icon {
            font-size: 1.5rem;
        }

        .file-extension {
            font-size: 0.6rem;
        }

        .action-btn {
            width: 1.5rem;
            height: 1.5rem;
            font-size: 0.75rem;
        }
    }
</style>