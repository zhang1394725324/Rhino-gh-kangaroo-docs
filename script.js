// ===== 全局变量 =====
let lang = 'cn';
let currentGroup = null;
let componentsData = {};
let groupsList = [];
let detailCache = new Map(); // 详情缓存

// DOM 元素
const groupNavList = document.getElementById('groupNavList');
const iconsContainer = document.getElementById('iconsContainer');
const currentGroupTitle = document.getElementById('currentGroupTitle');
const detailContent = document.getElementById('detailContent');
const langBtn = document.getElementById('langBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');
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

// ===== 辅助函数 =====
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    // 创建临时提示
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 0.85rem;
        z-index: 1000;
        animation: fadeInOut 2s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function showLoading(message) {
    detailContent.innerHTML = `
        <div class="loading-detail">
            <div class="spinner"></div>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

// ===== 按需加载组件详情 =====
async function loadComponentDetail(componentName, detailFile) {
    // 检查缓存
    if (detailCache.has(componentName)) {
        console.log(`从缓存加载: ${componentName}`);
        return detailCache.get(componentName);
    }
    
    try {
        // 尝试加载详情文件
        let detailUrl = `data/details/${detailFile || componentName + '.json'}`;
        const response = await fetch(detailUrl);
        
        if (!response.ok) {
            // 如果没有详情文件，返回默认结构
            console.log(`未找到详情文件: ${componentName}，使用默认模板`);
            return {
                description_cn: `暂无详细说明，敬请期待。`,
                description_en: `No description available yet.`,
                images: [],
                tags: [],
                parameters: [],
                lastUpdated: new Date().toISOString().split('T')[0]
            };
        }
        
        const detail = await response.json();
        detailCache.set(componentName, detail);
        console.log(`加载详情成功: ${componentName}`);
        return detail;
    } catch (err) {
        console.warn(`加载详情失败 ${componentName}:`, err);
        return {
            description_cn: `加载详情失败，请检查网络或文件是否存在。`,
            description_en: `Failed to load details.`,
            images: [],
            tags: [],
            parameters: []
        };
    }
}

// ===== 渲染富文本详情 =====
function renderRichDetail(item, details) {
    const titleText = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
    
    // 描述
    const description = lang === 'cn' 
        ? (details.description_cn || item.desc_cn || '暂无描述')
        : (details.description_en || item.desc_en || 'No description');
    
    // 图片/动图画廊
    let galleryHtml = '';
    const images = details.images || [];
    if (images.length > 0) {
        galleryHtml = `
            <div class="detail-section">
                <div class="detail-section-title">🖼️ ${lang === 'cn' ? '示意图/演示' : 'Images / Demos'}</div>
                <div class="image-gallery">
                    ${images.map(img => `
                        <div class="gallery-item" onclick="window.openModal && openModal('img/screenshots/${img}')">
                            ${img.endsWith('.gif') || img.endsWith('.mp4') ? `
                                <video src="img/screenshots/${img}" muted loop playsinline></video>
                                <span class="gif-badge">GIF</span>
                            ` : `
                                <img src="img/screenshots/${img}" alt="${titleText}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50\' y=\'50\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E无图%3C/text%3E%3C/svg%3E'">
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
                    <video src="img/videos/${video}" controls poster="img/screenshots/${video.replace('.mp4', '.png')}" style="width:100%; border-radius:8px;"></video>
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
                                <td><code>${escapeHtml(p.name)}</code></td>
                                <td>${lang === 'cn' ? escapeHtml(p.cn || p.desc_cn || '') : escapeHtml(p.en || p.desc_en || '')}</td>
                                <td>${escapeHtml(p.default || '-')}</td>
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
                    ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // 元信息
    let metaHtml = `
        <div class="detail-section">
            <div class="detail-section-title">ℹ️ ${lang === 'cn' ? '信息' : 'Info'}</div>
            <div class="meta">
                <div><strong>${lang === 'cn' ? '组件名称' : 'Component'}:</strong> ${escapeHtml(item.name)}</div>
                <div><strong>${lang === 'cn' ? '雪碧图位置' : 'Sprite Position'}:</strong> (${item.spriteX}, ${item.spriteY})</div>
                ${details.author ? `<div><strong>${lang === 'cn' ? '作者' : 'Author'}:</strong> ${escapeHtml(details.author)}</div>` : ''}
                ${details.version ? `<div><strong>${lang === 'cn' ? '版本' : 'Version'}:</strong> ${escapeHtml(details.version)}</div>` : ''}
                ${details.lastUpdated ? `<div><strong>${lang === 'cn' ? '最后更新' : 'Last Updated'}:</strong> ${escapeHtml(details.lastUpdated)}</div>` : ''}
            </div>
        </div>
    `;
    
    detailContent.innerHTML = `
        <div class="component-detail">
            <h3>${escapeHtml(titleText)}</h3>
            <div class="detail-section">
                <div class="detail-section-title">📝 ${lang === 'cn' ? '说明' : 'Description'}</div>
                <div class="desc">${escapeHtml(description).replace(/\n/g, '<br>')}</div>
            </div>
            ${galleryHtml}
            ${videoHtml}
            ${paramsHtml}
            ${tagsHtml}
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
}

// ===== 显示组件详情（按需加载）=====
async function showComponentDetail(item) {
    // 显示加载状态
    showLoading('加载详情中...');
    
    // 按需加载详情
    const details = await loadComponentDetail(item.name, item.detailFile);
    
    // 渲染详情
    renderRichDetail(item, details);
    
    // 存储当前项用于语言切换
    window.currentDetailItem = item;
    window.currentDetailData = details;
}

// ===== 刷新当前详情（语言切换时）=====
async function refreshCurrentDetail() {
    if (window.currentDetailItem) {
        const details = await loadComponentDetail(
            window.currentDetailItem.name, 
            window.currentDetailItem.detailFile
        );
        renderRichDetail(window.currentDetailItem, details);
    }
}

// ===== 清除详情缓存 =====
function clearDetailCache(componentName) {
    if (componentName) {
        detailCache.delete(componentName);
        console.log(`已清除缓存: ${componentName}`);
        showToast(`已清除 ${componentName} 的缓存`, 'success');
    } else {
        detailCache.clear();
        console.log('已清除所有详情缓存');
        showToast('已清除所有详情缓存', 'success');
    }
}

// ===== 数据加载 =====
function loadData() {
    showLoading('加载组件数据中...');
    
    fetch('data/kangaroo.json?' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log('✅ 主数据加载成功', data);
            componentsData = data;
            
            // 自动分配雪碧图坐标
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
            
            showToast('数据加载成功', 'success');
        })
        .catch(err => {
            console.error('❌ 数据加载失败:', err);
            iconsContainer.innerHTML = `
                <div style="padding: 60px 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h3 style="color: #dc2626;">数据加载失败</h3>
                    <p style="color: #6b7280;">${err.message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 8px 20px; cursor: pointer;">重试</button>
                </div>
            `;
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
    console.log(`✅ 已为 ${globalIndex} 个组件分配雪碧图坐标`);
}

// ===== 渲染左侧导航 =====
function renderSidebar() {
    groupNavList.innerHTML = '';
    groupsList.forEach(groupKey => {
        const li = document.createElement('li');
        const displayName = groupDisplayNames[groupKey] || groupKey.replace('Goals-', '');
        li.textContent = lang === 'cn' ? displayName : groupKey;
        li.dataset.group = groupKey;
        li.addEventListener('click', () => setActiveGroup(groupKey));
        groupNavList.appendChild(li);
    });
}

// ===== 激活分组 =====
function setActiveGroup(groupKey) {
    if (!componentsData[groupKey]) {
        console.warn('分组不存在:', groupKey);
        return;
    }
    
    currentGroup = groupKey;
    
    // 更新左侧高亮
    document.querySelectorAll('.group-nav li').forEach(li => {
        if (li.dataset.group === groupKey) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
    
    // 更新标题
    const titleZh = groupDisplayNames[groupKey] || groupKey;
    currentGroupTitle.textContent = lang === 'cn' ? titleZh : groupKey;
    
    // 渲染图标
    renderIcons(groupKey);
    
    // 清空右侧
    detailContent.innerHTML = `
        <div class="placeholder">
            <span>🔍 点击任意组件</span>
            <span>查看详细说明与示意图</span>
        </div>
    `;
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

// ===== 事件绑定 =====
langBtn.addEventListener('click', () => {
    lang = lang === 'cn' ? 'en' : 'cn';
    langBtn.textContent = lang === 'cn' ? 'EN' : '中';
    
    renderSidebar();
    if (currentGroup && componentsData[currentGroup]) {
        const titleZh = groupDisplayNames[currentGroup] || currentGroup;
        currentGroupTitle.textContent = lang === 'cn' ? titleZh : currentGroup;
        renderIcons(currentGroup);
    }
    refreshCurrentDetail();
});

refreshBtn.addEventListener('click', () => {
    loadData();
});

clearCacheBtn.addEventListener('click', () => {
    clearDetailCache();
});

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

// 导出全局函数
window.openModal = openModal;

// 快捷键 Ctrl+Shift+C 清除缓存
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        clearDetailCache();
    }
});

// ===== 初始化 =====
initResizers();
loadData();
