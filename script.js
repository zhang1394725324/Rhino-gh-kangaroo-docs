// ===== 全局变量 =====
let lang = 'cn';
let currentGroup = null;
let componentsData = {};
let groupsList = [];

// DOM 元素
const groupNavList = document.getElementById('groupNavList');
const iconsContainer = document.getElementById('iconsContainer');
const currentGroupTitle = document.getElementById('currentGroupTitle');
const detailContent = document.getElementById('detailContent');
const langBtn = document.getElementById('langBtn');
const refreshBtn = document.getElementById('refreshBtn');
const expandDetailBtn = document.getElementById('expandDetailBtn');
const sidebar = document.getElementById('sidebar');
const detailPanel = document.getElementById('detailPanel');
const sidebarResizer = document.getElementById('sidebarResizer');
const detailResizer = document.getElementById('detailResizer');

// 分组配置
const GROUP_ORDER = [
    'Goals-6dof', 'Goals-Angle', 'Goals-Co', 'Goals-Col', 'Goals-Lin',
    'Goals-Mesh', 'Goals-On', 'Goals-Pt', 'Main', 'Mesh', 'Utility'
];

const groupDisplayNames = {
    'Goals-6dof': '六自由度约束',
    'Goals-Angle': '角度约束',
    'Goals-Co': '重合/共线/共面',
    'Goals-Col': '碰撞约束',
    'Goals-Lin': '长度/弹簧约束',
    'Goals-Mesh': '网格曲面约束',
    'Goals-On': '在几何体上',
    'Goals-Pt': '点/锚点约束',
    'Main': '求解器与核心',
    'Mesh': '网格工具',
    'Utility': '实用工具'
};

// 雪碧图配置
const SPRITE_CONFIG = {
    cols: 10,
    rows: 11,
    iconSize: 24,
    totalWidth: 240,
    totalHeight: 264
};

// 详情面板是否展开
let isDetailExpanded = false;

// ===== 可拖动面板功能 =====
let isResizingSidebar = false;
let isResizingDetail = false;
let startX = 0;
let startSidebarWidth = 0;
let startDetailWidth = 0;

function initResizers() {
    sidebarResizer.addEventListener('mousedown', (e) => {
        isResizingSidebar = true;
        startX = e.clientX;
        startSidebarWidth = sidebar.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        sidebarResizer.classList.add('active');
        e.preventDefault();
    });
    
    detailResizer.addEventListener('mousedown', (e) => {
        isResizingDetail = true;
        startX = e.clientX;
        startDetailWidth = detailPanel.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        detailResizer.classList.add('active');
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isResizingSidebar) {
            const deltaX = e.clientX - startX;
            let newWidth = startSidebarWidth + deltaX;
            newWidth = Math.min(Math.max(newWidth, 180), 450);
            sidebar.style.width = newWidth + 'px';
        }
        if (isResizingDetail) {
            const deltaX = startX - e.clientX;
            let newWidth = startDetailWidth + deltaX;
            newWidth = Math.min(Math.max(newWidth, 260), 700);
            detailPanel.style.width = newWidth + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizingSidebar) {
            isResizingSidebar = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            sidebarResizer.classList.remove('active');
        }
        if (isResizingDetail) {
            isResizingDetail = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            detailResizer.classList.remove('active');
        }
    });
}

// ===== 数据加载（支持热更新）=====
function loadData() {
    showLoading('正在加载组件数据...');
    
    fetch('data/kangaroo.json?' + Date.now()) // 添加时间戳防止缓存
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log('✅ 数据加载成功', data);
            componentsData = data;
            
            // 为没有坐标的组件自动分配
            assignSpriteCoordinates();
            
            groupsList = GROUP_ORDER.filter(group => 
                componentsData[group] && componentsData[group].length > 0
            );
            
            renderSidebar();
            if (groupsList.length && currentGroup) {
                setActiveGroup(currentGroup);
            } else if (groupsList.length) {
                setActiveGroup(groupsList[0]);
            }
            
            showToast('数据更新成功', 'success');
        })
        .catch(err => {
            console.error('❌ 数据加载失败:', err);
            showError('无法加载组件数据', err.message);
        });
}

// 自动分配雪碧图坐标
function assignSpriteCoordinates() {
    let globalIndex = 0;
    for (const group of GROUP_ORDER) {
        const items = componentsData[group];
        if (!items) continue;
        for (const item of items) {
            if (item.spriteX === undefined || item.spriteY === undefined) {
                const col = globalIndex % SPRITE_CONFIG.cols;
                const row = Math.floor(globalIndex / SPRITE_CONFIG.cols);
                item.spriteX = col * SPRITE_CONFIG.iconSize;
                item.spriteY = row * SPRITE_CONFIG.iconSize;
            }
            globalIndex++;
        }
    }
}

// ===== 渲染富文本详情 =====
function renderRichDetail(item) {
    const titleText = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
    
    // 获取详情数据（支持新旧两种格式）
    const details = item.details || {};
    
    // 描述
    const description = lang === 'cn' 
        ? (details.description_cn || item.desc_cn || item.desc || '暂无描述')
        : (details.description_en || item.desc_en || item.desc || 'No description');
    
    // 图片/动图画廊
    let galleryHtml = '';
    const images = details.images || (item.img ? [item.img] : []);
    if (images.length > 0) {
        galleryHtml = `
            <div class="detail-section">
                <div class="detail-section-title">🖼️ ${lang === 'cn' ? '示意图/演示' : 'Images / Demos'}</div>
                <div class="image-gallery">
                    ${images.map(img => `
                        <div class="gallery-item" onclick="openModal('img/screenshots/${img}')">
                            ${img.endsWith('.gif') || img.endsWith('.mp4') ? `
                                <video src="img/screenshots/${img}" muted loop playsinline></video>
                                <span class="gif-badge">GIF</span>
                            ` : `
                                <img src="img/screenshots/${img}" alt="${titleText}" loading="lazy">
                            `}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 视频教程
    let videoHtml = '';
    const video = details.video;
    if (video) {
        videoHtml = `
            <div class="detail-section">
                <div class="detail-section-title">🎬 ${lang === 'cn' ? '视频教程' : 'Video Tutorial'}</div>
                <div class="video-container">
                    <video src="img/videos/${video}" controls poster="img/screenshots/${video.replace('.mp4', '.png')}"></video>
                </div>
            </div>
        `;
    }
    
    // 参数表格
    let paramsHtml = '';
    const params = details.parameters || [];
    if (params.length > 0) {
        paramsHtml = `
            <div class="detail-section">
                <div class="detail-section-title">⚙️ ${lang === 'cn' ? '参数说明' : 'Parameters'}</div>
                <table class="params-table">
                    <thead>
                        <tr><th>${lang === 'cn' ? '参数名' : 'Name'}</th><th>${lang === 'cn' ? '说明' : 'Description'}</th><th>${lang === 'cn' ? '默认值' : 'Default'}</th></tr>
                    </thead>
                    <tbody>
                        ${params.map(p => `
                            <tr>
                                <td><code>${p.name}</code></td>
                                <td>${lang === 'cn' ? (p.cn || p.desc_cn) : (p.en || p.desc_en)}</td>
                                <td>${p.default || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // 标签
    let tagsHtml = '';
    const tags = details.tags || [];
    if (tags.length > 0) {
        tagsHtml = `
            <div class="detail-section">
                <div class="detail-section-title">🏷️ ${lang === 'cn' ? '标签' : 'Tags'}</div>
                <div class="tag-cloud">
                    ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // 示例文件
    let examplesHtml = '';
    const examples = details.examples || [];
    if (examples.length > 0) {
        examplesHtml = `
            <div class="detail-section">
                <div class="detail-section-title">📁 ${lang === 'cn' ? '示例文件' : 'Examples'}</div>
                ${examples.map(ex => `<div class="example-code">${ex}</div>`).join('')}
            </div>
        `;
    }
    
    // 元信息
    let metaHtml = `
        <div class="detail-section">
            <div class="detail-section-title">ℹ️ ${lang === 'cn' ? '信息' : 'Info'}</div>
            <div class="meta">
                <div><strong>${lang === 'cn' ? '组件名称' : 'Component'}:</strong> ${item.name}</div>
                <div><strong>${lang === 'cn' ? '雪碧图位置' : 'Sprite Position'}:</strong> (${item.spriteX}, ${item.spriteY})</div>
                ${details.author ? `<div><strong>${lang === 'cn' ? '作者' : 'Author'}:</strong> ${details.author}</div>` : ''}
                ${details.version ? `<div><strong>${lang === 'cn' ? '版本' : 'Version'}:</strong> ${details.version}</div>` : ''}
            </div>
        </div>
    `;
    
    detailContent.innerHTML = `
        <div class="component-detail">
            <h3>${escapeHtml(titleText)}</h3>
            <div class="detail-section">
                <div class="detail-section-title">📝 ${lang === 'cn' ? '说明' : 'Description'}</div>
                <div class="desc">${escapeHtml(description)}</div>
            </div>
            ${galleryHtml}
            ${videoHtml}
            ${paramsHtml}
            ${tagsHtml}
            ${examplesHtml}
            ${metaHtml}
        </div>
    `;
    
    // 自动播放视频缩略图效果
    document.querySelectorAll('.gallery-item video').forEach(video => {
        video.addEventListener('mouseenter', () => video.play());
        video.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });
    });
    
    window.currentDetailItem = item;
}

// 模态框（大图预览）
function openModal(src) {
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <img src="" alt="">
            </div>
            <div class="modal-close">&times;</div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close')) {
                modal.classList.remove('active');
            }
        });
    }
    
    const img = modal.querySelector('img');
    img.src = src;
    modal.classList.add('active');
}

// 显示组件详情（兼容新旧格式）
function showComponentDetail(item) {
    renderRichDetail(item);
}

// ===== 渲染图标网格 =====
function renderIcons(groupKey) {
    const items = componentsData[groupKey];
    if (!items || items.length === 0) {
        iconsContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #999;">暂无组件</div>';
        return;
    }
    
    iconsContainer.innerHTML = '';
    items.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'icon-card';
        
        const spriteDiv = document.createElement('div');
        spriteDiv.className = 'icon-sprite';
        spriteDiv.style.backgroundPosition = `-${item.spriteX}px -${item.spriteY}px`;
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'icon-name';
        nameSpan.textContent = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
        
        card.appendChild(spriteDiv);
        card.appendChild(nameSpan);
        card.addEventListener('click', () => showComponentDetail(item));
        iconsContainer.appendChild(card);
    });
}

// ===== 其他辅助函数 =====
function renderSidebar() { /* 同之前 */ }
function setActiveGroup(groupKey) { /* 同之前 */ }
function showError(title, message) { /* 同之前 */ }
function escapeHtml(str) { /* 同之前 */ }
function showLoading(msg) { /* 加载提示 */ }
function showToast(msg, type) { /* 提示消息 */ }

// 展开/收起详情面板
expandDetailBtn.addEventListener('click', () => {
    isDetailExpanded = !isDetailExpanded;
    if (isDetailExpanded) {
        detailPanel.style.width = '700px';
        expandDetailBtn.textContent = '✕';
    } else {
        detailPanel.style.width = '340px';
        expandDetailBtn.textContent = '⛶';
    }
});

// 刷新数据
refreshBtn.addEventListener('click', () => {
    loadData();
});

// 中英文切换
langBtn.addEventListener('click', () => {
    lang = lang === 'cn' ? 'en' : 'cn';
    langBtn.textContent = lang === 'cn' ? 'EN' : '中';
    renderSidebar();
    if (currentGroup && componentsData[currentGroup]) {
        const titleZh = groupDisplayNames[currentGroup] || currentGroup;
        currentGroupTitle.textContent = lang === 'cn' ? titleZh : currentGroup;
        renderIcons(currentGroup);
    }
    if (window.currentDetailItem) {
        showComponentDetail(window.currentDetailItem);
    }
});

// 初始化
initResizers();
loadData();

// 导出全局函数供HTML调用
window.openModal = openModal;
