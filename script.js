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
    detailContent.innerHTML = `<div class="loading-detail"><div class="spinner"></div><p>${escapeHtml(message)}</p></div>`;
}

// ===== 按需加载组件详情 =====
async function loadComponentDetail(componentName, detailFile) {
    // 检查缓存
    if (detailCache.has(componentName)) {
        console.log(`从缓存加载: ${componentName}`);
        return detailCache.get(componentName);
    }
    
    // 生成安全的文件名（处理特殊字符）
    function sanitizeFileName(name) {
        return name
            .replace(/[\/\\:*?"<>|&]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/\(/g, '_')
            .replace(/\)/g, '_')
            .replace(/&/g, 'and');
    }
    
    // 尝试多个可能的文件名
    const possibleNames = [
        detailFile,
        `${componentName}.json`,
        `${sanitizeFileName(componentName)}.json`,
        `${componentName.toLowerCase().replace(/\s+/g, '_')}.json`,
    ].filter(Boolean);
    
    for (const name of possibleNames) {
        try {
            const detailUrl = `data/details/${name}`;
            console.log(`尝试加载: ${detailUrl}`);
            
            const response = await fetch(detailUrl);
            if (response.ok) {
                const detail = await response.json();
                detailCache.set(componentName, detail);
                console.log(`✅ 加载成功: ${componentName} -> ${name}`);
                return detail;
            }
        } catch (err) {
            console.log(`❌ 失败: ${name}`);
        }
    }
    
    // 所有尝试都失败，返回默认模板
    console.error(`❌ 找不到详情文件: ${componentName}`);
    const defaultDetail = {
        description_cn: `❌ 找不到详情文件\n\n组件名称：${componentName}\n\n请创建对应的 JSON 文件。`,
        description_en: `❌ Detail file not found\n\nComponent: ${componentName}\n\nPlease create the corresponding JSON file.`,
        images: [],
        tags: ['文件缺失'],
        parameters: [],
        outputs: [],
        examples: [],
        author: '-',
        version: '-',
        lastUpdated: new Date().toISOString().split('T')[0]
    };
    detailCache.set(componentName, defaultDetail);
    return defaultDetail;
}

// ===== 渲染富文本详情 =====
function renderRichDetail(item, details) {
    const titleText = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
    const description = lang === 'cn' 
        ? (details.description_cn || item.desc_cn || '暂无描述')
        : (details.description_en || item.desc_en || 'No description');
    
    // 图片画廊
    let galleryHtml = '';
    const images = details.images || [];
    if (images.length > 0) {
        galleryHtml = `
            <div class="detail-section">
                <div class="detail-section-title">🖼️ ${lang === 'cn' ? '示意图' : 'Images'}</div>
                <div class="image-gallery">
                    ${images.map(img => `
                        <div class="gallery-item" onclick="window.openModal && openModal('img/screenshots/${img}')">
                            ${img.endsWith('.gif') || img.endsWith('.mp4') ? 
                                `<video src="img/screenshots/${img}" muted loop playsinline></video><span class="gif-badge">GIF</span>` : 
                                `<img src="img/screenshots/${img}" alt="${titleText}" loading="lazy">`
                            }
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
                    <video src="img/videos/${video}" controls style="width:100%; border-radius:8px;"></video>
                </div>
            </div>
        `;
    }
    
    // 输入参数（显示 cn, desc_cn, en, desc_en）
    let inputParamsHtml = '';
    const inputParams = details.parameters || details.input_parameters || [];
    if (inputParams.length > 0) {
        inputParamsHtml = `
            <div class="detail-section">
                <div class="detail-section-title">⚙️ ${lang === 'cn' ? '输入参数' : 'Input Parameters'}</div>
                <div style="overflow-x: auto;">
                    <table class="params-table" style="min-width: 600px;">
                        <thead>
                            <tr>
                                <th>${lang === 'cn' ? '参数名' : 'Name'}</th>
                                <th>${lang === 'cn' ? '中文名称' : 'Chinese Name'}</th>
                                <th>${lang === 'cn' ? '中文说明' : 'Chinese Description'}</th>
                                <th>${lang === 'cn' ? '英文名称' : 'English Name'}</th>
                                <th>${lang === 'cn' ? '英文说明' : 'English Description'}</th>
                                <th>${lang === 'cn' ? '默认值' : 'Default'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inputParams.map(p => `
                                <tr>
                                    <td><code>${escapeHtml(p.name)}</code></td>
                                    <td>${escapeHtml(p.cn || '-')}</td>
                                    <td>${escapeHtml(p.desc_cn || '-')}</td>
                                    <td>${escapeHtml(p.en || '-')}</td>
                                    <td>${escapeHtml(p.desc_en || '-')}</td>
                                    <td>${escapeHtml(String(p.default !== undefined ? p.default : '-'))}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // 输出参数（显示 cn, desc_cn, en, desc_en）
    let outputParamsHtml = '';
    const outputParams = details.outputs || details.output_parameters || [];
    if (outputParams.length > 0) {
        outputParamsHtml = `
            <div class="detail-section">
                <div class="detail-section-title">📤 ${lang === 'cn' ? '输出参数' : 'Output Parameters'}</div>
                <div style="overflow-x: auto;">
                    <table class="params-table" style="min-width: 600px;">
                        <thead>
                            <tr>
                                <th>${lang === 'cn' ? '参数名' : 'Name'}</th>
                                <th>${lang === 'cn' ? '中文名称' : 'Chinese Name'}</th>
                                <th>${lang === 'cn' ? '中文说明' : 'Chinese Description'}</th>
                                <th>${lang === 'cn' ? '英文名称' : 'English Name'}</th>
                                <th>${lang === 'cn' ? '英文说明' : 'English Description'}</th>
                                <th>${lang === 'cn' ? '类型' : 'Type'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${outputParams.map(o => `
                                <tr>
                                    <td><code>${escapeHtml(o.name)}</code></td>
                                    <td>${escapeHtml(o.cn || '-')}</td>
                                    <td>${escapeHtml(o.desc_cn || '-')}</td>
                                    <td>${escapeHtml(o.en || '-')}</td>
                                    <td>${escapeHtml(o.desc_en || '-')}</td>
                                    <td>${escapeHtml(o.type || o.default || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
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
    
    // 示例文件
    let examplesHtml = '';
    const examples = details.examples || [];
    if (examples.length > 0) {
        examplesHtml = `
            <div class="detail-section">
                <div class="detail-section-title">📁 ${lang === 'cn' ? '示例文件' : 'Examples'}</div>
                <div class="tag-cloud">
                    ${examples.map(ex => `<span class="tag" style="background:#e2e8f0; cursor:pointer;">📄 ${escapeHtml(ex)}</span>`).join('')}
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
            ${inputParamsHtml}
            ${outputParamsHtml}
            ${tagsHtml}
            ${examplesHtml}
            ${metaHtml}
        </div>
    `;
    
    // 视频悬停播放（仅对 gallery 中的视频）
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

// ===== 渲染分类卡片 =====
function renderCategories() {
    categoriesGrid.innerHTML = '';
    
    groupsList.forEach(groupKey => {
        const items = componentsData[groupKey];
        if (!items || items.length === 0) return;
        
        const itemCount = items.length;
        
        // 计算列数
        let columns = 2;
        if (itemCount <= 8) columns = 2;
        else if (itemCount <= 12) columns = 3;
        else if (itemCount <= 16) columns = 4;
        else if (itemCount <= 20) columns = 5;
        else columns = 6;
        
        // 创建卡片
        const card = document.createElement('div');
        card.className = 'category-card';
        
        const iconsArea = document.createElement('div');
        iconsArea.className = 'card-icons-area';
        
        const iconsGrid = document.createElement('div');
        iconsGrid.className = 'card-icons-grid';
        iconsGrid.setAttribute('data-columns', columns);
        
        // 填充图标（4行 × columns列）
        const totalSlots = 4 * columns;
        for (let i = 0; i < totalSlots; i++) {
            if (i < items.length) {
                const item = items[i];
                const iconItem = document.createElement('div');
                iconItem.className = 'card-icon-item';
                iconItem.title = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
                
                const sprite = document.createElement('div');
                sprite.className = 'card-icon-sprite';
                sprite.style.backgroundPosition = `-${item.spriteX}px -${item.spriteY}px`;
                
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
            } else {
                const emptyItem = document.createElement('div');
                emptyItem.style.visibility = 'hidden';
                iconsGrid.appendChild(emptyItem);
            }
        }
        
        iconsArea.appendChild(iconsGrid);
        
        const titleArea = document.createElement('div');
        titleArea.className = 'category-title';
        const titleSpan = document.createElement('span');
        titleSpan.textContent = lang === 'cn' ? groupDisplayNames[groupKey] : groupKey;
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
