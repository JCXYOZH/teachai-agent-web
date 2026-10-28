# TeachAI Agent Web

TeachAIAgent 的前端工作台。阶段 1 已完成登录、注册、会话恢复、受保护应用壳与响应式导航；阶段 2 已接入课程、文件夹、素材上传解析、中文检索与鉴权下载；阶段 3 已接入 Provider 配置、真实连接测试与本地/官方模型切换。

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

默认访问 `http://localhost:3000`，API 地址为：http://localhost:8000/api/v1。

若通过 `127.0.0.1` 或局域网地址打开页面，前端会把配置为 `localhost`/`127.0.0.1` 的 API 主机名同步为当前页面主机名，避免 refresh cookie 因主机名不同而无法恢复会话。部署到独立 API 域名时保留 `NEXT_PUBLIC_API_BASE_URL` 即可。

## 页面

| 路径 | 内容 |
| --- | --- |
| `/login` | 登录与注册 |
| `/library` | 课程与文件夹管理、搜索、深色课堂预演 |
| `/create` | 课程创建与归类 |
| `/knowledge` | 素材上传、解析预览、检索、编辑、下载与移除 |
| `/settings` | 账户、会话安全、服务状态与 Provider 配置 |

登录后 access token 只保存在内存中。页面加载时通过 HttpOnly refresh cookie 恢复会话，刷新请求自动携带 CSRF 双提交令牌。受保护路由在客户端守卫中等待会话恢复，未登录会回到登录页。

素材支持 PDF、DOCX、PPTX、Markdown 与 TXT，单个文件上限 50 MB。原文件写入 `E:\Backups\Data\TeachAIAgent` 下的 UUID 目录，数据库保存元数据与解析文本；下载经过鉴权 API，不公开静态目录。删除素材是软删除，物理文件由后端清理脚本按保留期处理。

## Provider 配置

设置页会读取 `/api/v1/providers`，支持 OpenAI、Anthropic、DeepSeek、Qwen、Kimi、GLM 与本地 llama.cpp。API Key 只写不读，已保存时仅显示末四位；Base URL、默认模型和默认 Provider 可以分别保存。连接测试会真实发送一次最小生成请求，并显示实际返回模型、延迟和发现的模型列表。

Qwen 可直接使用 DashScope 地址或自建 MaaS 兼容地址；`qwen3.8-omni-flash` 会以纯文本模态测试。配置格式与后端安全约束见 `teachai-agent-api/docs/providers.md`。

## 验证

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Vitest 当前覆盖登录表单校验、成功跳转、注册密码策略、错误提示、Provider 保存/测试/错误处理、素材格式化与 API 主机名解析。

## 视觉方向

- 纸张、批注红与墨绿构成教师备课手稿的视觉语言。
- 工作台保持浅色编辑感，课堂预演区使用深色沉浸背景。
- 桌面使用固定侧栏，移动端使用底部导航与安全区适配。
- 字体与动画尊重 `prefers-reduced-motion`。

## 后续

阶段 4 引入 `@openmaic/dsl@0.12.0`、自研课程渲染器与课堂动作。
