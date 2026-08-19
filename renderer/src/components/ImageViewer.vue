<template>
    <!-- image preview -->
    <el-image-viewer v-if="showPreview" :url-list="srcList" show-progress :initial-index="indexRef" hide-on-click-modal
        @close="showPreview = false">
        <template #toolbar="{ actions }">
            <el-icon @click="actions('zoomOut')">
                <ZoomOut />
            </el-icon>
            <el-icon @click="actions('zoomIn', { enableTransition: false, zoomRate: 2 })">
                <ZoomIn />
            </el-icon>
            <el-icon @click="actions('clockwise', { rotateDeg: 180, enableTransition: false })">
                <RefreshRight />
            </el-icon>
            <el-icon @click="actions('anticlockwise')">
                <RefreshLeft />
            </el-icon>
            <el-icon @click="downloadImage(indexRef)">
                <Download />
            </el-icon>
        </template>
    </el-image-viewer>
</template>

<script setup>
import { watch } from 'vue'
import { Download, RefreshLeft, RefreshRight, ZoomIn, ZoomOut } from '@element-plus/icons-vue'
import useImage from '@/hooks/useImage'
import { isSidebar } from '@/hooks/useSidebar'

const { srcList, showPreview, indexRef, downloadImage } = useImage()

watch(isSidebar, (val) => {
    document.body.classList.toggle('is-sidebar', val)
}, { immediate: true })
</script>
<style>
body.is-sidebar .el-image-viewer__btn {
    display: none;
}
</style>
