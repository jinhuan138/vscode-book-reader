import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteSingleFile } from "vite-plugin-singlefile"

// https://cn.vitejs.dev/
export default defineConfig({
	plugins: [vue(),viteSingleFile()],
	server: {
		port: 8025,
	},
	root:"./resource",
	base:"./resource",
	esbuild:{
      exclude:['./resource/public/files']
	}
});
