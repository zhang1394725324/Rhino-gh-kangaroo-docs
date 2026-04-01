let lang = 'cn';
const groups = [
    'Goals-6dof','Goals-Angle','Goals-Co','Goals-Col','Goals-Lin',
    'Goals-Mesh','Goals-On','Goals-Pt','Main','Mesh','Utility'
];

// 加载 JSON 数据
let components = {};
fetch('data/kangaroo.json')
.then(res=>res.json())
.then(data=>{
    components = data;
    renderGroups();
});

// 渲染所有分组和图标
function renderGroups() {
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    groups.forEach(groupName=>{
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        const h3 = document.createElement('h3');
        h3.innerText = groupName;
        groupDiv.appendChild(h3);

        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        if(components[groupName]){
            components[groupName].forEach(item=>{
                const iconDiv = document.createElement('div');
                iconDiv.className = 'icon';
                iconDiv.style.backgroundPosition = `-${item.spriteX}px -${item.spriteY}px`;
                iconDiv.title = lang==='cn'?item.cn:item.en;
                iconDiv.onclick = ()=>showContent(item);

                const nameDiv = document.createElement('div');
                nameDiv.innerText = lang==='cn'?item.cn:item.en;
                iconDiv.appendChild(nameDiv);

                iconContainer.appendChild(iconDiv);
            });
        }

        groupDiv.appendChild(iconContainer);
        main.appendChild(groupDiv);
    });

    // 添加组件信息显示区域
    const infoDiv = document.createElement('div');
    infoDiv.className = 'component-info';
    infoDiv.innerHTML = `
        <h2 id="comp-name"></h2>
        <img id="comp-img" src="" alt="" />
        <p id="comp-desc"></p>
    `;
    main.appendChild(infoDiv);
}

// 点击图标显示组件信息
function showContent(item) {
    document.getElementById('comp-name').innerText = lang==='cn'?item.cn:item.en;
    document.getElementById('comp-desc').innerText = lang==='cn'?item.desc_cn:item.desc_en;
    document.getElementById('comp-img').src = 'img/screenshots/' + item.img;
}

// 中英文切换
document.getElementById('langBtn').addEventListener('click', ()=>{
    lang = lang==='cn'?'en':'cn';
    document.getElementById('langBtn').innerText = lang==='cn'?'EN':'中';
    renderGroups();
});
