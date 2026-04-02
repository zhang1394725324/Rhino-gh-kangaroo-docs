// ===== 全局变量 =====
let lang = 'cn';
let componentsData = {};
let groupsList = [];
let detailCache = new Map();

// DOM 元素
const categoriesGrid = document.getElementById('categoriesGrid');
const detailContent = document.getElementById('detailContent');
const langBtn = document.getElementById('langBtn');
const expandDetailBtn = document.getElementById('expandDetailBtn');

// 分组配置（11个分组）
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
    iconSize: 24
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
                parameters: []
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
    
    let metaHtml = `
        <div class="detail-section">
            <div class="detail-section-title">ℹ️ ${lang === 'cn' ? '信息' : 'Info'}</div>
            <div class="meta">
                <div><strong>${lang === 'cn' ? '组件名称' : 'Component'}:</strong> ${escapeHtml(item.name)}</div>
                <div><strong>${lang === 'cn' ? '雪碧图位置' : 'Sprite Position'}:</strong> (${item.spriteX}, ${item.spriteY})</div>
                ${details.author ? `<div><strong>${lang === 'cn' ? '作者' : 'Author'}:</strong> ${escapeHtml(details.author)}</div>` : ''}
                ${details.version ? `<div><strong>${lang === 'cn' ? '版本' : 'Version'}:</strong> ${escapeHtml(details.version)}</div>` : ''}
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
}

// ===== 数据加载 =====
function loadData() {
    fetch('data/kangaroo.json?' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log('✅ 数据加载成功', data);
            componentsData = data;
            assignSpriteCoordinates();
            
            groupsList = GROUP_ORDER.filter(group => 
                componentsData[group] && componentsData[group].length > 0
            );
            
            console.log('📦 分组列表:', groupsList);
            renderCategories();
        })
        .catch(err => {
            console.error('❌ 数据加载失败:', err);
            categoriesGrid.innerHTML = `<div style="padding:40px;text-align:center;color:#dc2626;">数据加载失败: ${err.message}</div>`;
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
                console.log(`分配坐标: ${item.name} -> (${item.spriteX}, ${item.spriteY})`);
            }
        }
        globalIndex += items.length;
    }
    console.log(`✅ 已为组件分配雪碧图坐标`);
}

// ===== 渲染11个分类卡片 =====
function renderCategories() {
    categoriesGrid.innerHTML = '';
    
    groupsList.forEach(groupKey => {
        const items = componentsData[groupKey];
        if (!items || items.length === 0) return;
        
        const itemCount = items.length;
        
        // 计算列数：根据图标数量决定，最多6列
        let columns = 2;
        if (itemCount <= 4) columns = 2;
        else if (itemCount <= 9) columns = 3;
        else if (itemCount <= 16) columns = 4;
        else if (itemCount <= 25) columns = 5;
        else columns = 6;
        
        // 创建卡片
        const card = document.createElement('div');
        card.className = 'category-card';
        
        // 上半部分：图标网格区域
        const iconsArea = document.createElement('div');
        iconsArea.className = 'card-icons-area';
        
        const iconsGrid = document.createElement('div');
        iconsGrid.className = 'card-icons-grid';
        iconsGrid.setAttribute('data-columns', columns);
        
        // 显示所有图标
        items.forEach(item => {
            const iconItem = document.createElement('div');
            iconItem.className = 'card-icon-item';
            iconItem.title = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
            
            const sprite = document.createElement('div');
            sprite.className = 'card-icon-sprite';
            // 确保使用正确的坐标
            const x = item.spriteX || 0;
            const y = item.spriteY || 0;
            sprite.style.backgroundPosition = `-${x}px -${y}px`;
            
            const nameSpan = document.createElement('div');
            nameSpan.className = 'card-icon-name';
            let displayName = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
            if (displayName.length > 10) {
                displayName = displayName.substring(0, 8) + '...';
            }
            nameSpan.textContent = displayName;
            nameSpan.title = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
            
            iconItem.appendChild(sprite);
            iconItem.appendChild(nameSpan);
            iconItem.addEventListener('click', (e) => {
                e.stopPropagation();
                showComponentDetail(item);
            });
            
            iconsGrid.appendChild(iconItem);
        });
        
        iconsArea.appendChild(iconsGrid);
        
        // 下半部分：黑色标题标签（确保显示）
        const titleArea = document.createElement('div');
        titleArea.className = 'category-title';
        const titleSpan = document.createElement('span');
        const displayName = groupDisplayNames[groupKey] || groupKey.replace('Goals-', '');
        titleSpan.textContent = lang === 'cn' ? displayName : groupKey;
        titleArea.appendChild(titleSpan);
        
        card.appendChild(iconsArea);
        card.appendChild(titleArea);
        
        categoriesGrid.appendChild(card);
    });
    
    console.log(`✅ 已渲染 ${groupsList.length} 个分类卡片`);
}

// ===== 中英文切换 =====
langBtn.addEventListener('click', () => {
    lang = lang === 'cn' ? 'en' : 'cn';
    langBtn.textContent = lang === 'cn' ? 'EN' : '中';
    renderCategories();
    if (window.currentDetailItem) {
        showComponentDetail(window.currentDetailItem);
    }
});

// 展开/收起详情面板
expandDetailBtn.addEventListener('click', () => {
    const panel = document.querySelector('.detail-panel');
    isDetailExpanded = !isDetailExpanded;
    if (isDetailExpanded) {
        panel.style.flex = '2';
        expandDetailBtn.textContent = '✕';
    } else {
        panel.style.flex = '1';
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

window.openModal = openModal;

// 启动
loadData();
