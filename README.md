# TeachAI Agent Web

TeachAIAgent 的前端工作台。开发阶段 1 已完成登录、注册、会话恢复、受保护应用壳与响应式导航。

## 技术栈

| 组件 | 版本 |
| --- | --- |
| Node.js | 16.16.0 |
| Next.js | 13.5.11 |
| React | 18.2.0 |
| TypeScript | 5.4.5 |
| Tailwind CSS | 3.4.17 |
| Zustand | 4.5.5 |
| TanStack Query | 4.36.1 |
| react-hook-form | 7.51.5 |
| Zod | 3.23.8 |
| Vitest | 0.34.6 |

## 启动

先启动 `teachai-agent-api`项目，再进行执行：

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

默认访问 `http://localhost:3000`，API 地址为：http://localhost:8000/api/v1

## 页面

| 路径 | 内容 |
| --- | --- |
| `/login` | 登录与注册 |
| `/library` | 课程档案与深色课堂预演 |
| `/create` | 课程编辑骨架 |
| `/knowledge` | 素材书架与检索设计 |
| `/settings` | 账户、会话安全、服务与模型状态 |

登录后 access token 只保存在内存中。页面加载时通过 HttpOnly refresh cookie 恢复会话，刷新请求自动携带 CSRF 双提交令牌。受保护路由在客户端守卫中等待会话恢复，未登录会回到登录页。

## 验证

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Vitest 当前覆盖登录表单校验、成功跳转、注册密码策略与错误提示。

## 视觉方向

- 纸张、批注红与墨绿构成教师备课手稿的视觉语言。
- 工作台保持浅色编辑感，课堂预演区使用深色沉浸背景。
- 桌面使用固定侧栏，移动端使用底部导航与安全区适配。
- 字体与动画尊重 `prefers-reduced-motion`。

## 后续

阶段 2 将接入课程、文件夹、素材上传和中文检索。阶段 4 引入 `@openmaic/dsl@0.12.0`，自研课程渲染器与课堂动作。
