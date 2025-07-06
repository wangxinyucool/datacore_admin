// 全局变量
let currentPage = 1;
let currentStatus = '';
let currentSearch = '';
let selectedMessages = new Set();
let currentMessageId = null;

// API基础URL
const API_BASE_URL = 'https://data-core.onrender.com';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadMessages();
    
    // 搜索框回车事件
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMessages();
        }
    });
});

// 加载统计信息
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalCount').textContent = data.data.total;
            document.getElementById('unreadCount').textContent = data.data.unread;
            document.getElementById('repliedCount').textContent = data.data.replied;
            document.getElementById('unrepliedCount').textContent = data.data.unreplied;
        }
    } catch (error) {
        console.error('加载统计信息失败:', error);
    }
}

// 加载留言列表
async function loadMessages() {
    showLoading();
    
    try {
        const params = new URLSearchParams({
            page: currentPage,
            per_page: 20
        });
        
        if (currentStatus) {
            params.append('status', currentStatus);
        }
        
        if (currentSearch) {
            params.append('search', currentSearch);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/messages?${params}`);
        const data = await response.json();
        
        if (data.success) {
            renderMessages(data.data);
            renderPagination(data.pagination);
        } else {
            showError('加载留言失败: ' + data.error);
        }
    } catch (error) {
        console.error('加载留言失败:', error);
        showError('网络连接失败，请检查网络后重试');
    } finally {
        hideLoading();
    }
}

// 渲染留言列表
function renderMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    
    if (messages.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    messagesList.innerHTML = messages.map(message => `
        <div class="message-item ${message.is_read ? '' : 'unread'}" data-id="${message.id}">
            <div class="message-checkbox">
                <input type="checkbox" onchange="toggleMessageSelection(${message.id})" ${selectedMessages.has(message.id) ? 'checked' : ''}>
            </div>
            <div class="message-info">
                <div class="message-name">${escapeHtml(message.name)}</div>
                <div class="message-email">${escapeHtml(message.email)}</div>
                <div class="message-subject">${escapeHtml(message.subject)}</div>
            </div>
            <div class="message-status">
                <span class="status-badge ${getStatusClass(message)}">${getStatusText(message)}</span>
            </div>
            <div class="message-time">${formatTime(message.created_at)}</div>
            <div class="message-actions">
                <button class="action-btn view-btn" onclick="viewMessage(${message.id})" title="查看详情">👁️</button>
                <button class="action-btn delete-btn" onclick="confirmDelete(${message.id})" title="删除">🗑️</button>
            </div>
        </div>
    `).join('');
    
    updateBatchActions();
}

// 获取状态样式类
function getStatusClass(message) {
    if (message.is_replied) return 'replied';
    if (message.is_read) return 'read';
    return 'unread';
}

// 获取状态文本
function getStatusText(message) {
    if (message.is_replied) return '已回复';
    if (message.is_read) return '已读';
    return '未读';
}

// 渲染分页
function renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    
    if (pagination.pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHtml = '';
    
    // 上一页
    paginationHtml += `
        <button class="pagination-btn" onclick="changePage(${pagination.page - 1})" ${pagination.page <= 1 ? 'disabled' : ''}>
            上一页
        </button>
    `;
    
    // 页码
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.pages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button class="pagination-btn ${i === pagination.page ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // 下一页
    paginationHtml += `
        <button class="pagination-btn" onclick="changePage(${pagination.page + 1})" ${pagination.page >= pagination.pages ? 'disabled' : ''}>
            下一页
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHtml;
}

// 切换留言选择
function toggleMessageSelection(messageId) {
    if (selectedMessages.has(messageId)) {
        selectedMessages.delete(messageId);
    } else {
        selectedMessages.add(messageId);
    }
    
    updateSelectAll();
    updateBatchActions();
}

// 全选/取消全选
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const messageCheckboxes = document.querySelectorAll('.message-checkbox input[type="checkbox"]');
    
    messageCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const messageId = parseInt(checkbox.closest('.message-item').dataset.id);
        
        if (selectAllCheckbox.checked) {
            selectedMessages.add(messageId);
        } else {
            selectedMessages.delete(messageId);
        }
    });
    
    updateBatchActions();
}

// 更新全选状态
function updateSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const messageCheckboxes = document.querySelectorAll('.message-checkbox input[type="checkbox"]');
    const checkedCount = document.querySelectorAll('.message-checkbox input[type="checkbox"]:checked').length;
    
    selectAllCheckbox.checked = checkedCount === messageCheckboxes.length && messageCheckboxes.length > 0;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < messageCheckboxes.length;
}

// 更新批量操作区域
function updateBatchActions() {
    const batchActions = document.getElementById('batchActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedMessages.size > 0) {
        batchActions.style.display = 'flex';
        selectedCount.textContent = selectedMessages.size;
    } else {
        batchActions.style.display = 'none';
    }
}

// 搜索留言
function searchMessages() {
    currentSearch = document.getElementById('searchInput').value.trim();
    currentPage = 1;
    loadMessages();
}

// 过滤留言
function filterMessages(status) {
    currentStatus = status;
    currentPage = 1;
    
    // 更新过滤按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadMessages();
}

// 切换页面
function changePage(page) {
    currentPage = page;
    loadMessages();
}

// 查看留言详情
async function viewMessage(messageId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`);
        const data = await response.json();
        
        if (data.success) {
            showMessageModal(data.data);
            currentMessageId = messageId;
        } else {
            showError('获取留言详情失败: ' + data.error);
        }
    } catch (error) {
        console.error('获取留言详情失败:', error);
        showError('网络连接失败，请检查网络后重试');
    }
}

// 显示留言详情模态框
function showMessageModal(message) {
    const modal = document.getElementById('messageModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="message-detail">
            <div class="detail-item">
                <div class="detail-label">姓名</div>
                <div class="detail-value">${escapeHtml(message.name)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">邮箱</div>
                <div class="detail-value">${escapeHtml(message.email)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">主题</div>
                <div class="detail-value">${escapeHtml(message.subject)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">留言内容</div>
                <div class="detail-content">${escapeHtml(message.content)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">提交时间</div>
                <div class="detail-value">${formatTime(message.created_at)}</div>
            </div>
            ${message.device_info ? `
            <div class="detail-item">
                <div class="detail-label">设备信息</div>
                <div class="detail-value">${escapeHtml(message.device_info)}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
    currentMessageId = null;
}

// 标记为已回复
async function markAsReplied() {
    if (!currentMessageId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${currentMessageId}/reply`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showSuccess('已标记为已回复');
            closeModal();
            loadMessages();
            loadStats();
        } else {
            showError('操作失败: ' + data.error);
        }
    } catch (error) {
        console.error('标记已回复失败:', error);
        showError('网络连接失败，请检查网络后重试');
    }
}

// 确认删除留言
function confirmDelete(messageId) {
    if (confirm('确定要删除这条留言吗？此操作不可恢复。')) {
        deleteMessage(messageId);
    }
}

// 删除留言
async function deleteMessage(messageId = null) {
    const id = messageId || currentMessageId;
    if (!id) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            showSuccess('留言删除成功');
            closeModal();
            loadMessages();
            loadStats();
        } else {
            showError('删除失败: ' + data.error);
        }
    } catch (error) {
        console.error('删除留言失败:', error);
        showError('网络连接失败，请检查网络后重试');
    }
}

// 批量删除
async function batchDelete() {
    if (selectedMessages.size === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedMessages.size} 条留言吗？此操作不可恢复。`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/batch-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: Array.from(selectedMessages)
            })
        });
        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            selectedMessages.clear();
            loadMessages();
            loadStats();
        } else {
            showError('批量删除失败: ' + data.error);
        }
    } catch (error) {
        console.error('批量删除失败:', error);
        showError('网络连接失败，请检查网络后重试');
    }
}

// 批量标记已回复
async function batchReply() {
    if (selectedMessages.size === 0) return;
    
    try {
        const promises = Array.from(selectedMessages).map(id => 
            fetch(`${API_BASE_URL}/api/messages/${id}/reply`, { method: 'POST' })
        );
        
        await Promise.all(promises);
        
        showSuccess(`已标记 ${selectedMessages.size} 条留言为已回复`);
        selectedMessages.clear();
        loadMessages();
        loadStats();
    } catch (error) {
        console.error('批量标记失败:', error);
        showError('网络连接失败，请检查网络后重试');
    }
}

// 显示加载状态
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('messagesList').style.display = 'none';
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('messagesList').style.display = 'block';
}

// 显示空状态
function showEmptyState() {
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('messagesList').style.display = 'none';
}

// 隐藏空状态
function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('messagesList').style.display = 'block';
}

// 显示成功消息
function showSuccess(message) {
    alert('✅ ' + message);
}

// 显示错误消息
function showError(message) {
    alert('❌ ' + message);
}

// 转义HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化时间
function formatTime(timeString) {
    if (!timeString) return '';
    
    // 后端现在返回 YYYY-MM-DDTHH:MM:SS+08:00 格式
    const date = new Date(timeString);
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60000) {
        return '刚刚';
    }
    
    // 小于1小时
    if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
    }
    
    // 小于24小时
    if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
    }
    
    // 小于30天
    if (diff < 2592000000) {
        return Math.floor(diff / 86400000) + '天前';
    }
    
    // 超过30天显示具体日期
    return date.toLocaleDateString('zh-CN') + 
           ' ' + date.toLocaleTimeString('zh-CN', { 
               hour: '2-digit', 
               minute: '2-digit'
           });
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('messageModal');
    if (event.target === modal) {
        closeModal();
    }
} 