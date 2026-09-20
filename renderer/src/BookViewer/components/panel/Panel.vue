<template>
  <!-- panel -->
  <div class="panel-box">
    <Search />
    <Bookmark />
    <Note />
    <el-dropdown trigger="click" @command="openMore">
      <el-icon class="more-icon" color="#ccc" :title="t('common.more')">
        <MoreFilled />
      </el-icon>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="voice">
            <el-icon><Headset /></el-icon>{{ t('voice.title') }}
          </el-dropdown-item>
          <el-dropdown-item command="info">
            <el-icon><WarningFilled /></el-icon>{{ t('info.title') }}
          </el-dropdown-item>
          <el-dropdown-item command="setting">
            <el-icon><SettingIcon /></el-icon>{{ t('settings.title') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <Voice ref="voice" :show-trigger="false" />
    <Info ref="info" :show-trigger="false" />
    <Setting ref="setting" :show-trigger="false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Headset, MoreFilled, Setting as SettingIcon, WarningFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import Search from './Search.vue'
import Info from './Info.vue'
import Setting from './Setting/Setting.vue'
import Bookmark from './Bookmark.vue'
import Note from './Note.vue'
import Voice from './Voice.vue'

const { t } = useI18n()
const voice = ref<{ open: () => void }>()
const info = ref<{ open: () => void }>()
const setting = ref<{ open: () => void }>()

const openMore = (command: string) => {
  if (command === 'voice') voice.value?.open()
  if (command === 'info') info.value?.open()
  if (command === 'setting') setting.value?.open()
}
</script>
<style scoped>
/* panel */
.panel-box {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 5px;
}

.more-icon {
  cursor: pointer;
  z-index: 5;
}

.more-icon:hover {
  color: #409efc;
}
</style>
