<script setup>
import { jump } from '@/router/jump';


</script>

<template>
    <div class="home-view">
        <a-button type="primary" @click="jump('login')">微信登录</a-button>
    </div>
</template>

<style scoped></style>