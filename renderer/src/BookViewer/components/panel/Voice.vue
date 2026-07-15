<template>
    <el-icon class="voice-icon" @click="showVoice = true" color="#ccc">
        <Headset />
    </el-icon>
    <el-drawer resizable v-model="showVoice" title="voice" :with-header="false" :size="400">
        <el-form-item label="Text To Speech">
            <el-switch v-model="isReading" />
        </el-form-item>
        <el-form-item label="Engine">
            <el-select v-model="ttsConfig.engine" placeholder="select engine">
                <el-option v-for="item in engineList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
        </el-form-item>
        <el-form-item label="Speed">
            <el-slider v-model="ttsConfig.speed" :min="0.5" :max="2" :step="0.25" />
        </el-form-item>
        <!-- Edge TTS 音色选择 -->
        <el-form-item v-if="ttsConfig.engine === 'edge'" label="Voice">
            <el-cascader class="font-select" size="small" v-model="ttsConfig.edgeVoice" :options="edgeVoiceOptions"
                :props="{ expandTrigger: 'hover', emitPath: false }" :show-all-levels="false" :teleported="false"
                filterable placeholder="Select Voice" />
        </el-form-item>
        <!-- 系统 TTS 音色选择 -->
        <el-form-item v-else label="Voice">
            <el-select class="font-select" size="small" v-model="ttsConfig.systemVoice">
                <el-option v-for="(item, index) in systemVoiceList" :key="item.name" :label="item.name"
                    :value="index" />
            </el-select>
        </el-form-item>
    </el-drawer>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { Headset } from '@element-plus/icons-vue'
import useTTS from '@/hooks/useTTS'

const { isReading, ttsConfig, engineList, edgeVoiceOptions, systemVoiceList } = useTTS()
const showVoice = ref<boolean>(false)
</script>
<style scoped lang="scss">
.voice-icon {
    cursor: pointer;
    z-index: 5;
}

.voice-icon:hover {
    color: #409efc;
}

.font-select {
    width: 100%;
}
</style>
