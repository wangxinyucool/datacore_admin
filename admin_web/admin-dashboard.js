// 管理后台核心功能：菜单切换、内容区切换、刷新、退出登录

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    // 默认显示反馈管理
    switchModule('feedback');
});

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const module = this.dataset.module;
            switchModule(module);
        });
    });
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshCurrentModule);
    }
    // 退出登录
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('admin_logged_in');
            localStorage.removeItem('login_time');
            window.location.href = 'login.html';
        });
    }
}

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
}

function updatePageTitle(module) {
    const titles = {
        feedback: '反馈管理',
        message: '留言管理',
        stats: '系统统计',
        settings: '系统设置'
    };
    document.getElementById('pageTitle').textContent = titles[module] || '';
    const subtitles = {
        feedback: '管理用户反馈和建议',
        message: '管理用户留言',
        stats: '实时数据统计和系统状态',
        settings: '管理系统配置和参数'
    };
    document.getElementById('pageSubtitle').textContent = subtitles[module] || '';
}

function refreshCurrentModule() {
    // 如有需要可在此刷新当前模块数据
} 