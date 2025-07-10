// assets/js/utils/file-utils.js
const FileUtils = {
    // 檔案拖放處理
    setupDragAndDrop(dropZone, onFilesDropped) {
        if (!dropZone) return;

        // 防止預設拖放行為
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults);
            document.body.addEventListener(eventName, this.preventDefaults);
        });

        // 添加視覺回饋
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.highlight(dropZone));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.unhighlight(dropZone));
        });

        // 處理檔案放下
        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                onFilesDropped(files);
            }
        });
    },

    // 防止預設行為
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    // 高亮拖放區域
    highlight(element) {
        element.classList.add('drag-over');
    },

    // 移除高亮
    unhighlight(element) {
        element.classList.remove('drag-over');
    },

    // 批量檔案驗證
    validateFiles(files) {
        const results = {
            valid: [],
            invalid: [],
            errors: []
        };

        files.forEach(file => {
            const validation = Utils.validateFile(file);
            if (validation.isValid) {
                results.valid.push(file);
            } else {
                results.invalid.push(file);
                results.errors.push(...validation.errors);
            }
        });

        return results;
    },

    // 批量上傳檔案
    async uploadFiles(files, onProgress = null) {
        const results = [];
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: totalFiles,
                        fileName: file.name,
                        status: 'uploading'
                    });
                }

                const result = await FileAPI.uploadFile(file);
                results.push({
                    file: file,
                    success: result.success,
                    message: result.message,
                    data: result.data
                });

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: totalFiles,
                        fileName: file.name,
                        status: result.success ? 'success' : 'error'
                    });
                }
            } catch (error) {
                results.push({
                    file: file,
                    success: false,
                    message: error.message
                });

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: totalFiles,
                        fileName: file.name,
                        status: 'error'
                    });
                }
            }
        }

        return results;
    },

    // 建立檔案預覽
    createFilePreview(file) {
        return new Promise((resolve) => {
            if (Utils.isImageFile(file.name)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        type: 'image',
                        url: e.target.result,
                        name: file.name,
                        size: file.size
                    });
                };
                reader.readAsDataURL(file);
            } else {
                resolve({
                    type: 'file',
                    icon: Utils.getFileIcon(Utils.getFileExtension(file.name)),
                    name: file.name,
                    size: file.size
                });
            }
        });
    },

    // 複製檔案連結
    async copyFileLink(fileId, fileName) {
        const url = FileAPI.getDownloadUrl(fileId);
        const success = await Utils.copyToClipboard(url);

        if (success) {
            Utils.showToast(`已複製 "${fileName}" 的連結`, 'success');
        } else {
            Utils.showToast('複製連結失敗', 'error');
        }

        return success;
    },

    // 取得檔案類型篩選選項
    getFileTypeFilters() {
        return [
            { value: '', label: '所有檔案' },
            { value: '.jpg,.jpeg,.png,.gif,.bmp,.svg', label: '圖片檔案' },
            { value: '.pdf', label: 'PDF 文件' },
            { value: '.doc,.docx', label: 'Word 文件' },
            { value: '.xls,.xlsx', label: 'Excel 文件' },
            { value: '.ppt,.pptx', label: 'PowerPoint 文件' },
            { value: '.txt,.csv', label: '文字檔案' },
            { value: '.mp4,.avi,.mov,.wmv', label: '影片檔案' },
            { value: '.mp3,.wav,.flac,.aac', label: '音訊檔案' },
            { value: '.zip,.rar,.7z', label: '壓縮檔案' }
        ];
    },

    // 取得排序選項
    getSortOptions() {
        return [
            { value: 'UploadedAt-desc', label: '上傳時間 (新到舊)' },
            { value: 'UploadedAt-asc', label: '上傳時間 (舊到新)' },
            { value: 'FileName-asc', label: '檔案名稱 (A-Z)' },
            { value: 'FileName-desc', label: '檔案名稱 (Z-A)' },
            { value: 'FileSize-desc', label: '檔案大小 (大到小)' },
            { value: 'FileSize-asc', label: '檔案大小 (小到大)' }
        ];
    }
};

// 匯出檔案工具
window.FileUtils = FileUtils;