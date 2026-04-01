
"Goals-Angle",
"Goals-Co",
"Goals-Col",
"Goals-Lin",
"Goals-Mesh",
"Goals-On",
"Goals-Pt",
"Main",
"Mesh",
"Utility"

]



function showTab(tab){

if(tab=="kangaroo"){

let html="";

kangarooGroups.forEach(g=>{

html+=`<button onclick="showGroup('${g}')">${g}</button>`

})


document.getElementById("sub-nav").innerHTML=html

}

}



function showGroup(name){

let html="";

for(let i=0;i<12;i++){

html+=`

<div class="icon" onclick="showContent('${name}',${i})">
${name}-${i}
</div>

`

}


document.getElementById("icon-area").innerHTML=html

}



function showContent(group,index){


document.getElementById("content").innerHTML=

`

<h2>${group}</h2>

<p>组件编号: ${index}</p>

<p>这里是教学内容区域</p>

`

}



showTab('kangaroo')
