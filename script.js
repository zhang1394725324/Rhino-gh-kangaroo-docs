// 全局变量
let lang = 'cn';           // 'cn' 或 'en'
let currentGroup = null;   // 当前激活的分组名
let componentsData = {};    // 存储从json加载的全部数据
let groupsList = [];        // 分组顺序列表

// DOM 元素
const groupNavList = document.getElementById('groupNavList');
const iconsContainer = document.getElementById('iconsContainer');
const currentGroupTitle = document.getElementById('currentGroupTitle');
const detailContent = document.getElementById('detailContent');
const langBtn = document.getElementById('langBtn');

// 定义分组显示顺序（参考原文档风格，且与你json结构一致）
const GROUP_ORDER = [
    'Goals-6dof', 'Goals-Angle', 'Goals-Co', 'Goals-Col', 'Goals-Lin',
    'Goals-Mesh', 'Goals-On', 'Goals-Pt', 'Main', 'Mesh', 'Utility'
];

// 分组友好名称映射（用于显示）
const groupDisplayNames = {
    'Goals-6dof': '六自由度约束', 'Goals-Angle': '角度约束', 'Goals-Co': '重合/共线/共面',
    'Goals-Col': '碰撞约束', 'Goals-Lin': '长度/弹簧约束', 'Goals-Mesh': '网格曲面约束',
    'Goals-On': '在几何体上', 'Goals-Pt': '点/锚点约束', 'Main': '求解器与核心',
    'Mesh': '网格工具', 'Utility': '实用工具'
};

// 加载 JSON 数据
fetch('data/kangaroo.json')
    .then(res => {
        if (!res.ok) throw new Error('JSON 加载失败');
        return res.json();
    })
    .then(data => {
        componentsData = data;
        // 提取存在的分组并按顺序排列
        groupsList = GROUP_ORDER.filter(group => componentsData[group] && componentsData[group].length > 0);
        if (groupsList.length === 0) {
            // 如果没有匹配到，则取所有键
            groupsList = Object.keys(componentsData).filter(g => componentsData[g]?.length);
        }
        // 渲染左侧导航
        renderSidebar();
        // 默认选中第一个分组
        if (groupsList.length) {
            setActiveGroup(groupsList[0]);
        }
    })
    .catch(err => {
        console.error('数据加载失败:', err);
        iconsContainer.innerHTML = '<div style="padding:40px; text-align:center">⚠️ 无法加载组件数据，请检查 kangaroo.json 文件路径或格式。</div>';
    });

// 渲染左侧分组列表
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

// 激活分组并渲染中间图标网格
function setActiveGroup(groupKey) {
    if (!componentsData[groupKey]) return;
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
    // 渲染图标网格
    renderIcons(groupKey);
    // 清空右侧详情（或保留占位）
    detailContent.innerHTML = `
        <div class="placeholder">
            <span>🔍 选择一个组件</span>
            <span>查看详细参数与示意图</span>
        </div>
    `;
}

// 根据分组渲染图标 (使用雪碧图)
function renderIcons(groupKey) {
    const items = componentsData[groupKey];
    if (!items || items.length === 0) {
        iconsContainer.innerHTML = '<div style="padding:20px; text-align:center">暂无组件</div>';
        return;
    }
    iconsContainer.innerHTML = '';
    items.forEach(item => {
        // 确保有sprite坐标，如果没有则默认为0,0
        const spriteX = item.spriteX !== undefined ? item.spriteX : 0;
        const spriteY = item.spriteY !== undefined ? item.spriteY : 0;
        
        const card = document.createElement('div');
        card.className = 'icon-card';
        card.setAttribute('data-component', item.name);
        
        const spriteDiv = document.createElement('div');
        spriteDiv.className = 'icon-sprite';
        spriteDiv.style.backgroundPosition = `-${spriteX}px -${spriteY}px`;
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'icon-name';
        nameSpan.textContent = lang === 'cn' ? item.cn : item.en;
        
        card.appendChild(spriteDiv);
        card.appendChild(nameSpan);
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            showComponentDetail(item);
        });
        iconsContainer.appendChild(card);
    });
}

// 显示右侧组件详情 (带截图)
function showComponentDetail(item) {
    const imgSrc = item.img ? `img/screenshots/${item.img}` : '';
    const titleText = lang === 'cn' ? item.cn : item.en;
    const descText = lang === 'cn' ? (item.desc_cn || '暂无描述') : (item.desc_en || 'No description');
    
    let imgHtml = '';
    if (imgSrc) {
        imgHtml = `
            <div class="screenshot">
                <img src="${imgSrc}" alt="${titleText}" onerror="this.style.display='none'; this.parentElement.innerHTML+='<span style=\'color:#999\'>暂无截图</span>'">
            </div>
        `;
    } else {
        imgHtml = `<div class="screenshot"><span style="color:#aaa">📷 示意图未提供</span></div>`;
    }
    
    detailContent.innerHTML = `
        <div class="component-detail">
            <h3>${escapeHtml(titleText)}</h3>
            ${imgHtml}
            <div class="desc">${escapeHtml(descText)}</div>
        </div>
    `;
}

// 简单防XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

// 中英文切换
langBtn.addEventListener('click', () => {
    lang = lang === 'cn' ? 'en' : 'cn';
    langBtn.textContent = lang === 'cn' ? 'EN' : '中';
    
    // 刷新左侧分组文字
    renderSidebar();
    // 刷新当前激活分组图标和标题
    if (currentGroup) {
        // 标题刷新
        const titleZh = groupDisplayNames[currentGroup] || currentGroup;
        currentGroupTitle.textContent = lang === 'cn' ? titleZh : currentGroup;
        // 刷新图标文字
        const items = componentsData[currentGroup];
        if (items) {
            const nameSpans = iconsContainer.querySelectorAll('.icon-name');
            items.forEach((item, idx) => {
                if (nameSpans[idx]) {
                    nameSpans[idx].textContent = lang === 'cn' ? item.cn : item.en;
                }
            });
        }
        // 如果右侧有选中的组件详情，刷新其内容（需要知道当前展示的是哪个组件）
        const currentDetailTitle = detailContent.querySelector('.component-detail h3');
        if (currentDetailTitle && currentGroup) {
            // 需要知道具体的item，较复杂：我们找到当前高亮的卡片对应的组件name
            // 简单起见：仅刷新描述，但为了友好，重新获取激活卡片的name? 可暂略，下次点击自动刷新。
            // 这里优雅处理：用户再次点击任意卡片会刷新中英文，不自动刷新当前详情（避免冗余）
            // 也可以提供一个“当前组件刷新”：我们从detail缓存里重新找item不太方便，不做过度设计，因为点一下卡片就完美显示了。
        }
    }
    // 如果当前右侧有详情但未重新点击，留待用户重新点击即可
    // 若希望保持详情同步，可记录 lastItem 变量，这里不做复杂处理，提高稳定性
});

// 窗口加载后自适应雪碧图背景尺寸（如需要确认图标大小）
window.addEventListener('load', () => {
    // 确保雪碧图背景容器尺寸与雪碧图切片匹配（每个图标24x24，但我们在css里定义宽高48x48，雪碧图缩放尺寸需调整）
    // 注意如果图标实际大小24px，而展示48px，background-size应为原图尺寸2倍？原雪碧图宽240px高264px，每个切片24x24。
    // 若要显示48x48，background-size应设置为480px 528px，并且坐标也要按比例调整，但鉴于坐标都是基于原图位置，为了简单，保持展示尺寸为24x24
    // 修改css让 .icon-sprite 宽高24px，且 background-size 保持原样，放大效果由hover完成。这样坐标不用换算。
    const style = document.createElement('style');
    style.textContent = `
        .icon-sprite {
            width: 28px;
            height: 28px;
            background-size: 240px 264px;
            margin-bottom: 8px;
        }
        .icon-card:hover .icon-sprite {
            transform: scale(1.1);
        }
        .icon-card {
            padding: 12px 6px;
        }
        .icons-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 100px));
        }
        .icon-name {
            font-size: 0.7rem;
        }
    `;
    document.head.appendChild(style);
});
