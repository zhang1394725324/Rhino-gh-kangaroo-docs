let lang = 'cn'; // 默认中文

// 加载 JSON 数据
let components = [];
fetch('data/kangaroo.json')
    .then(res => res.json())
    .then(data => {
        components = [];
        for (let group in data) {
            components.push(...data[group]);
        }
        renderIcons();
    });

function renderIcons() {
    const container = document.getElementById('icons');
    container.innerHTML = '';
    components.forEach(item => {
        let div = document.createElement('div');
        div.className = 'icon';
        div.style.backgroundPosition = `-${item.spriteX}px -${item.spriteY}px`;
        div.title = lang==='cn'?item.cn:item.en;
        div.onclick = () => showContent(item);
        
        // 名字显示
        let nameDiv = document.createElement('div');
        nameDiv.innerText = lang==='cn'?item.cn:item.en;
        div.appendChild(nameDiv);
        
        container.appendChild(div);
    });
}

function showContent(item) {
    document.getElementById('comp-name').innerText = lang==='cn'?item.cn:item.en;
    document.getElementById('comp-desc').innerText = lang==='cn'?item.desc_cn:item.desc_en;
    document.getElementById('comp-img').src = 'img/screenshots/' + item.img;
}

// 中英文切换
document.getElementById('langBtn').addEventListener('click', ()=>{
    lang = (lang==='cn')?'en':'cn';
    document.getElementById('langBtn').innerText = (lang==='cn')?'EN':'中';
    renderIcons();
});
