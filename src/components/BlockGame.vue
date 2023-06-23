<script setup>

import { io } from "socket.io-client";
import { ref, onMounted,  onBeforeUnmount, onUnmounted, watch} from 'vue';
import bomba from '../assets/bomba.png'
import corz from '../assets/crz.png'
import flecha from '../assets/flecha.png'
const props = defineProps(['name'])
const canvas = ref(null);
const noLive = ref([])
const ctx = ref(null)
const palabra = ref('')
const palVivo = ref('')
const user = ref('')
const turno = ref('')
const angPer = ref([])
let silaba = ref('')
let personas = ref([])
let personsName = ref([])
let contador = ref(0);
const ganador = ref('')
const currentPlayer = ref(0);
let countdownInterval = null;
onBeforeUnmount(() => {
  socket.disconnect();
});

/* const socket = io("https://serverboomparty.onrender.com/") */    //PARA DEPLOY
const socket = io("http://localhost:3002/")


onMounted(() => {
  
  ctx.value = canvas.value.getContext('2d');
  socket.emit("name", props.name)
  socket.emit("generate")
  const centerX = canvas.value.width / 2;
  const centerY = canvas.value.height / 2;

  socket.on('sil', data=>{
    const sil = data.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    if(sil.length === 0 || sil.includes(',') || sil.includes('-')){
      return socket.emit("generate")
    }
    silaba.value = sil.toLowerCase()
    ctx.value.font = '30px Arial'
    ctx.value.fillStyle= 'white'
    console.log(sil);
    ctx.value.textAlign = 'center'
    ctx.value.clearRect(centerX-15,centerY+65,70, 50)
    ctx.value.fillText(sil,centerX+15,centerY+100)
  })

  watch(turno,()=>{
      angPer.value.forEach(persona => {
        ctx.value.clearRect(persona.x-20,persona.y-55,40,30)
        if(persona.name === turno.value){
          const fetch = new Image();
          fetch.src = flecha
          fetch.onload= ()=>{
            ctx.value.drawImage(fetch,persona.x-15,persona.y-50,30,20)
          }
        }
      });
      let form = document.querySelector("#field")
      form.disabled = false
      if(props.name !== turno.value || personas.value[currentPlayer.value].vidas===0){
       return form.disabled = true
      }
    })
  
  socket.on('people', data=>{
    console.log(data);
    ctx.value.clearRect(0,0,canvas.value.width, canvas.value.height)
    personas.value = data
    data.forEach(persona =>{
      personsName.value = [...personsName.value, persona.name]
      personsName.value = new Set(personsName.value)
      personsName.value =  [...personsName.value]
    })
    const image = new Image();
    image.src = bomba
    image.onload= ()=>{
      ctx.value.drawImage(image,centerX-30,centerY-60,100,100)
    }

    const radius = 180;
    const angleStep = (Math.PI * 2) / data.length;
    
    angPer.value = []
    personas.value.forEach((person,index) => {
      const angle = index * angleStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      angPer.value = [...angPer.value, {name: person.name, x: x, y: y}]
     /*  let hash = {}
      angPer.value = angPer.value.filter(person => hash[person.name] ? false : hash[person.name] = true ) */
      console.log(angPer.value);
      /* const crz = new Image();
      crz.src = corz */
      ctx.value.beginPath();
      ctx.value.arc(x, y, 25, 0, Math.PI*2);
      ctx.value.fillStyle='white';

      ctx.value.fill();
      ctx.value.closePath();
      /* crz.onload= ()=>{
        for(let i = 1; i <= person.vidas; i++){
          ctx.value.drawImage(crz,i<=1?x-21:x+1,y+15,20,20)
        }
      } */
      
      ctx.value.font = '16px Arial'
      ctx.value.fillStyle= 'black'
      ctx.value.textAlign = 'center'
      ctx.value.fillText(person.name, x, y+6)


      socket.on('envivo', data=>{
        palVivo.value= data
        if(person.name === props.name){
          ctx.value.font = '20px Arial'
          ctx.value.fillStyle= 'white'
          ctx.value.textAlign = 'center'
       /*    ctx.value.fillRect(x-130,y+40,300, 25) */ 
          ctx.value.clearRect(x-130,y+60,300, 25)
          ctx.value.fillText(data, x, y+80)
        }
      })
      
    })
  /*   vidas()  */
  })
  socket.on('user', (data) =>{
    user.value = data
  });

  socket.on('changeTurn', (nextPlayer) => {
    vidas()
    if(noLive.value.length===personas.value.length-1){
      clearInterval(countdownInterval);
      return socket.emit('endGame')
    }
    if(noLive.value.includes(nextPlayer)){
      return endTurn();
    }
    turno.value = nextPlayer
    // Reiniciar el temporizador para el nuevo turno
    resetTimer();
  });




  const vidas =()=>{
  personas.value.forEach((persona,index) => {
    
    const crz = new Image();
    crz.src = corz
    crz.onload= ()=>{
      ctx.value.clearRect(angPer.value[index].x-21,angPer.value[index].y+30,100,20)
      for(let i = 1; i <= persona.vidas; i++){
        ctx.value.drawImage(crz,i<=1?angPer.value[index].x-21:angPer.value[index].x+1,angPer.value[index].y+30,20,20)
      }
  }
})
}

socket.on('updateVidas',(data)=>{
  personas.value = data
  
  vidas()
})

socket.on('updateNoLive',(data)=>{
  noLive.value = data
})


const timer = ()=>{
  //NEW
  personas.value.forEach((person, index)=> {
    if(person.name === props.name){
      currentPlayer.value = index
    }
  });
  let countdown = 10;
  countdownInterval = setInterval(() => {
    
    if(props.name === turno.value){
      countdown--;
      socket.emit('count', countdown)
      console.log('Tiempo restante:', countdown);
    }
      if (countdown <= 0) {
        // El tiempo ha expirado, pasar al siguiente jugador automáticamente
        endTurn();
        personas.value[currentPlayer.value].vidas--
        socket.emit('updateVidas', personas.value)     
        personas.value.forEach(persona => {
        if(persona.vidas === 0){
            noLive.value = [...noLive.value, persona.name]
            noLive.value = new Set(noLive.value)
            noLive.value =  [...noLive.value]
            socket.emit('updateNoLive', noLive.value)
          }
        });
      }
    }, 1000);
  //END
}


socket.on('count', (data)=>{
  ctx.value.font = '30px Arial'
  ctx.value.fillStyle= 'white'
  ctx.value.textAlign = 'center'
  ctx.value.clearRect(890,20,40, 40)
  /* ctx.value.fillRect(890,20,40, 40)  */
  ctx.value.fillText(data, 910,50)
})
/* watch(turno.value,()=>{
  console.log(personas.value);
  for(let i = 0; i <= personas.value[currentPlayer.value].vidas; i++){
    if(personas.value[currentPlayer.value].vidas === 1){
      ctx.value.clearRect(angPer.value[currentPlayer.value].x-21,angPer.value[currentPlayer.value].y+30,20,20)
    }else if (personas.value[currentPlayer.value].vidas === 0){
      ctx.value.clearRect(angPer.value[currentPlayer.value].x+1,angPer.value[currentPlayer.value].y+30,20,20)
    }
  }
}) */


/* const initTurn = (data)=>{
  
  currentPlayer.value = data;
  turno.value = personas.value[data].name
  // Reiniciar el temporizador para el nuevo turno
  vidas()
  socket.emit('endTurn');
} */
const resetTimer = () => {
  clearInterval(countdownInterval);
  timer()
};


/* socket.on('turno', data=>{
  console.log(data.name);
  turno.value = data.name
  clearTimeout(func.value)
  func.value = setTimeout(timer,10000)
}) */


/* socket.on('inicio', (data)=>{
  
}) */

////////

watch(palabra, ()=>{
  if(palabra.value.length <20){
    socket.emit("online", palabra.value)
  }
})

socket.on('endGame', ()=>{
  endGame()
})

const endGame = ()=>{
  clearInterval(countdownInterval);
  personas.value.forEach(person =>{
    if(!noLive.value.includes(person.name)){
      console.log(noLive.value);
      console.log(person.name);
      return ganador.value = person.name
    }
  })
  ctx.value.clearRect(0,0,canvas.value.width, canvas.value.height)
  ctx.value.font = '30px Arial'
  ctx.value.fillStyle= 'white'
  ctx.value.textAlign = 'center'
  /*    ctx.value.fillRect(x-130,y+40,300, 25) */ 
  ctx.value.fillText('Ganador: ' + ganador.value, centerX,centerY)
  ctx.value.clearRect(0,0,canvas.value.width, canvas.value.height)
  ctx.value.fillText('Ganador: ' + ganador.value, centerX,centerY)
}

});



const salida = ()=>{
  clearInterval(countdownInterval);
  socket.emit('salida', props.name)
}

onUnmounted(()=>{
  salida()
})

const init = ()=>{
  socket.emit('inicio');
}

const endTurn = () => {
  clearInterval(countdownInterval);
  socket.emit('endTurn');
};
const handleSubmit = ()=>{
  palabra.value= palabra.value.toLowerCase()
  if(palabra.value.includes(silaba.value)){
    endTurn()
    socket.emit("generate")
    palabra.value = ''
    socket.emit("siguiente", contador.value)
  }
}

</script>

<template>
  <div>
    <div>
      <p v-if="props.name === turno">Es tu turno </p>
      <p v-else>Es turno de: {{ turno }}</p>
      <button v-if="props.name === 'Jose'" @click="init">Comenzar</button>
      <canvas ref="canvas" width="1000" height="600" style="border: 1px solid white;"></canvas>
    </div>
    <p>Palabra: {{ palVivo }}</p>
      <fieldset id="field">
        <input placeholder="Ingresa palabra" v-model="palabra"/>
        <button @click="handleSubmit">Enviar</button>
        <!-- <button @click="">Terminar Turno</button> -->
        <router-link @click="salida" to="/"><button >Salir</button></router-link>
      </fieldset>
  </div>
</template>

<style scoped>
</style>
