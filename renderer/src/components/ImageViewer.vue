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
import useTheme from '@/hooks/useTheme'

const { srcList, showPreview, indexRef, downloadImage } = useImage()
const { theme } = useTheme()

watch(isSidebar, (val) => {
    document.body.classList.toggle('is-sidebar', val)
}, { immediate: true })

// 图片预览跟随全局灰度模式
watch(() => theme.value.grayscale, (val) => {
    document.body.classList.toggle('is-image-grayscale', val)
}, { immediate: true })
</script>
<style>
body.is-sidebar .el-image-viewer__btn {
    display: none;
}
body.is-image-grayscale .el-image-viewer__img {
    filter: grayscale(100%);
}
</style>
