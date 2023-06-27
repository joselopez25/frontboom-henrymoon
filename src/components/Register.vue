<script setup>
import { onMounted, ref } from 'vue';
import { io } from "socket.io-client";
import {useRouter} from 'vue-router'
const usuario = ref('')
const user = ref('')
const error = ref('')
const handleSubmit = (event)=>{
  event.preventDefault();
  user.value= usuario.value
  socket.emit('val', user.value)
  
  console.log(user.value);
}

const router = useRouter();

const socket = io("https://serverboomparty.onrender.com/")  
/* const socket = io("http://localhost:3002/") */
socket.on('val', ()=>{
  socket.emit("name", user.value)
})

socket.on('ingreso', ()=>{
  router.push(`/game/${usuario.value}`)
})
socket.on('inval',()=>{
  console.log('invalido');
  error.value = 'Ya existe alguien con tu ID'
})

onMounted(()=>{
  /* location.reload() */
})


</script>

<template>
  <label for="name">Nombre: </label>
  <input class="input" id="name" placeholder="Ingresa tu nombre" v-model="usuario"/>
  <button class="ingreso" @click="handleSubmit" >Ingresar</button>
  <p v-if="error" >{{ error }}</p>
</template>

<style scoped>
.input{
  width: 300px;
  height: 30px;
  margin-right: 10px;
  border: 2px solid #fefefe;
  border-radius: 5px;
  font-size: 16px;
  margin-left: 10px;
}

.ingreso{
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

.ingreso:hover {
  border-color: #ffffff;
}
</style>

