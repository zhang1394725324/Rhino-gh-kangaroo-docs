let lang="cn"
})


document.getElementById("icons").innerHTML=html


})

}


function showContent(group,name){

fetch("data/kangaroo.json")
.then(res=>res.json())
.then(data=>{

let item=data[group].find(i=>i.name==name)


document.getElementById("content").innerHTML=

`
<h2>${lang=="cn"?item.cn:item.en}</h2>

<p>${lang=="cn"?item.desc_cn:item.desc_en}</p>

<img class="screenshot" src="img/screenshots/${item.img}">

`

})

}


function toggleLang(){

lang= lang=="cn"?"en":"cn"

}



// 搜索


document.getElementById("search").addEventListener("input",function(){

let keyword=this.value.toLowerCase()

fetch("data/kangaroo.json")
.then(res=>res.json())
.then(data=>{

let html=""

Object.values(data).flat().forEach(item=>{

if(item.name.toLowerCase().includes(keyword)){

html+=`

<div class="icon" onclick="showContent('${item.group}','${item.name}')">

${item.name}

</div>

`

}

})


document.getElementById("icons").innerHTML=html

})


})


loadKangaroo()
