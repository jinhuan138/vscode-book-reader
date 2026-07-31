<template>
    <el-icon class="voice-icon" :title="t('voice.title')" @click="showVoice = true" color="#ccc">
        <Headset />
    </el-icon>
    <el-drawer resizable v-model="showVoice" :title="t('voice.title')" :with-header="false" :size="400">
        <el-form-item :label="t('voice.textToSpeech')">
            <el-switch v-model="isReading" />
        </el-form-item>
        <el-form-item :label="t('voice.engine')">
            <el-select v-model="ttsConfig.engine" :placeholder="t('voice.selectEngine')">
                <el-option v-for="item in engineList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
        </el-form-item>
        <el-form-item :label="t('voice.speed')">
            <el-slider v-model="ttsConfig.speed" :min="0.5" :max="2" :step="0.25" />
        </el-form-item>
        <!-- Edge TTS 音色选择 -->
        <el-form-item v-if="ttsConfig.engine === 'edge'" :label="t('voice.voice')">
            <el-cascader class="font-select" size="small" v-model="ttsConfig.edgeVoice" :options="edgeVoiceOptions"
                :props="{ expandTrigger: 'hover', emitPath: false }" :show-all-levels="false" :teleported="false"
                filterable :placeholder="t('voice.selectVoice')" />
        </el-form-item>
        <!-- 系统 TTS 音色选择 -->
        <el-form-item v-else :label="t('voice.voice')">
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
