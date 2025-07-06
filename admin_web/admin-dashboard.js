// 全局变量
let currentModule = 'feedback';
let isLoggedIn = false;
let loginTimeout = null;
let apiStatus = {
    feedback: true,
    message: true
};

// 管理员账户信息（实际项目中应该从服务器验证）
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'datacore2024'
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupEventListeners();
    
    // 检查登录超时
    setInterval(checkLoginTimeout, 60000); // 每分钟检查一次
    
    // 检查API状态
    checkAPIStatus();
});

// 设置事件监听器
function setupEventListeners() {
    // 登录表单提交
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    // 导航项点击
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const module = this.dataset.module;
            switchModule(module);
        });
    });
}

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('adminToken');
    const loginTime = localStorage.getItem('loginTime');
    
    if (token && loginTime) {
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const timeout = 2 * 60 * 60 * 1000; // 2小时超时
        
        if (now - loginTimestamp < timeout) {
            // 登录有效
            isLoggedIn = true;
            showDashboard();
            loadModuleData();
        } else {
            // 登录已过期
            logout();
        }
    } else {
        showLogin();
    }
}

// 处理登录
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    
    // 显示加载状态
    loginBtn.classList.add('loading');
    loginBtn.querySelector('.btn-text').style.display = 'none';
    loginBtn.querySelector('.loading-spinner').style.display = 'block';
    
    try {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 验证用户名和密码
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // 登录成功
            const token = generateToken();
            localStorage.setItem('adminToken', token);
            localStorage.setItem('loginTime', Date.now().toString());
            localStorage.setItem('adminUsername', username);
            
            isLoggedIn = true;
            showDashboard();
            loadModuleData();
            
            // 设置登录超时
            loginTimeout = setTimeout(logout, 2 * 60 * 60 * 1000); // 2小时后自动登出
            
            showSuccess('登录成功！');
        } else {
            showError('用户名或密码错误');
        }
    } catch (error) {
        showError('登录失败，请重试');
    } finally {
        // 恢复按钮状态
        loginBtn.classList.remove('loading');
        loginBtn.querySelector('.btn-text').style.display = 'block';
        loginBtn.querySelector('.loading-spinner').style.display = 'none';
    }
}

// 生成简单的token（实际项目中应该使用JWT）
function generateToken() {
    return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 显示登录界面
function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
}

// 显示管理界面
function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'flex';
    
    // 设置用户名
    const username = localStorage.getItem('adminUsername') || '管理员';
    document.getElementById('userName').textContent = username;
}

// 显示错误提示
function showError(message) {
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorToast.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        hideError();
    }, 3000);
}

// 隐藏错误提示
function hideError() {
    document.getElementById('errorToast').style.display = 'none';
}

// 显示成功提示
function showSuccess(message) {
    const successToast = document.getElementById('successToast');
    const successMessage = document.getElementById('successMessage');
    
    successMessage.textContent = message;
    successToast.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        hideSuccess();
    }, 3000);
}

// 隐藏成功提示
function hideSuccess() {
    document.getElementById('successToast').style.display = 'none';
}

// 切换模块
function switchModule(module) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-module="${module}"]`).classList.add('active');
    
    // 隐藏所有模块
    document.querySelectorAll('.module-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // 显示选中的模块
    document.getElementById(module + 'Module').style.display = 'block';
    
    // 更新页面标题
    updatePageTitle(module);
    
    // 保存当前模块
    currentModule = module;
    
    // 加载模块数据
    loadModuleData();
}

// 更新页面标题
function updatePageTitle(module) {
    const titles = {
        feedback: {
            title: '反馈管理',
            subtitle: '管理用户反馈和建议'
        },
        message: {
            title: '留言管理',
            subtitle: '管理用户留言和咨询'
        },
        stats: {
            title: '系统统计',
            subtitle: '实时数据统计和系统状态'
        },
        settings: {
            title: '系统设置',
            subtitle: '管理系统配置和参数'
        }
    };
    
    const moduleInfo = titles[module];
    if (moduleInfo) {
        document.getElementById('pageTitle').textContent = moduleInfo.title;
        document.getElementById('pageSubtitle').textContent = moduleInfo.subtitle;
    }
}

// 加载模块数据
function loadModuleData() {
    switch (currentModule) {
        case 'feedback':
            loadFeedbackStats();
            break;
        case 'message':
            loadMessageStats();
            break;
        case 'stats':
            loadSystemStats();
            break;
        case 'settings':
            // 设置模块不需要加载数据
            break;
    }
}

// 加载反馈统计
async function loadFeedbackStats() {
    // 如果反馈API不可用，显示模拟数据
    if (!apiStatus.feedback) {
        console.log('反馈API不可用，显示模拟数据');
        document.getElementById('feedbackBadge').textContent = '0';
        if (currentModule === 'stats') {
            document.getElementById('totalFeedback').textContent = '0';
            document.getElementById('avgRating').textContent = '0.0';
        }
        return;
    }
    
    try {
        const response = await fetch('https://data-core.onrender.com/api/feedback/stats');
        
        if (!response.ok) {
            console.error('反馈API响应错误:', response.status, response.statusText);
            apiStatus.feedback = false;
            document.getElementById('feedbackBadge').textContent = '0';
            if (currentModule === 'stats') {
                document.getElementById('totalFeedback').textContent = '0';
                document.getElementById('avgRating').textContent = '0.0';
            }
            showAPIStatus();
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            const unreadCount = data.data.unread;
            document.getElementById('feedbackBadge').textContent = unreadCount;
            
            // 如果当前在统计页面，也更新统计数据
            if (currentModule === 'stats') {
                document.getElementById('totalFeedback').textContent = data.data.total;
                document.getElementById('avgRating').textContent = data.data.average_rating.toFixed(1);
            }
        } else {
            console.error('反馈API返回错误:', data.error);
            apiStatus.feedback = false;
            document.getElementById('feedbackBadge').textContent = '0';
            showAPIStatus();
        }
    } catch (error) {
        console.error('加载反馈统计失败:', error);
        apiStatus.feedback = false;
        document.getElementById('feedbackBadge').textContent = '0';
        if (currentModule === 'stats') {
            document.getElementById('totalFeedback').textContent = '0';
            document.getElementById('avgRating').textContent = '0.0';
        }
        showAPIStatus();
    }
}

// 加载留言统计
async function loadMessageStats() {
    // 如果留言API不可用，显示模拟数据
    if (!apiStatus.message) {
        console.log('留言API不可用，显示模拟数据');
        document.getElementById('messageBadge').textContent = '0';
        if (currentModule === 'stats') {
            document.getElementById('totalMessages').textContent = '0';
        }
        return;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
        
        const response = await fetch('https://data-core.onrender.com/api/messages/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.error('留言API响应错误:', response.status, response.statusText);
            if (response.status === 500) {
                showError('服务器内部错误，可能是数据库连接问题');
            } else {
                showError(`服务器错误: ${response.status}`);
            }
            apiStatus.message = false;
            document.getElementById('messageBadge').textContent = '0';
            if (currentModule === 'stats') {
                document.getElementById('totalMessages').textContent = '0';
            }
            showAPIStatus();
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            const unreadCount = data.data.unread;
            document.getElementById('messageBadge').textContent = unreadCount;
            
            // 如果当前在统计页面，也更新统计数据
            if (currentModule === 'stats') {
                document.getElementById('totalMessages').textContent = data.data.total;
            }
        } else {
            console.error('留言API返回错误:', data.message);
            showError('获取留言统计失败: ' + data.message);
            apiStatus.message = false;
            document.getElementById('messageBadge').textContent = '0';
            showAPIStatus();
        }
    } catch (error) {
        console.error('加载留言统计失败:', error);
        
        if (error.name === 'AbortError') {
            showError('请求超时，服务器响应时间过长');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('网络连接失败，请检查网络');
        } else {
            showError('获取留言统计失败: ' + error.message);
        }
        
        apiStatus.message = false;
        document.getElementById('messageBadge').textContent = '0';
        if (currentModule === 'stats') {
            document.getElementById('totalMessages').textContent = '0';
        }
        showAPIStatus();
    }
}

// 加载系统统计
async function loadSystemStats() {
    // 加载反馈统计
    await loadFeedbackStats();
    
    // 加载留言统计
    await loadMessageStats();
    
    // 计算今日提交数（这里简化处理，实际应该从后端获取）
    const today = new Date().toDateString();
    const todaySubmissions = Math.floor(Math.random() * 10) + 1; // 模拟数据
    document.getElementById('todaySubmissions').textContent = todaySubmissions;
}

// 刷新当前模块
async function refreshCurrentModule() {
    const refreshBtn = document.getElementById('refreshBtn');
    
    // 显示加载状态
    refreshBtn.classList.add('loading');
    refreshBtn.querySelector('.btn-text').style.display = 'none';
    refreshBtn.querySelector('.loading-spinner').style.display = 'block';
    
    try {
        await loadModuleData();
        
        // 如果是iframe模块，刷新iframe
        const currentModuleElement = document.getElementById(currentModule + 'Module');
        const iframe = currentModuleElement.querySelector('iframe');
        if (iframe) {
            iframe.src = iframe.src;
        }
        
        showSuccess('刷新成功');
    } catch (error) {
        console.error('刷新失败:', error);
        showError('刷新失败，请重试');
    } finally {
        // 恢复按钮状态
        refreshBtn.classList.remove('loading');
        refreshBtn.querySelector('.btn-text').style.display = 'block';
        refreshBtn.querySelector('.loading-spinner').style.display = 'none';
    }
}

// 退出登录
function logout() {
    // 清除本地存储
    localStorage.removeItem('adminToken');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('adminUsername');
    
    // 清除超时定时器
    if (loginTimeout) {
        clearTimeout(loginTimeout);
        loginTimeout = null;
    }
    
    // 重置状态
    isLoggedIn = false;
    currentModule = 'feedback';
    
    // 显示登录界面
    showLogin();
    
    // 清空表单
    document.getElementById('loginForm').reset();
}

// 检查登录超时
function checkLoginTimeout() {
    if (!isLoggedIn) return;
    
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const timeout = 2 * 60 * 60 * 1000; // 2小时超时
        
        if (now - loginTimestamp >= timeout) {
            alert('登录已超时，请重新登录');
            logout();
        }
    }
}

// 定期更新统计数据
setInterval(() => {
    if (isLoggedIn) {
        loadFeedbackStats();
        loadMessageStats();
    }
}, 30000); // 每30秒更新一次

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    if (!isLoggedIn) return;
    
    // Ctrl + R 刷新当前模块
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refreshCurrentModule();
    }
    
    // Ctrl + L 退出登录
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
    
    // 数字键切换模块
    if (e.key >= '1' && e.key <= '4') {
        const modules = ['feedback', 'message', 'stats', 'settings'];
        const moduleIndex = parseInt(e.key) - 1;
        if (modules[moduleIndex]) {
            switchModule(modules[moduleIndex]);
        }
    }
});

// 页面可见性变化时检查登录状态
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && isLoggedIn) {
        checkLoginStatus();
    }
});

// 防止页面刷新时丢失状态
window.addEventListener('beforeunload', function() {
    if (isLoggedIn) {
        // 可以在这里保存一些状态
    }
});

// 检查API状态
async function checkAPIStatus() {
    console.log('检查API状态...');
    
    // 检查反馈API
    try {
        const feedbackResponse = await fetch('https://data-core.onrender.com/api/feedback/stats');
        apiStatus.feedback = feedbackResponse.ok;
        if (!feedbackResponse.ok) {
            console.warn('反馈API不可用:', feedbackResponse.status);
        }
    } catch (error) {
        console.warn('反馈API连接失败:', error);
        apiStatus.feedback = false;
    }
    
    // 检查留言API
    try {
        const messageResponse = await fetch('https://data-core.onrender.com/api/messages/stats');
        apiStatus.message = messageResponse.ok;
        if (!messageResponse.ok) {
            console.warn('留言API不可用:', messageResponse.status);
        }
    } catch (error) {
        console.warn('留言API连接失败:', error);
        apiStatus.message = false;
    }
    
    // 显示API状态
    showAPIStatus();
}

// 显示API状态
function showAPIStatus() {
    if (!apiStatus.feedback || !apiStatus.message) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'apiStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            color: #856404;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        let statusText = '⚠️ 部分服务暂时不可用：';
        if (!apiStatus.feedback) statusText += '<br>• 反馈管理功能';
        if (!apiStatus.message) statusText += '<br>• 留言管理功能';
        statusText += '<br><small>请检查后端服务状态</small>';
        
        statusDiv.innerHTML = statusText;
        document.body.appendChild(statusDiv);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 5000);
    }
} 