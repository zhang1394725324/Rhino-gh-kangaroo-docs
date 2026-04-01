// 全局变量
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

// 分组显示顺序
const GROUP_ORDER = [
    'Goals-6dof', 'Goals-Angle', 'Goals-Co', 'Goals-Col', 'Goals-Lin',
    'Goals-Mesh', 'Goals-On', 'Goals-Pt', 'Main', 'Mesh', 'Utility'
];

// 分组友好名称
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

// 加载 JSON 数据
fetch('data/kangaroo.json')
    .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    })
    .then(data => {
        console.log('✅ 数据加载成功:', data);
        componentsData = data;
        
        // 验证数据完整性
        let missingFields = [];
        for (let group in componentsData) {
            componentsData[group].forEach((item, idx) => {
                if (item.spriteX === undefined) missingFields.push(`${group}/${item.name}: spriteX`);
                if (item.spriteY === undefined) missingFields.push(`${group}/${item.name}: spriteY`);
                if (!item.img) missingFields.push(`${group}/${item.name}: img`);
            });
        }
        if (missingFields.length > 0) {
            console.warn('⚠️ 缺失字段:', missingFields.slice(0, 10));
        }
        
        // 提取存在的分组
        groupsList = GROUP_ORDER.filter(group => componentsData[group] && componentsData[group].length > 0);
        if (groupsList.length === 0) {
            groupsList = Object.keys(componentsData);
        }
        
        renderSidebar();
        if (groupsList.length) {
            setActiveGroup(groupsList[0]);
        }
    })
    .catch(err => {
        console.error('❌ 数据加载失败:', err);
        iconsContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #dc2626;">
                <strong>⚠️ 无法加载组件数据</strong><br>
                请确保 data/kangaroo.json 文件存在且格式正确<br>
                <small style="color: #666;">错误详情: ${err.message}</small>
            </div>
        `;
    });

// 渲染左侧分组
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

// 激活分组
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
            <span>查看详细参数与示意图</span>
        </div>
    `;
}

// 渲染图标网格（关键修复）
function renderIcons(groupKey) {
    const items = componentsData[groupKey];
    
    if (!items || items.length === 0) {
        iconsContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #999;">暂无组件</div>';
        return;
    }
    
    console.log(`渲染分组 ${groupKey}，共 ${items.length} 个组件`, items);
    
    iconsContainer.innerHTML = '';
    
    items.forEach((item, index) => {
        // 获取雪碧图坐标（如果没有则使用索引位置估算）
        let spriteX = item.spriteX;
        let spriteY = item.spriteY;
        
        // 如果缺少坐标，尝试根据索引自动计算（每行10个图标，每个24px）
        if (spriteX === undefined || spriteY === undefined) {
            const cols = 10; // 每行10个图标
            const iconSize = 24;
            const row = Math.floor(index / cols);
            const col = index % cols;
            spriteX = col * iconSize;
            spriteY = row * iconSize;
            console.warn(`${item.name} 缺少坐标，使用估算位置: (${spriteX}, ${spriteY})`);
        }
        
        const card = document.createElement('div');
        card.className = 'icon-card';
        card.setAttribute('data-component', item.name);
        
        const spriteDiv = document.createElement('div');
        spriteDiv.className = 'icon-sprite';
        spriteDiv.style.backgroundPosition = `-${spriteX}px -${spriteY}px`;
        
        // 调试：显示背景位置
        spriteDiv.setAttribute('title', `坐标: (${spriteX}, ${spriteY})`);
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'icon-name';
        const displayName = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
        nameSpan.textContent = displayName;
        
        card.appendChild(spriteDiv);
        card.appendChild(nameSpan);
        card.addEventListener('click', () => showComponentDetail(item));
        
        iconsContainer.appendChild(card);
    });
    
    // 检查是否有图标渲染
    console.log(`✅ 已渲染 ${iconsContainer.children.length} 个图标`);
}

// 显示组件详情
function showComponentDetail(item) {
    const titleText = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
    const descText = lang === 'cn' ? (item.desc_cn || item.desc || '暂无描述') : (item.desc_en || item.desc || 'No description');
    const imgSrc = item.img ? `img/screenshots/${item.img}` : '';
    
    let imgHtml = '';
    if (imgSrc) {
        imgHtml = `
            <div class="screenshot">
                <img src="${imgSrc}" alt="${titleText}" 
                     onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\'color:#999\'>📷 截图文件不存在: ${item.img}</span>'">
            </div>
        `;
    } else {
        imgHtml = `<div class="screenshot"><span style="color:#aaa">📷 暂无示意图</span></div>`;
    }
    
    detailContent.innerHTML = `
        <div class="component-detail">
            <h3>${escapeHtml(titleText)}</h3>
            ${imgHtml}
            <div class="desc">
                <strong>📌 说明：</strong><br>
                ${escapeHtml(descText)}
            </div>
            ${item.name ? `<div class="desc" style="margin-top: 12px; font-size: 0.8rem; color: #666;">
                <strong>🔧 组件名称：</strong> ${item.name}
            </div>` : ''}
        </div>
    `;
}

// 防XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// 中英文切换
langBtn.addEventListener('click', () => {
    lang = lang === 'cn' ? 'en' : 'cn';
    langBtn.textContent = lang === 'cn' ? 'EN' : '中';
    
    // 刷新左侧分组文字
    renderSidebar();
    
    // 刷新当前分组的图标文字
    if (currentGroup && componentsData[currentGroup]) {
        const items = componentsData[currentGroup];
        const nameSpans = iconsContainer.querySelectorAll('.icon-name');
        items.forEach((item, idx) => {
            if (nameSpans[idx]) {
                nameSpans[idx].textContent = lang === 'cn' ? (item.cn || item.name) : (item.en || item.name);
            }
        });
        
        // 刷新标题
        const titleZh = groupDisplayNames[currentGroup] || currentGroup;
        currentGroupTitle.textContent = lang === 'cn' ? titleZh : currentGroup;
    }
    
    // 如果右侧有详情，刷新当前详情
    const currentTitle = detailContent.querySelector('.component-detail h3');
    if (currentTitle && window.currentDetailItem) {
        showComponentDetail(window.currentDetailItem);
    }
});

// 存储当前详情项用于切换语言时刷新
const originalShowDetail = showComponentDetail;
window.showComponentDetail = function(item) {
    window.currentDetailItem = item;
    originalShowDetail(item);
};
showComponentDetail = window.showComponentDetail;

// 页面加载完成后检查雪碧图
window.addEventListener('load', () => {
    console.log('页面加载完成');
    
    // 测试雪碧图是否可访问
    const testImg = new Image();
    testImg.onload = () => console.log('✅ 雪碧图加载成功: img/sprites/kangaroo_icons.png');
    testImg.onerror = () => console.error('❌ 雪碧图加载失败，请检查路径: img/sprites/kangaroo_icons.png');
    testImg.src = 'img/sprites/kangaroo_icons.png';
});
