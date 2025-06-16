const { GridStack } = window;

const grid = GridStack.init({ column:12, float:false, resizable:{handles:'e, se, s, w'} }, '#grid');
grid.on('change', saveLayout);

document.getElementById('fab-add').addEventListener('click', addCard);

function addCard(data={x:0,y:0,w:3,h:2,title:'Título',text:''}){
  const el=document.createElement('div');
  el.innerHTML=`
    <div class="grid-stack-item-content">
      <h6 contenteditable="true">${data.title}</h6>
      <textarea>${data.text}</textarea>
    </div>`;
  grid.addWidget(el,data);
  saveLayout();
}

function saveLayout(){
  localStorage.setItem('layout', JSON.stringify(grid.save(true)));
}
function restore(){
  const raw=localStorage.getItem('layout');
  if(raw){
    grid.load(JSON.parse(raw)).forEach(w=>{
      // re-bind events se precisar
    });
  }else{
    // primeiro uso: 3 cards demo
    addCard({x:0,y:0}); addCard({x:3,y:0}); addCard({x:6,y:0});
  }
}
restore();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/src/js/service-worker.js');
  });
}
