<!-- FrontendUI/assets/js/components/SearchBar.vue -->
<template>
    <div class="search-bar-container">
        <div class="input-group">
            <!-- 搜尋輸入框 -->
            <input type="text"
                   class="form-control"
                   :class="inputClass"
                   :placeholder="placeholder"
                   v-model="searchQuery"
                   @input="onInput"
                   @keydown.enter="onSearch"
                   @keydown.esc="onClear"
                   ref="searchInput">

            <!-- 清除按鈕 -->
            <button v-if="searchQuery && showClearButton"
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="onClear"
                    title="清除搜尋">
                <i class="fas fa-times"></i>
            </button>

            <!-- 搜尋按鈕 -->
            <button type="button"
                    class="btn"
                    :class="buttonClass"
                    @click="onSearch"
                    :disabled="loading"
                    :title="buttonTitle">
                <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                <i v-else :class="buttonIcon"></i>
            </button>

            <!-- 進階篩選按鈕 -->
            <button v-if="showAdvancedFilter"
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="toggleAdvancedFilter"
                    :class="{ active: showAdvanced }"
                    title="進階篩選">
                <i class="fas fa-filter"></i>
            </button>
        </div>

        <!-- 進階篩選區域 -->
        <div v-if="showAdvanced" class="advanced-filter-panel mt-3">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <!-- 檔案類型篩選 -->
                        <div class="col-md-4 mb-3">
                            <label class="form-label">檔案類型</label>
                            <select class="form-select" v-model="filters.fileType" @change="onFilterChange">
                                <option value="">所有類型</option>
                                <option value="image">圖片檔案</option>
                                <option value="document">文件檔案</option>
                                <option value="video">影片檔案</option>
                                <option value="audio">音訊檔案</option>
                                <option value="archive">壓縮檔案</option>
                            </select>
                        </div>

                        <!-- 檔案大小篩選 -->
                        <div class="col-md-4 mb-3">
                            <label class="form-label">檔案大小</label>
                            <select class="form-select" v-model="filters.fileSize" @change="onFilterChange">
                                <option value="">所有大小</option>
                                <option value="small">小於 1MB</option>
                                <option value="medium">1MB - 10MB</option>
                                <option value="large">10MB - 50MB</option>
                                <option value="xlarge">大於 50MB</option>
                            </select>
                        </div>

                        <!-- 上傳時間篩選 -->
                        <div class="col-md-4 mb-3">
                            <label class="form-label">上傳時間</label>
                            <select class="form-select" v-model="filters.uploadTime" @change="onFilterChange">
                                <option value="">所有時間</option>
                                <option value="today">今天</option>
                                <option value="week">本週</option>
                                <option value="month">本月</option>
                                <option value="year">本年</option>
                            </select>
                        </div>
                    </div>

                    <!-- 篩選操作按鈕 -->
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="btn btn-outline-secondary btn-sm" @click="resetFilters">
                            <i class="fas fa-undo me-1"></i>
                            重置
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" @click="applyFilters">
                            <i class="fas fa-check me-1"></i>
                            套用篩選
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 搜尋建議 -->
        <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
            <div class="dropdown-menu show position-absolute w-100" style="z-index: 1050;">
                <h6 class="dropdown-header">搜尋建議</h6>
                <button v-for="(suggestion, index) in suggestions"
                        :key="index"
                        type="button"
                        class="dropdown-item"
                        @click="selectSuggestion(suggestion)">
                    <i class="fas fa-search text-muted me-2"></i>
                    {{ suggestion }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SearchBar',
    props: {
        // 基本設定
        placeholder: {
            type: String,
            default: '搜尋檔案...'
        },
        value: {
            type: String,
            default: ''
        },
        loading: {
            type: Boolean,
            default: false
        },

        // 樣式設定
        inputClass: {
            type: String,
            default: ''
        },
        buttonClass: {
            type: String,
            default: 'btn-outline-secondary'
        },
        buttonIcon: {
            type: String,
            default: 'fas fa-search'
        },
        buttonTitle: {
            type: String,
            default: '搜尋'
        },

        // 功能設定
        showClearButton: {
            type: Boolean,
            default: true
        },
        showAdvancedFilter: {
            type: Boolean,
            default: true
        },
        showSuggestions: {
            type: Boolean,
            default: true
        },

        // 搜尋建議
        suggestions: {
            type: Array,
            default: () => []
        },

        // 延遲搜尋時間 (毫秒)
        debounceTime: {
            type: Number,
            default: 500
        }
    },

    data() {
        return {
            searchQuery: this.value,
            showAdvanced: false,
            searchTimeout: null,
            filters: {
                fileType: '',
                fileSize: '',
                uploadTime: ''
            }
        }
    },

    watch: {
        value(newValue) {
            this.searchQuery = newValue;
        }
    },

    methods: {
        // 輸入處理
        onInput() {
            // 清除之前的定時器
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            // 設定延遲搜尋
            this.searchTimeout = setTimeout(() => {
                this.performSearch();
            }, this.debounceTime);

            // 立即發送輸入事件
            this.$emit('input', this.searchQuery);
        },

        // 執行搜尋
        onSearch() {
            // 清除定時器並立即搜尋
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            this.performSearch();
        },

        // 執行搜尋邏輯
        performSearch() {
            const searchData = {
                query: this.searchQuery.trim(),
                filters: this.getActiveFilters()
            };

            this.$emit('search', searchData);
        },

        // 清除搜尋
        onClear() {
            this.searchQuery = '';
            this.$emit('input', '');
            this.$emit('clear');
            this.$refs.searchInput.focus();
        },

        // 切換進階篩選
        toggleAdvancedFilter() {
            this.showAdvanced = !this.showAdvanced;
            this.$emit('toggle-advanced', this.showAdvanced);
        },

        // 篩選變更
        onFilterChange() {
            this.$emit('filter-change', this.getActiveFilters());
        },

        // 重置篩選
        resetFilters() {
            this.filters = {
                fileType: '',
                fileSize: '',
                uploadTime: ''
            };
            this.onFilterChange();
        },

        // 套用篩選
        applyFilters() {
            this.performSearch();
        },

        // 取得有效的篩選條件
        getActiveFilters() {
            const activeFilters = {};

            Object.keys(this.filters).forEach(key => {
                if (this.filters[key]) {
                    activeFilters[key] = this.filters[key];
                }
            });

            return activeFilters;
        },

        // 選擇搜尋建議
        selectSuggestion(suggestion) {
            this.searchQuery = suggestion;
            this.$emit('input', suggestion);
            this.performSearch();
        },

        // 焦點到搜尋框
        focus() {
            this.$refs.searchInput.focus();
        },

        // 清除焦點
        blur() {
            this.$refs.searchInput.blur();
        }
    },

    beforeDestroy() {
        // 清理定時器
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
}
</script>

<style scoped>
    .search-bar-container {
        position: relative;
    }

    .advanced-filter-panel {
        animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .search-suggestions {
        position: relative;
        z-index: 1050;
    }

    .btn.active {
        background-color: #0d6efd;
        border-color: #0d6efd;
        color: white;
    }

    .form-label {
        font-weight: 500;
        color: #495057;
    }

    .dropdown-item {
        padding: 0.5rem 1rem;
        cursor: pointer;
    }

        .dropdown-item:hover {
            background-color: #f8f9fa;
        }

    .input-group .btn {
        border-left: none;
    }

    .input-group .form-control:focus {
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        border-color: #86b7fe;
    }

    .card {
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
</style>