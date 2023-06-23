<script setup>
import { ref } from 'vue';
const usuario = ref('')
const user = ref('')
const handleSubmit = (event)=>{
  event.preventDefault();
  user.value= usuario.value
  console.log(user.value);
}
</script>

<template>
  <form @submit="handleSubmit">
    <label for="name">Nombre:</label>
    <input id="name" placeholder="Ingresa tu nombre" v-model="usuario"/>
    <router-link :to="`/game/${usuario}`"  ><button >Ingresar</button></router-link>
  </form>
</template>

