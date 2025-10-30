# Timeline Manager - 室内设计项目管理系统

## 📋 项目概述

Timeline Manager 是一个专为室内设计和建筑行业开发的项目管理系统，提供从项目创建到交付的全流程管理解决方案。

## 🎯 主要功能

### 核心功能
- ✅ **项目管理** - 自动项目编码，进度跟踪，状态计算
- ✅ **看板系统** - 拖拽式任务管理，4个状态列
- ✅ **甘特图** - 可视化时间线，支持日/周/月视图
- ✅ **材料管理** - CSV导入导出，分类管理
- ✅ **文件上传** - 本地存储，支持多种文件格式
- ✅ **版本控制** - 自动标签，审批流程
- ✅ **进度跟踪** - 自动计算，实时更新
- ✅ **PDF导出** - 项目报告，材料清单
- ✅ **活动日志** - 完整的操作记录

### 技术特性
- 🔐 **身份认证** - NextAuth.js + JWT，4种角色权限
- 🎨 **用户界面** - 深色主题，响应式设计
- 📱 **移动友好** - 支持各种屏幕尺寸
- ⚡ **实时更新** - Socket.IO支持
- 🗄️ **数据管理** - Prisma ORM + SQLite

## 🛠 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: SQLite
- **认证**: NextAuth.js
- **UI**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand + TanStack Query
- **图表**: Recharts + Gantt Task React
- **文件处理**: Formidable + PDFMake

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **解压项目文件**
   ```bash
   # 解压后进入项目目录
   cd timeline-manager
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量文件
   cp .env.example .env.local
   
   # 编辑环境变量（可选）
   nano .env.local
   ```

4. **数据库初始化**
   ```bash
   # 生成Prisma客户端
   npx prisma generate
   
   # 运行数据库迁移
   npx prisma migrate dev
   
   # 导入种子数据
   npm run seed
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

6. **访问应用**
   - 打开浏览器访问: http://localhost:3000
   - 使用测试账号登录

## 👥 测试账号

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 管理员 | admin@rad.example | Admin123! | 全部权限 |
| 项目经理 | pm@rad.example | Pm123! | 项目管理、用户管理 |
| 设计师 | designer@rad.example | Designer123! | 任务管理、文件上传 |
| 客户 | client@rad.example | Client123! | 查看项目、评论 |

## 📁 项目结构

```
timeline-manager/
├── src/
│   ├── app/                 # Next.js App Router页面
│   │   ├── (auth)/         # 认证相关页面
│   │   ├── dashboard/      # 仪表板
│   │   ├── projects/       # 项目管理
│   │   └── api/            # API路由
│   ├── components/         # React组件
│   │   ├── ui/            # shadcn/ui组件
│   │   ├── charts/        # 图表组件
│   │   └── forms/         # 表单组件
│   ├── lib/               # 工具库
│   │   ├── auth.ts        # 认证配置
│   │   ├── db.ts          # 数据库连接
│   │   └── utils.ts       # 工具函数
│   └── types/             # TypeScript类型定义
├── prisma/                # 数据库配置
│   ├── schema.prisma      # 数据模型
│   └── seed.ts           # 种子数据
├── public/               # 静态资源
└── uploads/              # 上传文件存储
```

## 🎨 界面预览

### 主要页面
- **登录页面** - 简洁的登录界面
- **仪表板** - 项目概览和统计
- **项目列表** - 所有项目的管理界面
- **项目详情** - 包含多个标签页：
  - Overview - 项目概览
  - Phases & Revisions - 阶段和版本管理
  - Kanban - 任务看板
  - Gantt - 甘特图视图
  - Materials - 材料管理
  - Files - 文件管理
  - Activity - 活动日志

### 设计特点
- 🌙 **深色主题** - 专业的深色界面
- 📱 **响应式设计** - 适配各种设备
- 🎯 **直观操作** - 拖拽、点击等自然交互
- 📊 **数据可视化** - 丰富的图表和进度条

## 📊 示例数据

项目包含完整的示例数据：

### 示例项目
- **项目名称**: 室内卧室极简设计
- **项目编码**: 202505-INT-BED01
- **客户**: RAD Design Studio
- **时间**: 2025-05-12 至 2025-06-30

### 项目阶段
1. **Moodboard** (10%) - 情绪板制作
2. **Layout** (20%) - 平面布局设计
3. **Design** (25%) - 深化设计
4. **Material Scheduler** (15%) - 材料规划
5. **Construction Drawing** (20%) - 施工图
6. **Supervision** (10%) - 现场监督

### 示例任务
- 15个示例任务分布在各个阶段
- 2个设计版本 (D1, D2)
- 5个示例材料项目
- 完整的活动日志记录

## 🔧 开发命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 数据库操作
npx prisma generate      # 生成客户端
npx prisma migrate dev   # 运行迁移
npx prisma studio        # 数据库可视化
npm run seed            # 导入种子数据
```

## 📝 API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出

### 项目接口
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/[id]` - 获取项目详情
- `PUT /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目

### 任务接口
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/[id]` - 更新任务
- `PATCH /api/tasks/[id]/move` - 移动任务

### 材料接口
- `GET /api/materials` - 获取材料列表
- `POST /api/materials` - 创建材料
- `POST /api/materials/import-csv` - 导入CSV
- `GET /api/materials/export-csv` - 导出CSV

## 🎯 业务逻辑

### 进度计算
- **任务进度**: 手动设置 0-100%
- **阶段进度**: 该阶段所有任务的平均进度
- **项目进度**: Σ(阶段进度 × 权重) / Σ(权重)

### 状态判断
- **On Track**: 进度正常，未超过80%时间限制
- **At Risk**: 超过80%时间但进度不足80%
- **Delayed**: 超过截止日期且进度不足100%

### 版本命名规则
- Layout: Layout 1, Layout 2, ...
- Design: D1, D2, D3, ...
- Construction Drawing: CD1, CD2, ...

## 🔒 权限系统

### 角色权限
- **Admin**: 全部权限
- **PM**: 项目管理、用户管理、导出功能
- **Designer**: 任务管理、文件上传、评论
- **Client**: 查看项目、评论、审批

### 数据安全
- JWT Token认证
- 基于角色的API访问控制
- 文件上传大小限制 (25MB)
- 输入验证和SQL注入防护

## 🌟 特色功能

### 1. 智能项目编码
自动生成项目编码，格式：YYYYMM-类型-序号
- INT: Interior (室内)
- EXT: Exterior (外观)
- COM: Commercial (商业)

### 2. 拖拽式看板
支持任务在不同状态列之间拖拽，实时更新进度

### 3. 多视图甘特图
- 日视图：显示每日任务
- 周视图：显示周计划
- 月视图：显示月度概览

### 4. 材料生命周期管理
从样品到最终使用的完整追踪

### 5. 版本控制系统
自动版本编号，审批流程，历史记录

## 📋 部署说明

### 本地部署
1. 按照快速开始步骤操作
2. 使用 `npm run build` 构建生产版本
3. 使用 `npm run start` 启动生产服务器

### 生产环境注意事项
- 修改 `NEXTAUTH_SECRET` 为强密码
- 配置生产数据库 (PostgreSQL)
- 设置文件存储服务 (可选)
- 配置反向代理 (Nginx)
- 启用HTTPS

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 邮箱: support@timemanager.com
- 文档: https://docs.timemanager.com
- 社区: https://community.timemanager.com

---

**Timeline Manager** - 让项目管理更简单、更高效！