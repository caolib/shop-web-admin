<script setup>
import RepoEvents from '@/components/RepoEvents.vue'

const techIcons = [
  { i: 'tauri', alt: 'Tauri' },
  { i: 'vue', alt: 'Vue.js' },
  { i: 'vite', alt: 'Vite' },
  { i: 'pinia', alt: 'Pinia' },
  { i: 'sass', alt: 'SCSS' },
  { i: 'js', alt: 'JavaScript' },
  { i: 'html', alt: 'HTML' },
  { i: 'css', alt: 'CSS' },
  { i: 'git', alt: 'Git' },
  { i: 'pnpm', alt: 'pnpm' },
]
</script>

<template>
  <div class="about-container">
    <a-card>
      <div class="centered-content">
        <a-typography-paragraph>
          这是一个基于 Tauri 框架构建的网上商店桌面管理应用程序
        </a-typography-paragraph>
        <a-typography-paragraph>
          <a-space wrap justify="center">
            <img
              v-for="icon in techIcons"
              :key="icon.i"
              :src="`https://skillicons.dev/icons?i=${icon.i}&theme=light`"
              :alt="icon.alt"
            />
            <a
              href="https://github.com/caolib/shop-web-admin"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://skillicons.dev/icons?i=github&theme=light"
                alt="GitHub Repository"
              />
            </a>
          </a-space>
        </a-typography-paragraph>
      </div>

      <a-divider />

      <a-typography-title :level="4">最近仓库活动</a-typography-title>
      <RepoEvents/>
    </a-card>
  </div>
</template>

<style lang="scss" scoped>
.about-container {
  padding: 20px;
}

.centered-content {
  text-align: center;
}

.centered-content .ant-space {
  display: inline-flex;
  justify-content: center;
}

img[alt] {
  margin-right: 5px;
  margin-bottom: 5px;
}
</style>
