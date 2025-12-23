# 智能拼音大闯关 (Pinyin Adventure)

## 1. 项目简介
**智能拼音大闯关** 是一款专为小学生设计的互动式拼音学习应用。我们结合了游戏化教学理念，通过趣味闯关的方式，帮助孩子轻松掌握汉语拼音的声母、韵母及整体认读音节。项目基于 React + Tailwind CSS + Supabase 构建，提供多端适配的流畅体验。

## 2. 功能特点

### 2.1 闯关学习
- **科学分级**：依据人教版教材，从一年级到六年级科学划分关卡难度。
- **多种题型**：包含汉字、词语、句子三种模式，全方位锻炼拼读能力。
- **即时反馈**：答题正确会有庆祝动画与音效，错误则智能提示并记录。

### 2.2 智能复习
- **艾宾浩斯记忆**：内置智能复习算法，根据用户遗忘曲线自动安排复习内容。
- **错题本**：自动记录答错的拼音，提供针对性的强化训练。

### 2.3 趣味互动
- **卡通风格**：采用清新的蓝绿色调与可爱的卡通元素，吸引儿童兴趣。
- **语音朗读**：标准的拼音 TTS 发音，支持声母呼读音（如 b -> 波），纠正发音误区。
- **成就系统**：记录闯关进度与积分，激发学习动力。

## 3. 技术栈
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 库**: Tailwind CSS + Shadcn/UI (Lucide Icons)
- **数据库**: Supabase (PostgreSQL)
- **状态管理**: React Context + Hooks
- **路由**: React Router v6

## 4. 部署方法

### 4.1 环境准备
- Node.js >= 16.0.0
- npm 或 pnpm

### 4.2 安装依赖
```bash
npm install
# 或者
pnpm install
```

### 4.3 开发与构建
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 5. 作者信息
- **作者**: Tabor

## 6. 目录结构

```txt
├── README.md # 说明文档
├── index.html # 入口文件
├── package.json # 可以使用的package
├── postcss.config.js # postcss 配置
├── public # 静态资源目录
│   ├── favicon.png # 图标
│   └── images # 图片资源
├── src # 源码目录
│   ├── index.css # 全局样式
│   ├── main.tsx # 项目入口文件
├── tsconfig.app.json  # ts 前端配置文件
├── tsconfig.json # ts 配置文件
├── tsconfig.node.json # ts node端配置文件
└── vite.config.ts # vite 配置文件
```
