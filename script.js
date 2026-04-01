
const data = {

kangaroo:[
{
name:"Anchor",
desc:"固定点约束",
img:"img/icons/anchor.png",
content:"用于固定点"
},

{
name:"Length",
desc:"长度约束",
img:"img/icons/length.png",
content:"控制线段长度"
}

],


battery:[

{
name:"Battery Solver",
desc:"电池求解器",
img:"img/icons/battery.png",
content:"电池仿真求解器"
},

{
name:"Voltage",
desc:"电压计算",
img:"img/icons/voltage.png",
content:"计算电压"
}

]

}



function showCategory(cat){

let html="";

data[cat].forEach((item,i)=>{

html+=`
<div class="icon" onclick="showContent('${cat}',${i})">

${item.name}

</div>

`;

})

document.getElementById("icon-panel").innerHTML=html;

}



function showContent(cat,i){

let item=data[cat][i];

document.getElementById("content").innerHTML=

`
<h2>${item.name}</h2>

<p>${item.desc}</p>

<hr>

<p>${item.content}</p>

`;

}
