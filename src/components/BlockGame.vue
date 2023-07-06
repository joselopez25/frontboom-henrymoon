<script setup>
import {words} from '../data/data.js'
import bombSound  from '../sound/bomba.mp3'
import crono from '../sound/crono.mp3'
import error from '../sound/error.mp3'
import { io } from "socket.io-client";
import { ref, onMounted, onUnmounted, watch, onBeforeMount, nextTick, onBeforeUnmount} from 'vue';
import bomba from '../assets/bomba.png'
import corz from '../assets/crz.png'
import flecha from '../assets/flecha.png'
import win from '../assets/win.png'
import { useRoute } from 'vue-router';
const inputRef = ref(null)
const inputs = ref(null)
let button = ref(true)
let props = defineProps(['name'])
let canvas = ref(null);
let noLive = ref([])
let ctx = ref(null)
let palabra = ref('')
let palVivo = ref('')
let user = ref('')
let turno = ref('')
let angPer = ref([])
let silaba = ref('')
let personas = ref([])
let personsName = ref([])
let time = ref(0)
let ganador = ref('')
let currentPlayer = ref(0);
let countdownInterval = ref(null);
let animate = null;
let escala = true
let wordused = ref([])
let salButton= true
let numeroPer = ref(0)
let primero = ref('')
let email = ref('')
let name = ref('')
const socket = io("https://serverboomparty.onrender.com/")    //PARA DEPLOY
/* const socket = io("http://localhost:3005/") */
const route = useRoute()
const errors = new Audio(error)
const bomb = new Audio(bombSound) 
bomb.volume = 0.3
let cronometro = new Audio(crono)
const bombImg = new Image();
bombImg.src = bomba

socket.on('sound', ()=>{
    if(noLive.value.length===personas.value.length-1)return
    cronometro = new Audio(crono)
    cronometro.volume = 0.3
    cronometro.play()
  })

onMounted(() => {
  email.value = route.query.email
  ctx.value = canvas.value.getContext('2d');  
  socket.emit("name", props.name)
  name.value = props.name.split(' ')[0]
  console.log(name.value);
  const centerX = canvas.value.width / 2;
  const centerY = canvas.value.height / 2;

  watch(silaba, ()=>{
    console.log('cambio');
    ctx.value.font = '30px Arial'
    ctx.value.fillStyle= 'white'
    ctx.value.textAlign = 'center'
    ctx.value.clearRect(centerX-15,centerY+65,70, 50)
    ctx.value.fillText(silaba.value,centerX+15,centerY+100)
  })
  watch(personas, ()=>{
    numeroPer.value = personas.value.length
  })

  watch(numeroPer,()=>{
    if(!salButton){
      socket.emit('endGame')
      salButton = true
    }
  })

  inputs.value.disabled = true
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
      inputs.value.disabled = false
      if(name.value !== turno.value || personas.value[currentPlayer.value].vidas===0){
        inputs.value.disabled = true
      }
      inputRef.value.focus()
    })
    socket.on('people', data=>{
      primero.value = data[0].email
      ctx.value.clearRect(0,0,canvas.value?.width, canvas.value?.height)
      personas.value = data
    data.forEach(persona =>{
      personsName.value = [...personsName.value, persona.name]
      personsName.value = new Set(personsName.value)
      personsName.value =  [...personsName.value]
    })
    
    bombImg.src = bomba
    bombImg.onload= ()=>{
      ctx.value.drawImage(bombImg,centerX-45,centerY-60,100,100)
    }

    const radius = 180;
    const angleStep = (Math.PI * 2) / data.length;
    
    angPer.value = []
    personas.value.forEach((person,index) => {
      const angle = index * angleStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      angPer.value = [...angPer.value, {name: person.name, x: x, y: y}]
      console.log(angPer.value);
      ctx.value.beginPath();
      ctx.value.arc(x, y, 25, 0, Math.PI*2);
      ctx.value.fillStyle='white';
      ctx.value.fill();
      ctx.value.closePath();
      ctx.value.font = '16px Arial'
      ctx.value.fillStyle= 'black'
      ctx.value.textAlign = 'center'
      ctx.value.fillText(person.name, x, y+6)
      socket.on('envivo', data=>{
        palVivo.value= data
      })
      
    })
  })
  socket.on('user', (data) =>{
    user.value = data
  });
  
  
  
  
  socket.on('changeTurn', (nextPlayer) => {
    if(personas.value.length==1 || noLive.value.length===personas.value.length-1){
      clearInterval(countdownInterval.value);
      return socket.emit('endGame')
    }
    clearInterval(animate)
    socket.emit('sound')
    vidas()
    animate = setInterval(animateBomb,300)
    if(noLive.value.includes(nextPlayer)){
      return endTurn();
    }
    turno.value = nextPlayer
    // Reiniciar el temporizador para el nuevo turno
    resetTimer();
  });
    
  const vidas =()=>{
    if(noLive.value.length===personas.value.length-1)return
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
    if(noLive.value.length===personas.value.length-1)return
    personas.value = data
    bomb.play();
    vidas()
})

socket.on('updateNoLive',(data)=>{
  noLive.value = data
})

const animateBomb = ()=>{
  /* ctx.value.clearRect(centerX-55,centerY-62,120, 110) */
  bombImg.src = bomba
  bombImg.onload= ()=>{
    if(escala){
      ctx.value.clearRect(centerX-55,centerY-68,120, 120)
      /* ctx.value.fillRect(centerX-55,centerY-68,120, 120) */
      ctx.value.drawImage(bombImg,centerX-45,centerY-60,100,100)
      escala = false
    }else{
      ctx.value.clearRect(centerX-55,centerY-68,120, 120)
      /* ctx.value.fillRect(centerX-55,centerY-68,120, 120) */
      ctx.value.drawImage(bombImg,centerX-50,centerY-65,115,115)
      escala = true
    }
  }
}



const timer = ()=>{
  //NEW
  if(noLive.value.length===personas.value.length-1){return}
  
  personas.value.forEach((person, index)=> {
    if(person.name === name.value){
      return currentPlayer.value = index
    }
  });
  let countdown = 10;
  countdownInterval.value = setInterval(() => {
    
    if(name.value === turno.value){
      countdown--;
      socket.emit('count', countdown)
    }
    if (countdown <= 0) {
      // El tiempo ha expirado, pasar al siguiente jugador automáticamente
      palabra.value = ''
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
    time.value = data
  })
  
  const resetTimer = () => {
    clearInterval(countdownInterval.value);
    timer()
  };
  
  watch(palabra, ()=>{
    if(palabra.value.length <20){
      socket.emit("online", palabra.value)
    }
  })
  
  socket.on('endGame', ()=>{
    endGame()
  })
  
  socket.on('sil', data=>{
    console.log(data);
    silaba.value = data
  })
  const endGame = ()=>{
    cronometro.pause()
    salButton= true
    clearInterval(animate)
    clearInterval(countdownInterval.value);
  personas.value.forEach(person =>{
    if(!noLive.value.includes(person.name)){
      console.log(noLive.value);
      console.log(person.name);
      if(email.value === primero.value){
        socket.emit('ganador', person)
      }
      return ganador.value = person.name
    }
  })
  ctx.value.clearRect(0,0,canvas.value?.width, canvas.value?.height)
  ctx.value.font = '30px Arial'
  ctx.value.fillStyle= 'white'
  ctx.value.textAlign = 'center'
  /*    ctx.value.fillRect(x-130,y+40,300, 25) */ 
  ctx.value.fillText('Ganador: ' + ganador.value, centerX,centerY)
  ctx.value.clearRect(0,0,canvas.value?.width, canvas.value?.height)
  ctx.value.fillText('Ganador: ' + ganador.value + ' 100pts', centerX,centerY+200)

  const winer = new Image();
  winer.src = win
  winer.onload= ()=>{
    ctx.value.drawImage(winer,centerX-100,centerY-200,winer.width/7,winer.height/7)
  }
  
  setTimeout(()=>{
    location.reload()
    /* router.push(`/`) */
  }, 5000)
}

});




const salida = ()=>{
  cronometro.pause()
  clearInterval(countdownInterval.value);
  socket.emit('salida', name.value)
}

onUnmounted(()=>{
  cronometro.pause()
  button.value = true
  salButton= true
  salida()
})


const init = ()=>{
  button.value = false
  socket.emit("generate")
  socket.emit('inicio');
}

const endTurn = () => {
  socket.emit('endTurn');
  clearInterval(countdownInterval.value);
};


const handleSubmit = ()=>{
  console.log(words.includes(palabra.value));
  palabra.value= palabra.value.toLowerCase()
  if(palabra.value.match(silaba.value)){
    if(words.includes(palabra.value)){
      if(!wordused.value.includes(palabra.value)){
        endTurn()
        socket.emit("generate")
        wordused.value = [...wordused.value, palabra.value]
        palabra.value = ''
      }else{
        errors.volume = 0.8
        errors.play()
      }
    }else{
      errors.volume = 0.8
      errors.play()
    }
  }else{
    errors.volume = 0.8
    errors.play()
  }
}

onBeforeUnmount(() => {
  socket.emit('salida', name.value)
});





</script>

<template>
  <div class="box">
    <div class="info">
      <h3>Palabra: {{ palVivo }}</h3>
      <h3>Tiempo: {{ time }}</h3>
      <h3 v-if="name === turno">Es tu turno </h3>
      <h3 v-else>Es turno de: {{ turno }}</h3>
      <button class="play" v-if="email === primero && button" @click="init">Comenzar</button>
      <router-link  @click="salida" to="/" ><button  class="boton">Salir</button></router-link>
    </div>
    <canvas class="canvas" ref="canvas" width="1000" height="600" ></canvas>
      <fieldset ref="inputs" class="inputs">
        <input class="input" ref="inputRef" @keydown.enter="handleSubmit" placeholder="Ingresa palabra" v-model="palabra"/>
        <button class="envia" @click="handleSubmit">Enviar</button>
      </fieldset>
  </div>
</template>

<style scoped>

.box{
  scale: 0.9;
  position: absolute;
  top: 30px;
  left: 7%;
}
.info{
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: center;
  justify-content: space-around;
}

.canvas{
  border: 2px solid #F2E500;
  border-radius: 10px;
}

.boton{
  background-color: rgb(189, 0, 0);
  border-radius: 8px;
  border: 2px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.25s;
}
.boton:hover {
  border-color: #600000;
}

.play{
  background-color: rgb(0, 57, 20);
  border-radius: 8px;
  border: 2px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.25s;
}
.play:hover {
  border-color: #00bd00;
}

.input{
  width: 300px;
  height: 30px;
  margin-right: 10px;
  border: 2px solid #fefefe;
  border-radius: 5px;
  font-size: 16px;
}

.inputs{
  border: 2px solid #F2E500;
  border-radius: 10px;
}

.envia{
  background-color: #2d2d2d;
  border-radius: 8px;
  border: 2px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.25s;
}

.envia:hover {
  border-color: #ffffff;
}




</style>
