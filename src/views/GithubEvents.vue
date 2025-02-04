<template>
    <a-card title="仓库状况">
        <a-timeline>
            <a-timeline-item v-for="event in events" :key="event.id">