<script setup>
import RepoEvents from '@/components/RepoEvents.vue'
import { GithubFilled } from '@ant-design/icons-vue'

const techIcons = [
  { i: 'tauri', alt: 'Tauri', name: 'Tauri' },
  { i: 'vue', alt: 'Vue.js', name: 'Vue.js' },
  { i: 'vite', alt: 'Vite', name: 'Vite' },
  { i: 'pinia', alt: 'Pinia', name: 'Pinia' },
  { i: 'sass', alt: 'SCSS', name: 'SCSS' },
  { i: 'js', alt: 'JavaScript', name: 'JavaScript' },
  { i: 'pnpm', alt: 'pnpm', name: 'pnpm' },
]

const version = '0.3.14'
</script>

<template>
  <div class="about-page">
    <a-row class="about-container">
      <a-col :span="20" :offset="2">
        <a-card class="about-card" :bordered="false">
          <!-- 页面标题 -->
          <div class="page-header">
            <div class="page-title">
              <h2>关于</h2>
              <div class="title-divider"></div>
            </div>
          </div>

          <!-- 项目介绍 -->
          <div class="project-intro">
            <div class="intro-content">
              <div class="intro-icon">
                <img src="../assets/default-avatar.webp" alt="Shop Logo" class="shop-logo">
              </div>
              <div class="intro-text">
                <h3>
                  <a href="https://github.com/caolib/shop-web-admin" target="_blank" rel="noopener noreferrer"
                    class="project-title-link">
                    网上商店管理员桌面端
                    <github-filled class="github-icon" />
                  </a>
                </h3>
                <p>这是一个基于 Tauri + Vue3 构建的现代网上商店管理系统，为管理员提供高效商品管理体验。</p>
                <p>
                  使用 Tauri 打包，支持跨平台运行，由
                  <a href="https://github.com/caolib" target="_blank" rel="noopener noreferrer"
                    class="author-link">caolib</a>
                  开发和维护。
                </p>
              </div>
            </div>
          </div>

          <!-- 技术栈展示 -->
          <div class="tech-stack-section">
            <h3 class="section-title">技术栈</h3>
            <div class="tech-icons-container">
              <a-space wrap :size="[16, 16]" class="tech-icons">
                <div v-for="icon in techIcons" :key="icon.i" class="tech-icon-item">
                  <img :src="`https://skillicons.dev/icons?i=${icon.i}&theme=light`" :alt="icon.alt">
                  <span class="icon-name">{{ icon.name }}</span>
                </div>
                <div class="tech-icon-item">
                  <img src="https://skillicons.dev/icons?i=github&theme=light" alt="GitHub">
                  <span class="icon-name">GitHub</span>
                </div>
              </a-space>
            </div>
          </div>

          <a-divider style="margin: 24px 0;" />

          <!-- 版本信息 -->
          <div class="version-section">
            <h3 class="section-title">版本信息</h3>
            <div class="version-content">
              <p>当前版本: <a-tag color="green">v{{ version }}</a-tag></p>
            </div>
          </div>

          <a-divider style="margin: 24px 0;" />

          <!-- 仓库活动部分 -->
          <div class="repo-activity-section">
            <h3 class="section-title">最近仓库活动</h3>
            <div class="repo-activity-content">
              <repo-events />
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.about-page {
  min-height: 95vh;
  padding: 30px 0;
  background-color: $page-background;
}

.about-container {
  margin-top: 10px;
}

.about-card {
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  padding: 20px;
  background-color: $card-background;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  position: relative;
  margin-bottom: 20px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 0;
  }

  .title-divider {
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 40px;
    height: 4px;
    background-color: $primary-color;
    border-radius: 2px;
  }
}

.project-intro {
  margin-bottom: 40px;

  .intro-content {
    display: flex;
    align-items: center;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  }

  .intro-icon {
    margin-right: 30px;

    @media (max-width: 768px) {
      margin-right: 0;
      margin-bottom: 20px;
    }
  }

  .shop-logo {
    width: 120px;
    height: 120px;
    border-radius: 60px;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 4px solid white;
    padding: 10px;
    background-color: rgba($primary-color, 0.05);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
  }

  .intro-text {
    flex: 1;

    h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
      color: $text-primary;
    }

    p {
      color: $text-secondary;
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .project-title-link {
      color: inherit;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: $transition-normal;

      &:hover {
        color: $primary-color;
      }

      .github-icon {
        margin-left: 8px;
        font-size: 18px;
        opacity: 0.7;
      }
    }

    .author-link {
      color: $primary-color;
      text-decoration: none;
      font-weight: 500;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 100%;
        height: 1px;
        background-color: $primary-color;
        transform: scaleX(0);
        transition: transform 0.3s ease;
        transform-origin: right;
      }

      &:hover::after {
        transform: scaleX(1);
        transform-origin: left;
      }
    }
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: $text-primary;
  position: relative;
  padding-left: 12px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 18px;
    background-color: $primary-color;
    border-radius: 2px;
  }
}

.tech-stack-section {
  margin-bottom: 30px;
}

.tech-icons-container {
  background-color: rgba($primary-color, 0.03);
  border-radius: $border-radius;
  padding: 20px;
  box-shadow: inset 0 1px 8px rgba(0, 0, 0, 0.03);
}

.tech-icons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.tech-icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
  transition: $transition-normal;

  img {
    width: 50px;
    height: 50px;
    margin-bottom: 8px;
    transition: $transition-normal;
  }

  .icon-name {
    font-size: 12px;
    color: $text-secondary;
  }

  &:hover {
    transform: translateY(-5px);

    img {
      transform: scale(1.1);
    }

    .icon-name {
      color: $primary-color;
    }
  }
}

.version-section {
  margin-bottom: 30px;
}

.version-content {
  background-color: rgba($primary-color, 0.03);
  border-radius: $border-radius;
  padding: 20px;
  box-shadow: inset 0 1px 8px rgba(0, 0, 0, 0.03);

  p {
    margin-bottom: 10px;
    color: $text-secondary;
  }
}

.repo-activity-section {
  margin-bottom: 20px;
}

.repo-activity-content {
  background-color: rgba($primary-color, 0.03);
  border-radius: $border-radius;
  padding: 20px;
  box-shadow: inset 0 1px 8px rgba(0, 0, 0, 0.03);
  max-height: 400px;
  overflow-y: auto;
}
</style>
