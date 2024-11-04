#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run build

# 进入生成的文件夹
cd resource/dist

git init
git checkout -b gh-pages
git remote add origin git@github.com:jinhuan138/vscode-book-reader.git
git add . 
git commit -m 'deploy'

git push -f origin gh-pages
cd -