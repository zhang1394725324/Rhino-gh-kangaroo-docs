let lang = 'cn';

const groups = [
    "Goals-6dof","Goals-Angle","Goals-Co","Goals-Col",
    "Goals-Lin","Goals-Mesh","Goals-On","Goals-Pt",
    "Main","Mesh","Utility"
];

function loadGroups(){
    let html = '';
    groups.forEach(g=>{
        html += `<div class="group-btn" onclick="showGroupIcons('${g}')">${g}</div>`;
    });
    document.getElementById("groups").innerHTML = html;
}

function showGroupIcons(group){
    fetch('data/kangaroo.json')
    .then(res=>res.json())
    .then(data=>{
        const items = data[group];
        let html = '';
        items.forEach(item=>{
            html += `<div class="icon" style="background-position: -${item.spriteX}px -${item.spriteY}px;" 
                         onclick="showContent('${group}','${item.name}')">
                         <div>${lang==='cn'?item.cn:item.en}</div>
                     </div>`;
        });
        document.getElementById('icons').innerHTML = html;
        document.getElementById('content').innerHTML = '请选择组件';
    });
}

function showContent(group,name){
    fetch('data/kangaroo.json')
    .then(res=>res.json())
    .then(data=>{
        let item = data[group].find(i=>i.name===name);
        document.getElementById('content').innerHTML = `
            <h2>${lang==='cn'?item.cn:item.en}</h2>
            <p>${lang==='cn'?item.desc_cn:item.desc_en}</p>
            <img class="screenshot" src="img/screenshots/${item.img}">
        `;
    });
}

function toggleLang(){
    lang = lang==='cn'?'en':'cn';
    // 刷新当前组件显示
    const current = document.getElementById('content').querySelector('h2');
    if(current) {
        const group = current.dataset.group;
        const name = current.dataset.name;
        if(group && name) showContent(group,name);
    }
}

// 搜索
document.getElementById('search').addEventListener('input', function(){
    let keyword = this.value.toLowerCase();
    fetch('data/kangaroo.json')
    .then(res=>res.json())
    .then(data=>{
        let html='';
        Object.values(data).flat().forEach(item=>{
            if(item.name.toLowerCase().includes(keyword) || item.cn.includes(keyword)){
                html += `<div class="icon" style="background-position: -${item.spriteX}px -${item.spriteY}px;"
                          onclick="showContent('${item.group}','${item.name}')">
                            <div>${lang==='cn'?item.cn:item.en}</div>
                        </div>`;
            }
        });
        document.getElementById('icons').innerHTML = html;
    });
});

loadGroups();
