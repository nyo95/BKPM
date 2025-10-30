# 🚀 Timeline Manager - Local Setup Guide

## 📥 **从GitHub克隆项目到本地**

### 方法1: VS Code内置Git (推荐)
1. 打开VS Code
2. 按 `Ctrl+Shift+P`
3. 输入 "Git: Clone"
4. 输入URL: `https://github.com/nyo95/BKPM.git`
5. 选择本地目录

### 方法2: 命令行
```bash
git clone https://github.com/nyo95/BKPM.git
cd BKPM
code .
```

---

## ⚙️ **环境配置 (解决复制问题)**

### 🔧 **步骤1: 创建环境变量文件**

#### Windows用户:
```cmd
# 在项目根目录创建 .env.local 文件
copy .env.example .env.local
```

#### Mac/Linux用户:
```bash
# 在项目根目录创建 .env.local 文件
cp .env.example .env.local
```

#### 手动创建 (如果复制失败):
1. 在项目根目录创建新文件 `.env.local`
2. 复制以下内容到文件中:

```env
# Database Configuration
DATABASE_URL=file:./dev.db

# NextAuth Configuration
NEXTAUTH_SECRET=timeline-manager-secret-key-2024-local
NEXTAUTH_URL=http://localhost:3000

# Optional: Upload Configuration
UPLOAD_DIR=public/uploads

# Optional: Development Settings
NODE_ENV=development
```

---

## 🛠️ **项目安装步骤**

### 1. **安装依赖**
```bash
npm install
```

### 2. **数据库设置**
```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 导入种子数据
npm run seed
```

### 3. **启动开发服务器**
```bash
npm run dev
```

### 4. **访问应用**
- 打开浏览器访问: http://localhost:3000

---

## 👥 **测试账号**

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 管理员 | admin@rad.example | Admin123! | ✅ 全部权限 |
| 项目经理 | pm@rad.example | Pm123! | ✅ 项目管理 |
| 设计师 | designer@rad.example | Designer123! | ❌ 创建项目 |
| 客户 | client@rad.example | Client123! | ❌ 创建项目 |

---

## 🔧 **常见问题解决**

### ❌ **问题1: 环境文件复制失败**

**解决方案:**
```bash
# 手动创建 .env.local 文件
touch .env.local

# 手动添加内容
echo "DATABASE_URL=file:./dev.db" >> .env.local
echo "NEXTAUTH_SECRET=your-secret-key" >> .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
```

### ❌ **问题2: 端口被占用**

**解决方案:**
```bash
# 使用不同端口启动
npm run dev -- -p 3001
```

### ❌ **问题3: 数据库连接失败**

**解决方案:**
```bash
# 重新生成数据库
npx prisma migrate dev --name init
npm run seed
```

### ❌ **问题4: 依赖安装失败**

**解决方案:**
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🔄 **Git操作 (main分支)**

### 拉取最新更改
```bash
git pull origin main
```

### 查看当前分支
```bash
git branch
```

### 切换到main分支
```bash
git checkout main
```

### 查看提交历史
```bash
git log --oneline -10
```

---

## 📁 **项目结构**

```
BKPM/
├── .env.example          # 环境变量模板
├── .env.local            # 本地环境变量 (需要创建)
├── package.json          # 项目依赖
├── prisma/               # 数据库配置
│   ├── schema.prisma     # 数据模型
│   └── seed.ts          # 种子数据
├── src/                  # 源代码
│   ├── app/             # Next.js页面
│   ├── components/      # React组件
│   └── lib/             # 工具库
└── public/              # 静态资源
```

---

## 🎯 **快速开始命令**

```bash
# 1. 克隆项目
git clone https://github.com/nyo95/BKPM.git
cd BKPM

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.example .env.local

# 4. 初始化数据库
npx prisma migrate dev && npm run seed

# 5. 启动项目
npm run dev
```

---

## 🚨 **重要提醒**

1. **不要提交 .env.local 文件到Git**
2. **确保 .env.local 在 .gitignore 中**
3. **使用强密码作为 NEXTAUTH_SECRET**
4. **定期运行 git pull origin main 获取更新**

---

**🎉 设置完成后，Timeline Manager就可以在本地运行了！**