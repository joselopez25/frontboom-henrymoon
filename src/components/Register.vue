<script setup>
import { ref } from 'vue';
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

const socket = io("https://serverboomparty.onrender.com/")  
const router = useRouter();

/* const socket = io("http://localhost:3002/") */
socket.on('val', ()=>{
  console.log('valido');
  router.push(`/game/${usuario.value}`)
})
socket.on('inval',()=>{
  console.log('invalido');
  error.value = 'Ya existe alguien con tu ID'
})


</script>

<template>
  <label for="name">Nombre:</label>
  <input id="name" placeholder="Ingresa tu nombre" v-model="usuario"/>
  <button @click="handleSubmit" >Ingresar</button>
  <p v-if="error" >{{ error }}</p>
</template>

