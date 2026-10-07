# 智慧学堂 - 部署到 Render 免费版

## 项目结构
```
zhxt-app/
├── server.js          # 后端服务（Express）
├── package.json       # 依赖配置
├── data/              # 数据存储（JSON文件）
│   └── database.json
└── public/            # 前端静态文件
    ├── index.html
    ├── manifest.json
    ├── service-worker.js
    └── icons/
        └── icon.svg
```

## 功能说明
- 👨‍🏫 **教师端**：上传课件/视频、创建课程、查看学生
- 👨‍🎓 **学生端**：在线学习、每日打卡、学习进度
- 📱 **PWA支持**：可添加到手机桌面，像App一样使用
- 💾 **数据存储**：JSON 文件（轻量，适合小规模使用）

## Render 部署步骤

### 第一步：准备代码
把整个 `zhxt-app` 文件夹上传到 GitHub（或其他 Git 仓库）。

### 第二步：注册 Render
1. 打开 https://render.com
2. 用 GitHub 账号登录

### 第三步：创建 Web Service
1. 点击右上角 **"New +"** → 选择 **"Web Service"**
2. 选择你刚才上传的 GitHub 仓库
3. 填写配置：
   - **Name**: 随便起，比如 `zhxt-app`
   - **Region**: 选新加坡（Singapore），离中国近一点
   - **Branch**: `main` 或 `master`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: 选 **Free**（免费版）
4. 点击 **"Create Web Service"**

### 第四步：等待部署
大概等 1-3 分钟，部署完成后会给你一个网址，类似：
`https://zhxt-app.onrender.com`

打开这个网址就能用了！

## 重要提醒 ⚠️

### 关于数据存储
Render 免费版的文件系统是**临时**的，每次重启或重新部署数据会丢失。

**解决办法：**
1. **定期备份**：访问 `https://你的网址/api/export` 下载数据备份
2. **恢复数据**：用 Postman 或其他工具 POST 到 `https://你的网址/api/import` 导入备份
3. **长期使用建议**：升级到付费版（7美元/月起），或者接入 PostgreSQL 数据库

### 免费版限制
- 每月 750 小时运行时间（够一个月每天24小时用）
- 512MB 内存
- 15分钟无访问会休眠（下次打开需要等几秒启动）
- 适合几十人的小规模使用

### 推荐老师账号
默认有一个演示老师账号：
- **姓名**：张老师
- **密码**：123456

## 本地运行
```bash
cd zhxt-app
npm install
npm start
```
然后打开 http://localhost:3000

## 常见问题

**Q: 学生怎么注册？**
A: 学生打开网址 → 点"我是学生" → 输入姓名 → 自动注册

**Q: 老师怎么上传课程？**
A: 老师登录 → 课程管理 → 新建课程 → 选择类型（课件/视频）→ 上传 → 保存

**Q: 手机怎么添加到桌面？**
A: 
- 苹果手机：Safari 打开 → 分享按钮 → 添加到主屏幕
- 安卓手机：Chrome 打开 → 菜单 → 安装应用/添加到主屏幕

**Q: 视频上传大小有限制吗？**
A: 目前限制 100MB，视频太大的话建议先压缩一下。
