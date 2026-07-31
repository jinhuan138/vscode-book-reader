<template>
  <el-icon class="note-icon" color="#ccc" :title="t('note.title')" @click="showNotes = true">
    <Notebook />
  </el-icon>
  <el-drawer v-model="showNotes" resizable :title="t('note.title')" :with-header="false" :size="400">
    <div class="note-header">{{ t('note.title') }}</div>
    <el-empty v-if="notes.length === 0" :description="t('note.empty')" />
    <div v-else class="note-list">
      <button v-for="note in notes" :key="note.value" class="note-item" @click="goToNote(note)">
        <div class="note-quote">{{ note.quote }}</div>
        <div class="note-content">{{ note.note }}</div>
      </button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Notebook } from '@element-plus/icons-vue'
import { rendition } from '@/hooks/useRendition'
import useInfo, { type Highlight } from '@/hooks/useInfo'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const showNotes = ref(false)
const bookInfo = useInfo()
const notes = computed(() =>
  (bookInfo.value?.highlights || []).filter((highlight) => highlight.note.trim())
)

const goToNote = (highlight: Highlight) => {
  rendition.value?.goTo?.(highlight.value)
  showNotes.value = false
}
</script>

<style scoped lang="scss">
.note-icon {
  cursor: pointer;
  z-index: 5;
}

.note-icon:hover {
  color: #409efc;
}

.note-header {
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 600;
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-item {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-blank);
  text-align: left;
  cursor: pointer;
}

.note-item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
}

.note-quote {
  margin-bottom: 6px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.note-content {
  overflow: hidden;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
