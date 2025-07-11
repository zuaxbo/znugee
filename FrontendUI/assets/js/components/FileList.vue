<!-- FrontendUI/assets/js/components/FileList.vue -->
<template>
    <div class="file-list-container">
        <!-- 列表標題欄 -->
        <div class="list-header" v-if="showHeader">
            <div class="header-row">
                <!-- 全選框 -->
                <div class="header-cell select-cell" v-if="showCheckbox">
                    <input type="checkbox"
                           class="form-check-input"
                           :checked="isAllSelected"
                           :indeterminate="isPartialSelected"
                           @change="toggleSelectAll"
                           ref="selectAllCheckbox">
                </div>

                <!-- 檔案名稱 -->
                <div class="header-cell name-cell sortable" @click="sort('FileName')">
                    <span>檔案名稱</span>
                    <i class="sort-icon" :class="getSortIcon('FileName')"></i>
                </div>

                <!-- 檔案大小 -->
                <div class="header-cell size-cell sortable" @click="sort('FileSize')">
                    <span>大小</span>
                    <i class="sort-icon" :class="getSortIcon('FileSize')"></i>
                </div>

                <!-- 檔案類型 -->
                <div class="header-cell type-cell sortable" @click="sort('FileExtension')">
                    <span>類型</span>
                    <i class="sort-icon" :class="getSortIcon('FileExtension')"></i>
                </div>

                <!-- 上傳時間 -->
                <div class="header-cell date-cell sortable" @click="sort('UploadedAt')">
                    <span>上傳時間</span>
                    <i class="sort-icon" :class="getSortIcon('UploadedAt')"></i>
                </div>

                <!-- 上傳者 -->
                <div class="header-cell uploader-cell" v-if="showUploader">
                    <span>上傳者</span>
                </div>

                <!-- 操作 -->
                <div class="header-cell actions-cell" v-if="showActions">
                    <span>操作</span>
                </div>
            </div>
        </div>

        <!-- 檔案列表 -->
        <div class="list-body">
            <div v-for="file in files"
                 :key="file.Id"
                 class="file-row"
                 :class="{
                    'selected': isSelected(file.Id),
                    'hover-highlight': !isSelected(file.Id)
                }"
                 @click="handleRowClick(file)"
                 @contextmenu.prevent="handleRightClick(file, $event)">

                <!-- 選擇框 -->
                <div class="row-cell select-cell" v-if="showCheckbox">
                    <input type="checkbox"
                           class="form-check-input"
                           :checked="isSelected(file.Id)"
                           @click.stop="toggleSelection(file.Id)"
                           @change="onSelectionChange(file.Id, $event)">
                </div>

                <!-- 檔案名稱和圖示 -->
                <div class="row-cell name-cell">
                    <div class="file-name-container">
                        <!-- 檔案圖示/縮圖 -->
                        <div class="file-thumbnail">
                            <img v-if="file.IsImage && file.ThumbnailUrl"
                                 :src="file.ThumbnailUrl"
                                 :alt="file.FileName"
                                 class="thumbnail-img"
                                 @error="onImageError">
                            <i v-else :class="getFileIcon(file.FileExtension)" class="file-icon"></i>
                        </div>

                        <!-- 檔案名稱 -->
                        <div class="file-name-info">
                            <div class="file-name" :title="file.OriginalFileName">
                                {{ file.FileName }}
                            </div>
                            <div class="file-path text-muted" v-if="showPath">
                                {{ file.FilePath }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 檔案大小 -->
                <div class="row-cell size-cell">
                    <span class="file-size">{{ file.FileSizeFormatted }}</span>
                </div>

                <!-- 檔案類型 -->
                <div class="row-cell type-cell">
                    <span class="file-type-badge" :class="getTypeClass(file.FileExtension)">
                        {{ file.FileExtension.replace('.', '').toUpperCase() }}
                    </span>
                </div>

                <!-- 上傳時間 -->
                <div class="row-cell date-cell">
                    <div class="date-info">
                        <div class="date-main">{{ formatDate(file.UploadedAt) }}</div>
                        <div class="date-detail text-muted">{{ formatTime(file.UploadedAt) }}</div>
                    </div>
                </div>

                <!-- 上傳者 -->
                <div class="row-cell uploader-cell" v-if="showUploader">
                    <div class="uploader-info">
                        <i class="fas fa-user text-muted me-1"></i>
                        <span>{{ file.UploadedByUsername }}</span>
                    </div>
                </div>

                <!-- 操作按鈕 -->
                <div class="row-cell actions-cell" v-if="showActions">
                    <div class="action-buttons">
                        <button type="button"
                                class="btn btn-sm btn-outline-primary action-btn"
                                @click.stop="previewFile(file)"
                                title="預覽">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button"
                                class="btn btn-sm btn-outline-secondary action-btn"
                                @click.stop="downloadFile(file)"
                                title="下載">
                            <i class="fas fa-download"></i>
                        </button>

                        <!-- 下拉選單 -->
                        <div class="dropdown">
                            <button type="button"
                                    class="btn btn-sm btn-outline-secondary dropdown-toggle action-btn"
                                    data-bs-toggle="dropdown"
                                    @click.stop
                                    title="更多操作">
                                <i class="fas fa-ellipsis-h"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button class="dropdown-item" @click="copyFileLink(file)">
                                        <i class="fas fa-link me-2"></i>
                                        複製連結
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item" @click="renameFile(file)">
                                        <i class="fas fa-edit me-2"></i>
                                        重新命名
                                    </button>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                                <li>
                                    <button class="dropdown-item text-danger" @click="deleteFile(file)">
                                        <i class="fas fa-trash me-2"></i>
                                        刪除
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空狀態 -->
        <div v-if="files.length === 0" class="empty-state">
            <div class="empty-content">
                <div class="empty-icon">
                    <i class="fas fa-list-alt"></i>
                </div>
                <h5 class="empty-title">沒有檔案</h5>
                <p class="empty-subtitle text-muted">{{ emptyMessage }}</p>
            </div>
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
    name: 'FileList',
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
        showHeader: {
            type: Boolean,
            default: true
        },
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
        showPath: {
            type: Boolean,
            default: false
        },

        // 排序設定
        sortBy: {
            type: String,
            default: 'UploadedAt'
        },
        sortOrder: {
            type: String,
            default: 'desc',
            validator: value => ['asc', 'desc'].includes(value)
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
            currentSortBy: this.sortBy,
            currentSortOrder: this.sortOrder,
            contextMenu: {
                show: false,
                x: 0,
                y: 0,
                file: null
            }
        }
    },

    computed: {
        // 是否全選
        isAllSelected() {
            return this.files.length > 0 && this.selectedFiles.length === this.files.length;
        },

        // 是否部分選中
        isPartialSelected() {
            return this.selectedFiles.length > 0 && this.selectedFiles.length < this.files.length;
        }
    },

    watch: {
        // 監聽部分選中狀態以設定 indeterminate
        isPartialSelected(newValue) {
            this.$nextTick(() => {
                if (this.$refs.selectAllCheckbox) {
                    this.$refs.selectAllCheckbox.indeterminate = newValue;
                }
            });
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

        // 處理行點擊
        handleRowClick(file) {
            if (this.allowMultiSelect) {
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

        // 全選/取消全選
        toggleSelectAll() {
            this.$emit('select-all');
        },

        // 排序
        sort(column) {
            if (this.currentSortBy === column) {
                // 切換排序順序
                this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                // 設定新的排序欄位
                this.currentSortBy = column;
                this.currentSortOrder = 'asc';
            }

            this.$emit('sort', {
                sortBy: this.currentSortBy,
                sortOrder: this.currentSortOrder
            });
        },

        // 取得排序圖示
        getSortIcon(column) {
            if (this.currentSortBy !== column) {
                return 'fas fa-sort text-muted';
            }

            return this.currentSortOrder === 'asc'
                ? 'fas fa-sort-up text-primary'
                : 'fas fa-sort-down text-primary';
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

        // 取得檔案類型樣式
        getTypeClass(extension) {
            const typeMap = {
                '.pdf': 'type-pdf',
                '.doc': 'type-word',
                '.docx': 'type-word',
                '.xls': 'type-excel',
                '.xlsx': 'type-excel',
                '.ppt': 'type-powerpoint',
                '.pptx': 'type-powerpoint',
                '.jpg': 'type-image',
                '.jpeg': 'type-image',
                '.png': 'type-image',
                '.gif': 'type-image',
                '.mp4': 'type-video',
                '.avi': 'type-video',
                '.mp3': 'type-audio',
                '.wav': 'type-audio',
                '.zip': 'type-archive',
                '.rar': 'type-archive'
            };
            return typeMap[extension.toLowerCase()] || 'type-default';
        },

        // 格式化日期
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        },

        // 格式化時間
        formatTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        // 圖片載入錯誤處理
        onImageError(event) {
            event.target.style.display = 'none';
        }
    }
}
</script>

<style scoped>
    .file-list-container {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        overflow: hidden;
    }

    .list-header {
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .header-row {
        display: grid;
        grid-template-columns: auto 1fr auto auto auto auto auto;
        align-items: center;
        padding: 0.75rem;
        font-weight: 600;
        font-size: 0.875rem;
        color: #495057;
    }

    .header-cell {
        padding: 0 0.5rem;
        display: flex;
        align-items: center;
    }

        .header-cell.sortable {
            cursor: pointer;
            user-select: none;
            transition: color 0.15s ease;
        }

            .header-cell.sortable:hover {
                color: #0d6efd;
            }

    .sort-icon {
        margin-left: 0.5rem;
        font-size: 0.75rem;
    }

    .select-cell {
        width: 50px;
        justify-content: center;
    }

    .name-cell {
        min-width: 200px;
    }

    .size-cell {
        width: 100px;
        justify-content: flex-end;
    }

    .type-cell {
        width: 80px;
        justify-content: center;
    }

    .date-cell {
        width: 130px;
    }

    .uploader-cell {
        width: 120px;
    }

    .actions-cell {
        width: 140px;
        justify-content: center;
    }

    .list-body {
        max-height: 600px;
        overflow-y: auto;
    }

    .file-row {
        display: grid;
        grid-template-columns: auto 1fr auto auto auto auto auto;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid #f1f3f5;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

        .file-row:last-child {
            border-bottom: none;
        }

        .file-row.hover-highlight:hover {
            background-color: #f8f9fa;
        }

        .file-row.selected {
            background-color: #e7f3ff;
            border-color: #0d6efd;
        }

    .row-cell {
        padding: 0 0.5rem;
        display: flex;
        align-items: center;
    }

    .file-name-container {
        display: flex;
        align-items: center;
        min-width: 0;
    }

    .file-thumbnail {
        width: 32px;
        height: 32px;
        margin-right: 0.75rem;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.25rem;
        overflow: hidden;
        background: #f8f9fa;
    }

    .thumbnail-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .file-icon {
        font-size: 1.25rem;
    }

    .file-name-info {
        min-width: 0;
        flex: 1;
    }

    .file-name {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 0.125rem;
    }

    .file-path {
        font-size: 0.75rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .file-size {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .file-type-badge {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        text-align: center;
    }

    .type-pdf {
        background: #ffebee;
        color: #c62828;
    }

    .type-word {
        background: #e3f2fd;
        color: #1565c0;
    }

    .type-excel {
        background: #e8f5e8;
        color: #2e7d32;
    }

    .type-powerpoint {
        background: #fff3e0;
        color: #ef6c00;
    }

    .type-image {
        background: #e1f5fe;
        color: #0277bd;
    }

    .type-video {
        background: #f3e5f5;
        color: #7b1fa2;
    }

    .type-audio {
        background: #fff8e1;
        color: #f57f17;
    }

    .type-archive {
        background: #f5f5f5;
        color: #424242;
    }

    .type-default {
        background: #fafafa;
        color: #757575;
    }

    .date-info {
        text-align: left;
    }

    .date-main {
        font-size: 0.875rem;
        margin-bottom: 0.125rem;
    }

    .date-detail {
        font-size: 0.75rem;
    }

    .uploader-info {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        color: #6c757d;
    }

    .action-buttons {
        display: flex;
        gap: 0.25rem;
    }

    .action-btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        border-radius: 0.25rem;
    }

    .empty-state {
        padding: 3rem 1rem;
    }

    .empty-content {
        text-align: center;
        color: #6c757d;
    }

    .empty-icon {
        font-size: 3rem;
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
        .header-row,
        .file-row {
            grid-template-columns: auto 1fr auto auto;
        }

        .type-cell,
        .uploader-cell {
            display: none;
        }

        .date-cell {
            width: 100px;
        }

        .actions-cell {
            width: 80px;
        }

        .action-buttons .btn:nth-child(n+3) {
            display: none;
        }

        .file-name {
            font-size: 0.875rem;
        }

        .file-size {
            font-size: 0.8rem;
        }
    }

    @media (max-width: 576px) {
        .header-row,
        .file-row {
            grid-template-columns: auto 1fr auto;
            padding: 0.5rem;
        }

        .size-cell {
            display: none;
        }

        .date-cell {
            width: 60px;
        }

        .date-detail {
            display: none;
        }

        .actions-cell {
            width: 60px;
        }

        .action-buttons .btn:not(:first-child) {
            display: none;
        }

        .file-thumbnail {
            width: 24px;
            height: 24px;
            margin-right: 0.5rem;
        }

        .file-icon {
            font-size: 1rem;
        }
    }
</style>