<script setup>
import { ref } from 'vue';
import RepoEvents from '@/components/RepoEvents.vue';

const activeKey = ref('1');
</script>



<template>
    <div class="about-body">
        <a-tabs v-model:activeKey="activeKey">
            <a-tab-pane key="1" tab="简介">
                <a href="https://github.com/caolib/shop-web-admin"><img
                        src="https://img.shields.io/badge/source-black?logo=github"></a>
            </a-tab-pane>
            <a-tab-pane key="2" tab="仓库状态" force-render>
                <repo-events />
            </a-tab-pane>
        </a-tabs>
    </div>

</template>

<style lang="scss" scoped>
.about-body {
    margin: 20px;
    padding: 20px;
}
</style>