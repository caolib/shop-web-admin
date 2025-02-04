<script setup>
import { onMounted } from 'vue';
import {
    getGithubEvents,
    timeAgo,
    events,
    validEvents,
    formatDate,
    github_url
} from '@/api/github.js';

onMounted(async () => {
    events.value = await getGithubEvents();
});

</script>


<template>
    <div class="about-view">
        <!-- 使用 a-timeline 组件展示含提交信息的 GitHub 仓库状况 -->
        <a-timeline class="time-line">
            <a-timeline-item class="my-timeline-item" v-for="(item, index) in validEvents" :key="index">
                <!-- 优化后的时间显示 -->
                <a-tag style="margin-bottom: 10px;">{{ formatDate(item.created_at) }}</a-tag>
                <div class="tl-body">
                    <div style="margin-bottom: 10px;">
                        <!-- 头像 -->
                        <a :href="`${github_url}/${item.actor.login}`" target="_blank" rel="noopener noreferrer">
                            <a-avatar :src="item.actor.avatar_url" size="small" />
                        </a>
                        <span style="color:gray;margin-left: 10px;">
                            {{ item.actor.login }}
                            pushed
                            {{ item.payload.commits.length }} commit{{ item.payload.commits.length > 1 ? 's' : '' }}
                            <!-- 分支标签 -->
                            to
                            <a-tag color="blue">
                                {{ item.payload.ref.replace('refs/heads/', '') }}
                            </a-tag>
                            • {{ item.payload.before.substring(0, 7) }}…{{ item.payload.commits[0].sha.substring(0, 7)
                            }}
                            • {{ timeAgo(item.created_at) }}
                        </span>
                    </div>
                    <!-- 提交记录 -->
                    <div class="commit" v-for="(commit, commitIndex) in item.payload.commits" :key="commitIndex">
                        <a class="commit-msg" :href="`${github_url}/${item.repo.name}/commit/${commit.sha}`"
                            target="_blank" rel="noopener noreferrer">
                            {{ commit.message }}
                        </a>
                    </div>
                </div>
            </a-timeline-item>
        </a-timeline>
    </div>
</template>

<style src="src/assets/styles/about.scss" lang="scss" scoped></style>
