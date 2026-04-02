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
    if (detailCache.has(componentName)) return detailCache.get(componentName);
    try {
        let detailUrl = `data/details/${detailFile || componentName + '.json'}`;
        const response = await fetch(detailUrl);
        if (!response.ok) return { description_cn: `暂无详细说明。`, description_en: `No description.`, images: [], tags: [], parameters: [] };
        const detail = await response.json();
        detailCache.set(componentName, detail);
        return detail;
    } catch (err) {
        return { description_cn: `加载详情失败。`, description_en: `Failed to load details.`, images: [], tags: [], parameters: [] };
    }
}

// ===== 渲染富文本详情（简化版）=====
function renderRichDetail(item, details) {
    const titleText = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
    const description = lang === 'cn' ? (details.description_cn || '暂无描述') : (details.description_en || 'No description');
    detailContent.innerHTML = `
        <div class="component-detail">
            <h3>${escapeHtml(titleText)}</h3>
            <div class="detail-section">
                <div class="detail-section-title">📝 ${lang === 'cn' ? '说明' : 'Description'}</div>
                <div class="desc">${escapeHtml(description)}</div>
            </div>
        </div>
    `;
}

async function showComponentDetail(item) {
    showLoading('加载详情中...');
    const details = await loadComponentDetail(item.name, item.detailFile);
    renderRichDetail(item, details);
    window.currentDetailItem = item;
}

// ===== 数据加载 =====
function loadData() {
    fetch('data/kangaroo.json?' + Date.now())
        .then(res => res.json())
        .then(data => {
            componentsData = data;
            groupsList = GROUP_ORDER.filter(group => componentsData[group] && componentsData[group].length > 0);
            renderCategories();
        })
        .catch(err => {
            categoriesGrid.innerHTML = `<div style="padding:40px;text-align:center;color:#dc2626;">数据加载失败: ${err.message}</div>`;
        });
}

// ===== 渲染分类卡片（Flexbox 自动换行，无空白格子）=====
function renderCategories() {
    categoriesGrid.innerHTML = '';
    groupsList.forEach(groupKey => {
        const items = componentsData[groupKey];
        if (!items || items.length === 0) return;
        
        const card = document.createElement('div');
        card.className = 'category-card';
        
        const iconsArea = document.createElement('div');
        iconsArea.className = 'card-icons-area';
        const iconsGrid = document.createElement('div');
        iconsGrid.className = 'card-icons-grid';
        
        // 直接添加图标，Flexbox 自动换行，不会有空白格子
        items.forEach(item => {
            const iconItem = document.createElement('div');
            iconItem.className = 'card-icon-item';
            iconItem.title = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
            
            const sprite = document.createElement('div');
            sprite.className = 'card-icon-sprite';
            sprite.style.backgroundPosition = `-${item.spriteX}px -${item.spriteY}px`;
            
            const nameSpan = document.createElement('div');
            nameSpan.className = 'card-icon-name';
            let displayName = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
            if (displayName.length > 10) displayName = displayName.substring(0, 8) + '...';
            nameSpan.textContent = displayName;
            
            iconItem.appendChild(sprite);
            iconItem.appendChild(nameSpan);
            iconItem.addEventListener('click', (e) => { e.stopPropagation(); showComponentDetail(item); });
            iconsGrid.appendChild(iconItem);
        });
        
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
}

// ===== 事件绑定 =====
langBtn.addEventListener('click', () => {
    lang = lang === 'cn' ? 'en' : 'cn';
    langBtn.textContent = lang === 'cn' ? 'EN' : '中';
    renderCategories();
    if (window.currentDetailItem) showComponentDetail(window.currentDetailItem);
});

expandDetailBtn.addEventListener('click', () => {
    const panel = document.querySelector('.detail-panel');
    const isExpanded = panel.style.flex === '2';
    panel.style.flex = isExpanded ? '1' : '2';
    expandDetailBtn.textContent = isExpanded ? '⛶' : '✕';
});

// 启动
loadData();
