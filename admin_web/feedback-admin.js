// 全局变量
let currentPage = 1;
let totalPages = 1;
let perPage = 20;
let allFeedback = [];
let filteredFeedback = [];

// API基础URL
const API_BASE_URL = 'https://data-core.onrender.com/api/feedback';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFeedbackStats();
    loadFeedbackList();
    
    // 设置自动刷新（每5分钟）
    setInterval(refreshData, 5 * 60 * 1000);
});

// 加载反馈统计
async function loadFeedbackStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        
        if (data.success) {
            updateStats(data.data);
        } else {
            showError('获取统计信息失败');
        }
    } catch (error) {
        console.error('获取统计信息失败:', error);
        showError('网络错误，请检查连接');
    }
}

// 更新统计信息显示
function updateStats(stats) {
    document.getElementById('totalFeedback').textContent = stats.total_feedback;
    document.getElementById('averageRating').textContent = stats.average_rating.toFixed(1);
    
    // 计算今日反馈数
    const today = new Date().toISOString().split('T')[0];
    const todayCount = stats.recent_feedback.filter(feedback => 
        feedback.timestamp.startsWith(today)
    ).length;
    document.getElementById('todayFeedback').textContent = todayCount;
    
    // 更新评分分布
    updateRatingDistribution(stats.rating_distribution, stats.total_feedback);
}

// 更新评分分布图表
function updateRatingDistribution(distribution, total) {
    for (let i = 1; i <= 5; i++) {
        const count = distribution[`${i}星`] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        document.getElementById(`count${i}`).textContent = count;
        document.getElementById(`bar${i}`).style.width = `${percentage}%`;
    }
}

// 加载反馈列表
async function loadFeedbackList(page = 1) {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/list?page=${page}&per_page=${perPage}`);
        const data = await response.json();
        
        if (data.success) {
            currentPage = data.data.pagination.page;
            totalPages = data.data.pagination.pages;
            allFeedback = data.data.feedback_list;
            filteredFeedback = [...allFeedback];
            
            updateFeedbackList();
            updatePagination();
        } else {
            showError('获取反馈列表失败');
        }
    } catch (error) {
        console.error('获取反馈列表失败:', error);
        showError('网络错误，请检查连接');
    } finally {
        showLoading(false);
    }
}

// 更新反馈列表显示
function updateFeedbackList() {
    const feedbackList = document.getElementById('feedbackList');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredFeedback.length === 0) {
        feedbackList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    feedbackList.style.display = 'block';
    emptyState.style.display = 'none';
    
    feedbackList.innerHTML = filteredFeedback.map(feedback => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div class="feedback-select">
                    <input type="checkbox" class="feedback-checkbox" value="${feedback.id}" onchange="updateBatchDeleteButton()">
                </div>
                <div class="feedback-content-main" onclick="showFeedbackDetail(${feedback.id})">
                    <div class="feedback-header-info">
                        <div class="rating-display">
                            ${'★'.repeat(feedback.rating)}
                            <span class="rating-text">${feedback.rating}/5</span>
                        </div>
                        <span class="feedback-time">${formatTime(feedback.timestamp)}</span>
                    </div>
                    
                    <div class="feedback-content">
                        <p class="feedback-suggestion">${feedback.suggestion}</p>
                    </div>
                    
                    <div class="feedback-footer">
                        <span class="feedback-id">ID: ${feedback.id}</span>
                        <span class="feedback-ip">${feedback.ip_address}</span>
                    </div>
                </div>
                <div class="feedback-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteFeedback(${feedback.id})" title="删除此反馈">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 更新分页信息
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
    } else {
        pagination.style.display = 'flex';
        paginationInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }
}

// 显示反馈详情
async function showFeedbackDetail(feedbackId) {
    const feedback = allFeedback.find(f => f.id === feedbackId);
    if (!feedback) return;
    
    // 填充模态框内容
    document.getElementById('modalId').textContent = feedback.id;
    document.getElementById('modalRating').innerHTML = `
        <div class="rating-display">
            ${'★'.repeat(feedback.rating)}
            <span class="rating-text">${feedback.rating}/5</span>
        </div>
    `;
    document.getElementById('modalSuggestion').textContent = feedback.suggestion;
    document.getElementById('modalTime').textContent = formatTime(feedback.timestamp);
    document.getElementById('modalIp').textContent = feedback.ip_address;
    document.getElementById('modalUserAgent').textContent = feedback.user_agent || '未知';
    
    // 显示模态框
    document.getElementById('feedbackModal').style.display = 'flex';
}

// 关闭模态框
function closeModal() {
    document.getElementById('feedbackModal').style.display = 'none';
}

// 刷新数据
async function refreshData() {
    await loadFeedbackStats();
    await loadFeedbackList(currentPage);
    showSuccess('数据已刷新');
}

// 上一页
function prevPage() {
    if (currentPage > 1) {
        loadFeedbackList(currentPage - 1);
    }
}

// 下一页
function nextPage() {
    if (currentPage < totalPages) {
        loadFeedbackList(currentPage + 1);
    }
}

// 搜索过滤
function filterFeedback() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        filteredFeedback = [...allFeedback];
    } else {
        filteredFeedback = allFeedback.filter(feedback => 
            feedback.suggestion.toLowerCase().includes(searchTerm) ||
            feedback.id.toString().includes(searchTerm) ||
            feedback.ip_address.toLowerCase().includes(searchTerm)
        );
    }
    
    updateFeedbackList();
}

// 导出数据
function exportData() {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `反馈数据_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 生成CSV内容
function generateCSV() {
    const headers = ['ID', '评分', '建议内容', '提交时间', 'IP地址', '用户代理'];
    const rows = allFeedback.map(feedback => [
        feedback.id,
        feedback.rating,
        `"${feedback.suggestion.replace(/"/g, '""')}"`,
        formatTime(feedback.timestamp),
        feedback.ip_address,
        `"${(feedback.user_agent || '').replace(/"/g, '""')}"`
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// 格式化时间
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    // 后端现在返回 YYYY-MM-DDTHH:MM:SS+08:00 格式
    const date = new Date(timestamp);
    
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 显示加载状态
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const feedbackList = document.getElementById('feedbackList');
    const emptyState = document.getElementById('emptyState');
    
    if (show) {
        loadingState.style.display = 'block';
        feedbackList.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
    }
}

// 显示成功消息
function showSuccess(message) {
    showNotification(message, 'success');
}

// 显示错误消息
function showError(message) {
    showNotification(message, 'error');
}

// 显示通知
function showNotification(message, type) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 点击模态框外部关闭
document.getElementById('feedbackModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// 删除单个反馈
async function deleteFeedback(feedbackId) {
    if (!confirm(`确定要删除反馈 ID: ${feedbackId} 吗？\n\n此操作不可撤销！`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/delete/${feedbackId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            showSuccess('反馈删除成功');
            // 重新加载数据
            await loadFeedbackStats();
            await loadFeedbackList(currentPage);
        } else {
            showError(data.message || '删除失败');
        }
    } catch (error) {
        console.error('删除反馈失败:', error);
        showError('网络错误，删除失败');
    }
}

// 批量删除反馈
async function batchDelete() {
    const selectedCheckboxes = document.querySelectorAll('.feedback-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    
    if (selectedIds.length === 0) {
        showError('请选择要删除的反馈');
        return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条反馈吗？\n\n此操作不可撤销！`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/batch-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                feedback_ids: selectedIds
            })
        });
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`成功删除 ${data.data.deleted_count} 条反馈`);
            // 重新加载数据
            await loadFeedbackStats();
            await loadFeedbackList(currentPage);
        } else {
            showError(data.message || '批量删除失败');
        }
    } catch (error) {
        console.error('批量删除失败:', error);
        showError('网络错误，批量删除失败');
    }
}

// 更新批量删除按钮显示状态
function updateBatchDeleteButton() {
    const selectedCheckboxes = document.querySelectorAll('.feedback-checkbox:checked');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    
    if (selectedCheckboxes.length > 0) {
        batchDeleteBtn.style.display = 'inline-flex';
        batchDeleteBtn.innerHTML = `
            <i class="fas fa-trash"></i>
            批量删除 (${selectedCheckboxes.length})
        `;
    } else {
        batchDeleteBtn.style.display = 'none';
    }
}

// 全选/取消全选
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.feedback-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    
    updateBatchDeleteButton();
} 