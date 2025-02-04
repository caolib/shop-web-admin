import dayjs from 'dayjs';
import { ref, computed } from 'vue';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const username = 'caolib';
const repo = 'shop-web-admin';
const github_url = 'https://github.com'
const events = ref([]); // 仓库事件
const validEvents = computed(() => events.value.filter(item => item.payload.commits && item.payload.commits.length)); // 推送事件


function getGithubEvents() {
    return fetch(`https://api.github.com/repos/${username}/${repo}/events`).then(response => response.json());
}

function timeAgo(date) {
    return dayjs(date).fromNow();
}

function formatDate(date) {
    return dayjs(date).format('YYYY/MM/DD HH:mm:ss');
}

export {
    getGithubEvents,
    timeAgo,
    events,
    validEvents,
    formatDate,
    github_url
}