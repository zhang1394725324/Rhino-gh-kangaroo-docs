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
    cols: 10,           // 每行10个图标
    rows: 11,           // 共11行
    iconSize: 24,       // 每个图标24x24px
    totalWidth: 240,    // 雪碧图总宽度
    totalHeight: 264    // 雪碧图总高度
};

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
            newWidth = Math.min(Math.max(newWidth, 260), 600);
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

// ===== 根据索引计算雪碧图坐标 =====
function getSpritePosition(index) {
    const col = index % SPRITE_CONFIG.cols;
    const row = Math.floor(index / SPRITE_CONFIG.cols);
    return {
        x: col * SPRITE_CONFIG.iconSize,
        y: row * SPRITE_CONFIG.iconSize
    };
}

// ===== 为所有组件分配坐标 =====
function assignSpriteCoordinates(data) {
    let globalIndex = 0;
    const orderedGroups = GROUP_ORDER.filter(g => data[g]);
    
    for (const group of orderedGroups) {
        const items = data[group];
        for (const item of items) {
            // 如果 JSON 中没有提供坐标，则自动分配
            if (item.spriteX === undefined || item.spriteY === undefined) {
                const pos = getSpritePosition(globalIndex);
                item.spriteX = pos.x;
                item.spriteY = pos.y;
                console.log(`分配坐标: ${item.name} -> (${pos.x}, ${pos.y})`);
            }
            globalIndex++;
        }
    }
    
    console.log(`✅ 已为 ${globalIndex} 个组件分配坐标`);
    return data;
}

// ===== 数据加载 =====
fetch('data/kangaroo.json')
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('✅ 数据加载成功，共', Object.keys(data).length, '个分组');
        
        // 为所有组件分配雪碧图坐标
        componentsData = assignSpriteCoordinates(data);
        
        // 构建分组列表
        groupsList = GROUP_ORDER.filter(group => 
            componentsData[group] && componentsData[group].length > 0
        );
        
        console.log('📂 可用分组:', groupsList);
        groupsList.forEach(g => {
            console.log(`  - ${g}: ${componentsData[g].length} 个组件`);
        });
        
        // 渲染界面
        renderSidebar();
        if (groupsList.length) {
            setActiveGroup(groupsList[0]);
        }
        
        // 初始化拖动功能
        initResizers();
    })
    .catch(err => {
        console.error('❌ 数据加载失败:', err);
        showError('无法加载组件数据', err.message);
    });

// ===== 错误提示 =====
function showError(title, message) {
    iconsContainer.innerHTML = `
        <div style="padding: 60px 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #dc2626; margin-bottom: 12px;">${title}</h3>
            <p style="color: #6b7280;">${message}</p>
            <p style="color: #9ca3af; margin-top: 20px; font-size: 0.85rem;">
                请确保 data/kangaroo.json 文件存在且格式正确
            </p>
        </div>
    `;
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

// ===== 渲染图标网格（使用雪碧图）=====
function renderIcons(groupKey) {
    const items = componentsData[groupKey];
    
    if (!items || items.length === 0) {
        iconsContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #999;">暂无组件</div>';
        return;
    }
    
    console.log(`🎨 渲染分组 ${groupKey}，组件数量: ${items.length}`);
    
    iconsContainer.innerHTML = '';
    
    items.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'icon-card';
        
        // 创建雪碧图图标
        const spriteDiv = document.createElement('div');
        spriteDiv.className = 'icon-sprite';
        spriteDiv.style.backgroundPosition = `-${item.spriteX}px -${item.spriteY}px`;
        
        // 显示名称
        const nameSpan = document.createElement('div');
        nameSpan.className = 'icon-name';
        const displayName = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
        nameSpan.textContent = displayName;
        
        card.appendChild(spriteDiv);
        card.appendChild(nameSpan);
        card.addEventListener('click', () => showComponentDetail(item));
        
        iconsContainer.appendChild(card);
    });
    
    console.log(`✅ 已渲染 ${iconsContainer.children.length} 个图标`);
}

// ===== 显示组件详情 =====
function showComponentDetail(item) {
    const titleText = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
    const descText = lang === 'cn' ? (item.desc_cn || item.desc || '暂无描述') : (item.desc_en || item.desc || 'No description');
    const imgSrc = item.img ? `img/screenshots/${item.img}` : '';
    
    let imgHtml = '';
    if (imgSrc) {
        imgHtml = `
            <div class="screenshot">
                <img src="${imgSrc}" alt="${titleText}" 
                     onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\'color:#999\'>📷 截图文件不存在</span>'">
            </div>
        `;
    } else {
        imgHtml = `<div class="screenshot"><span style="color:#999">📷 暂无示意图</span></div>`;
    }
    
    detailContent.innerHTML = `
        <div class="component-detail">
            <h3>${escapeHtml(titleText)}</h3>
            ${imgHtml}
            <div class="desc">
                <strong>📌 说明：</strong><br>
                ${escapeHtml(descText)}
            </div>
            <div class="meta">
                <strong>🔧 组件名称：</strong> ${item.name}<br>
                <strong>📍 雪碧图位置：</strong> (${item.spriteX}, ${item.spriteY})
            </div>
        </div>
    `;
    
    window.currentDetailItem = item;
}

// ===== 防XSS =====
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== 中英文切换 =====
langBtn.addEventListener('click', () => {
    lang = lang === 'cn' ? 'en' : 'cn';
    langBtn.textContent = lang === 'cn' ? 'EN' : '中';
    
    // 刷新左侧分组
    renderSidebar();
    
    // 刷新当前分组标题和图标文字
    if (currentGroup && componentsData[currentGroup]) {
        const titleZh = groupDisplayNames[currentGroup] || currentGroup;
        currentGroupTitle.textContent = lang === 'cn' ? titleZh : currentGroup;
        
        const items = componentsData[currentGroup];
        const nameSpans = iconsContainer.querySelectorAll('.icon-name');
        items.forEach((item, idx) => {
            if (nameSpans[idx]) {
                nameSpans[idx].textContent = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
            }
        });
    }
    
    // 刷新当前详情
    if (window.currentDetailItem) {
        showComponentDetail(window.currentDetailItem);
    }
});

// ===== 页面加载完成 =====
window.addEventListener('load', () => {
    console.log('📄 页面加载完成');
    console.log('雪碧图配置:', SPRITE_CONFIG);
    console.log('总图标容量:', SPRITE_CONFIG.cols * SPRITE_CONFIG.rows);
});
