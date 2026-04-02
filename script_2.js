// ===== 全局变量 =====
let lang = 'cn';
let currentGroup = null;
let componentsData = {};
let groupsList = [];
let detailCache = new Map();

// DOM 元素
const groupNavList = document.getElementById('groupNavList');
const iconsContainer = document.getElementById('iconsContainer');
const currentGroupTitle = document.getElementById('currentGroupTitle');
const detailContent = document.getElementById('detailContent');
const langBtn = document.getElementById('langBtn');
const expandDetailBtn = document.getElementById('expandDetailBtn');

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

// ===== 辅助函数 =====
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
    if (detailCache.has(componentName)) {
        return detailCache.get(componentName);
    }
    
    try {
        let detailUrl = `data/details/${detailFile || componentName + '.json'}`;
        const response = await fetch(detailUrl);
        
        if (!response.ok) {
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
        return detail;
    } catch (err) {
        console.warn(`加载详情失败 ${componentName}:`, err);
        return {
            description_cn: `加载详情失败。`,
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
    
    const description = lang === 'cn' 
        ? (details.description_cn || item.desc_cn || '暂无描述')
        : (details.description_en || item.desc_en || 'No description');
    
    let galleryHtml = '';
    const images = details.images || [];
    if (images.length > 0) {
        galleryHtml = `
            <div class="detail-section">
                <div class="detail-section-title">🖼️ ${lang === 'cn' ? '示意图' : 'Images'}</div>
                <div class="image-gallery">
                    ${images.map(img => `
                        <div class="gallery-item" onclick="window.openModal && openModal('img/screenshots/${img}')">
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
    
    let paramsHtml = '';
    const params = details.parameters || [];
    if (params.length > 0) {
        paramsHtml = `
            <div class="detail-section">
                <div class="detail-section-title">⚙️ ${lang === 'cn' ? '参数' : 'Parameters'}</div>
                <table class="params-table">
                    <thead><tr><th>${lang === 'cn' ? '参数名' : 'Name'}</th><th>${lang === 'cn' ? '说明' : 'Description'}</th><th>${lang === 'cn' ? '默认值' : 'Default'}</th></tr></thead>
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
    
    let tagsHtml = '';
    const tags = details.tags || [];
    if (tags.length > 0) {
        tagsHtml = `
            <div class="detail-section">
                <div class="detail-section-title">🏷️ ${lang === 'cn' ? '标签' : 'Tags'}</div>
                <div class="tag-cloud">${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
            </div>
        `;
    }
    
    let metaHtml = `
        <div class="detail-section">
            <div class="detail-section-title">ℹ️ ${lang === 'cn' ? '信息' : 'Info'}</div>
            <div class="meta">
                <div><strong>${lang === 'cn' ? '组件名称' : 'Component'}:</strong> ${escapeHtml(item.name)}</div>
                ${details.author ? `<div><strong>${lang === 'cn' ? '作者' : 'Author'}:</strong> ${escapeHtml(details.author)}</div>` : ''}
                ${details.version ? `<div><strong>${lang === 'cn' ? '版本' : 'Version'}:</strong> ${escapeHtml(details.version)}</div>` : ''}
                ${details.lastUpdated ? `<div><strong>${lang === 'cn' ? '更新' : 'Updated'}:</strong> ${escapeHtml(details.lastUpdated)}</div>` : ''}
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
            ${paramsHtml}
            ${tagsHtml}
            ${metaHtml}
        </div>
    `;
    
    document.querySelectorAll('.gallery-item video').forEach(video => {
        video.addEventListener('mouseenter', () => video.play());
        video.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });
    });
}

// ===== 显示组件详情 =====
async function showComponentDetail(item) {
    showLoading('加载详情中...');
    const details = await loadComponentDetail(item.name, item.detailFile);
    renderRichDetail(item, details);
    window.currentDetailItem = item;
    window.currentDetailData = details;
}

async function refreshCurrentDetail() {
    if (window.currentDetailItem) {
        const details = await loadComponentDetail(
            window.currentDetailItem.name, 
            window.currentDetailItem.detailFile
        );
        renderRichDetail(window.currentDetailItem, details);
    }
}

// ===== 数据加载（自动刷新，无需按钮）=====
function loadData() {
    showLoading('加载组件数据中...');
    
    fetch('data/kangaroo.json?' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            componentsData = data;
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
        })
        .catch(err => {
            console.error('数据加载失败:', err);
            iconsContainer.innerHTML = `<div style="padding:40px;text-align:center;color:#dc2626;">数据加载失败: ${err.message}</div>`;
        });
}

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

// ===== 渲染横向导航 =====
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
    if (!componentsData[groupKey]) return;
    
    currentGroup = groupKey;
    
    document.querySelectorAll('.group-nav-horizontal li').forEach(li => {
        if (li.dataset.group === groupKey) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
    
    const titleZh = groupDisplayNames[groupKey] || groupKey;
    const itemCount = componentsData[groupKey].length;
    currentGroupTitle.innerHTML = `${lang === 'cn' ? titleZh : groupKey} <span>${itemCount}个组件</span>`;
    
    renderIcons(groupKey);
    
    detailContent.innerHTML = `
        <div class="placeholder">
            <span>✨ 点击任意组件</span>
            <span>查看详细说明与示意图</span>
        </div>
    `;
}

// ===== 渲染图标网格 =====
function renderIcons(groupKey) {
    const items = componentsData[groupKey];
    if (!items || items.length === 0) {
        iconsContainer.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">暂无组件</div>';
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

// ===== 中英文切换 =====
langBtn.addEventListener('click', () => {
    lang = lang === 'cn' ? 'en' : 'cn';
    langBtn.textContent = lang === 'cn' ? 'EN' : '中';
    
    renderSidebar();
    if (currentGroup && componentsData[currentGroup]) {
        const titleZh = groupDisplayNames[currentGroup] || currentGroup;
        const itemCount = componentsData[currentGroup].length;
        currentGroupTitle.innerHTML = `${lang === 'cn' ? titleZh : currentGroup} <span>${itemCount}个组件</span>`;
        renderIcons(currentGroup);
    }
    refreshCurrentDetail();
});

// 展开/收起详情面板
expandDetailBtn.addEventListener('click', () => {
    const panel = document.querySelector('.detail-panel');
    isDetailExpanded = !isDetailExpanded;
    if (isDetailExpanded) {
        panel.style.maxHeight = '60%';
        expandDetailBtn.textContent = '✕';
    } else {
        panel.style.maxHeight = '40%';
        expandDetailBtn.textContent = '⛶';
    }
});

// 模态框
function openModal(src) {
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"><img src="" alt=""></div><div class="modal-close">&times;</div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close')) {
                modal.classList.remove('active');
            }
        });
    }
    modal.querySelector('img').src = src;
    modal.classList.add('active');
}

window.openModal = openModal;

// 启动
loadData();
