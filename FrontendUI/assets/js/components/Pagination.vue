<!-- FrontendUI/assets/js/components/Pagination.vue -->
<template>
    <nav v-if="totalPages > 1" class="pagination-container" :aria-label="ariaLabel">
        <div class="d-flex justify-content-between align-items-center">
            <!-- 分頁資訊 -->
            <div class="pagination-info">
                <span class="text-muted">
                    顯示第 {{ startItem }} - {{ endItem }} 項，共 {{ totalItems }} 項
                </span>
            </div>

            <!-- 分頁控制 -->
            <ul class="pagination mb-0" :class="paginationClass">
                <!-- 第一頁 -->
                <li class="page-item" :class="{ disabled: currentPage <= 1 }" v-if="showFirstLast">
                    <button class="page-link"
                            @click="goToPage(1)"
                            :disabled="currentPage <= 1"
                            :title="firstPageTitle">
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                </li>

                <!-- 上一頁 -->
                <li class="page-item" :class="{ disabled: currentPage <= 1 }">
                    <button class="page-link"
                            @click="goToPage(currentPage - 1)"
                            :disabled="currentPage <= 1"
                            :title="prevPageTitle">
                        <i class="fas fa-chevron-left"></i>
                        <span v-if="showText" class="ms-1">上一頁</span>
                    </button>
                </li>

                <!-- 頁碼 -->
                <li v-for="page in visiblePages"
                    :key="page"
                    class="page-item"
                    :class="{ active: page === currentPage, disabled: page === '...' }">

                    <!-- 省略號 -->
                    <span v-if="page === '...'" class="page-link">...</span>

                    <!-- 頁碼按鈕 -->
                    <button v-else
                            class="page-link"
                            @click="goToPage(page)"
                            :aria-label="`前往第 ${page} 頁`"
                            :aria-current="page === currentPage ? 'page' : null">
                        {{ page }}
                    </button>
                </li>

                <!-- 下一頁 -->
                <li class="page-item" :class="{ disabled: currentPage >= totalPages }">
                    <button class="page-link"
                            @click="goToPage(currentPage + 1)"
                            :disabled="currentPage >= totalPages"
                            :title="nextPageTitle">
                        <span v-if="showText" class="me-1">下一頁</span>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </li>

                <!-- 最後一頁 -->
                <li class="page-item" :class="{ disabled: currentPage >= totalPages }" v-if="showFirstLast">
                    <button class="page-link"
                            @click="goToPage(totalPages)"
                            :disabled="currentPage >= totalPages"
                            :title="lastPageTitle">
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </li>
            </ul>

            <!-- 每頁顯示數量選擇 -->
            <div v-if="showPageSizeSelector" class="page-size-selector">
                <div class="d-flex align-items-center">
                    <label class="form-label me-2 mb-0 text-muted">每頁顯示：</label>
                    <select class="form-select form-select-sm"
                            v-model="selectedPageSize"
                            @change="onPageSizeChange"
                            style="width: auto;">
                        <option v-for="size in pageSizeOptions" :key="size" :value="size">
                            {{ size }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- 快速跳轉 -->
        <div v-if="showQuickJump" class="quick-jump mt-3">
            <div class="d-flex align-items-center justify-content-center">
                <span class="text-muted me-2">跳轉至：</span>
                <input type="number"
                       class="form-control form-control-sm me-2"
                       style="width: 80px;"
                       v-model.number="jumpPage"
                       :min="1"
                       :max="totalPages"
                       @keydown.enter="onQuickJump"
                       placeholder="頁碼">
                <button class="btn btn-outline-secondary btn-sm"
                        @click="onQuickJump"
                        :disabled="!isValidJumpPage">
                    前往
                </button>
            </div>
        </div>
    </nav>
</template>

<script>
export default {
    name: 'Pagination',
    props: {
        // 分頁數據
        currentPage: {
            type: Number,
            required: true,
            default: 1
        },
        totalPages: {
            type: Number,
            required: true,
            default: 1
        },
        totalItems: {
            type: Number,
            required: true,
            default: 0
        },
        pageSize: {
            type: Number,
            default: 50
        },

        // 顯示設定
        maxVisiblePages: {
            type: Number,
            default: 5
        },
        showFirstLast: {
            type: Boolean,
            default: true
        },
        showText: {
            type: Boolean,
            default: false
        },
        showPageSizeSelector: {
            type: Boolean,
            default: true
        },
        showQuickJump: {
            type: Boolean,
            default: true
        },

        // 樣式設定
        size: {
            type: String,
            default: '', // '', 'sm', 'lg'
            validator: value => ['', 'sm', 'lg'].includes(value)
        },

        // 文字設定
        ariaLabel: {
            type: String,
            default: '分頁導航'
        },
        firstPageTitle: {
            type: String,
            default: '第一頁'
        },
        lastPageTitle: {
            type: String,
            default: '最後一頁'
        },
        prevPageTitle: {
            type: String,
            default: '上一頁'
        },
        nextPageTitle: {
            type: String,
            default: '下一頁'
        },

        // 每頁大小選項
        pageSizeOptions: {
            type: Array,
            default: () => [10, 25, 50, 100]
        }
    },

    data() {
        return {
            selectedPageSize: this.pageSize,
            jumpPage: null
        }
    },

    computed: {
        // 分頁樣式類別
        paginationClass() {
            return this.size ? `pagination-${this.size}` : '';
        },

        // 起始項目編號
        startItem() {
            return Math.max(1, (this.currentPage - 1) * this.pageSize + 1);
        },

        // 結束項目編號
        endItem() {
            return Math.min(this.totalItems, this.currentPage * this.pageSize);
        },

        // 可見的頁碼
        visiblePages() {
            const pages = [];
            const maxVisible = this.maxVisiblePages;
            const current = this.currentPage;
            const total = this.totalPages;

            if (total <= maxVisible) {
                // 如果總頁數少於等於最大顯示數，顯示所有頁碼
                for (let i = 1; i <= total; i++) {
                    pages.push(i);
                }
            } else {
                // 計算顯示範圍
                let start = Math.max(1, current - Math.floor(maxVisible / 2));
                let end = Math.min(total, start + maxVisible - 1);

                // 調整起始位置
                if (end - start + 1 < maxVisible) {
                    start = Math.max(1, end - maxVisible + 1);
                }

                // 添加第一頁和省略號
                if (start > 1) {
                    pages.push(1);
                    if (start > 2) {
                        pages.push('...');
                    }
                }

                // 添加中間頁碼
                for (let i = start; i <= end; i++) {
                    pages.push(i);
                }

                // 添加省略號和最後一頁
                if (end < total) {
                    if (end < total - 1) {
                        pages.push('...');
                    }
                    pages.push(total);
                }
            }

            return pages;
        },

        // 驗證跳轉頁碼
        isValidJumpPage() {
            return this.jumpPage &&
                   this.jumpPage >= 1 &&
                   this.jumpPage <= this.totalPages &&
                   this.jumpPage !== this.currentPage;
        }
    },

    watch: {
        pageSize(newValue) {
            this.selectedPageSize = newValue;
        },

        currentPage() {
            // 當頁碼改變時清除跳轉輸入
            this.jumpPage = null;
        }
    },

    methods: {
        // 前往指定頁面
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
                this.$emit('page-change', page);
            }
        },

        // 每頁大小改變
        onPageSizeChange() {
            this.$emit('page-size-change', this.selectedPageSize);
        },

        // 快速跳轉
        onQuickJump() {
            if (this.isValidJumpPage) {
                this.goToPage(this.jumpPage);
                this.jumpPage = null;
            }
        },

        // 上一頁
        prevPage() {
            this.goToPage(this.currentPage - 1);
        },

        // 下一頁
        nextPage() {
            this.goToPage(this.currentPage + 1);
        },

        // 第一頁
        firstPage() {
            this.goToPage(1);
        },

        // 最後一頁
        lastPage() {
            this.goToPage(this.totalPages);
        }
    }
}
</script>

<style scoped>
    .pagination-container {
        margin: 1rem 0;
    }

    .pagination-info {
        font-size: 0.875rem;
    }

    .page-size-selector {
        font-size: 0.875rem;
    }

    .quick-jump {
        padding-top: 1rem;
        border-top: 1px solid #dee2e6;
    }

    .page-link {
        border: 1px solid #dee2e6;
        color: #6c757d;
        padding: 0.5rem 0.75rem;
        text-decoration: none;
        cursor: pointer;
        background: none;
        transition: all 0.15s ease-in-out;
    }

        .page-link:hover {
            background-color: #e9ecef;
            border-color: #adb5bd;
            color: #495057;
        }

        .page-link:focus {
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
            z-index: 3;
        }

    .page-item.active .page-link {
        background-color: #0d6efd;
        border-color: #0d6efd;
        color: white;
        z-index: 3;
    }

    .page-item.disabled .page-link {
        color: #6c757d;
        pointer-events: none;
        background-color: #fff;
        border-color: #dee2e6;
        cursor: not-allowed;
        opacity: 0.65;
    }

    .pagination-sm .page-link {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
    }

    .pagination-lg .page-link {
        padding: 0.75rem 1.5rem;
        font-size: 1.25rem;
    }

    .form-select-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
    }

    /* 響應式設計 */
    @media (max-width: 768px) {
        .pagination-container .d-flex {
            flex-direction: column;
            gap: 1rem;
        }

        .pagination-info,
        .page-size-selector {
            text-align: center;
        }

        .pagination {
            justify-content: center;
        }

        .page-link {
            padding: 0.375rem 0.5rem;
            font-size: 0.875rem;
        }

        .quick-jump .d-flex {
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
        }
    }

    @media (max-width: 576px) {
        .pagination-container {
            font-size: 0.875rem;
        }

        .page-link {
            padding: 0.25rem 0.375rem;
            font-size: 0.75rem;
        }

        .pagination-info {
            font-size: 0.75rem;
        }
    }
</style>