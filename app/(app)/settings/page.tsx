'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Cpu,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCcw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logoutUser } from '@/lib/api/auth';
import { API_BASE_URL, ApiError } from '@/lib/api/client';
import { fetchHealth } from '@/lib/api/health';
import { useAuthStore } from '@/lib/stores/auth-store';

const providers = ['OpenAI', 'Anthropic', 'DeepSeek', 'Qwen', 'GLM', 'Kimi'];

function initials(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? 'T';
}

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      toast.success('已退出当前会话');
      router.replace('/login');
    } catch {
      toast.error('服务暂时无法确认退出，本地会话已清除');
    } finally {
      setLoggingOut(false);
    }
  };

  const healthOnline = health.data?.status === 'ok';
  const healthError = health.error instanceof ApiError ? health.error.message : '无法连接服务';

  return (
    <div className='mx-auto max-w-5xl space-y-6'>
      <section className='grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]'>
        <div className='paper-card p-6 sm:p-8'>
          <div className='flex items-center justify-between'>
            <p className='eyebrow'>Account / 账户</p>
            <Badge tone='sage'>Active</Badge>
          </div>
          <div className='mt-8 flex items-center gap-5'>
            <span className='flex h-16 w-16 shrink-0 items-center justify-center border border-sage/50 bg-sage/15 font-display text-2xl text-ink'>
              {initials(user?.display_name ?? 'TeachAI')}
            </span>
            <div className='min-w-0'>
              <h2 className='truncate font-display text-2xl font-medium tracking-[-0.03em] text-ink'>
                {user?.display_name}
              </h2>
              <p className='mt-1 truncate font-mono text-[0.65rem] text-ink/45'>{user?.email}</p>
            </div>
          </div>

          <dl className='mt-8 divide-y divide-ink/10 border-y border-ink/10'>
            <div className='flex items-center justify-between gap-4 py-4'>
              <dt className='text-xs text-ink/40'>加入时间</dt>
              <dd className='font-mono text-[0.65rem] text-ink/55'>{user?.created_at.slice(0, 10)}</dd>
            </div>
            <div className='flex items-center justify-between gap-4 py-4'>
              <dt className='text-xs text-ink/40'>账户范围</dt>
              <dd className='text-xs text-ink/55'>仅本人可见的课程与素材</dd>
            </div>
          </dl>

          <Button
            type='button'
            variant='outline'
            className='mt-7'
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? <Loader2 className='h-4 w-4 animate-spin' /> : <LogOut className='h-4 w-4' />}
            退出登录
          </Button>
        </div>

        <div className='border border-ink/10 bg-paper/30 p-6 sm:p-8'>
          <div className='flex items-center justify-between'>
            <p className='eyebrow'>Security / 会话</p>
            <ShieldCheck className='h-4 w-4 text-sage' strokeWidth={1.6} />
          </div>
          <div className='mt-6 space-y-5'>
            <div className='flex gap-3'>
              <KeyRound className='mt-0.5 h-4 w-4 shrink-0 text-ink/35' />
              <div>
                <p className='text-xs text-ink/65'>Access token</p>
                <p className='mt-1 text-[0.7rem] leading-5 text-ink/35'>只保存在当前页面内存，默认 15 分钟。</p>
              </div>
            </div>
            <div className='flex gap-3'>
              <RefreshCcw className='mt-0.5 h-4 w-4 shrink-0 text-ink/35' />
              <div>
                <p className='text-xs text-ink/65'>Refresh token</p>
                <p className='mt-1 text-[0.7rem] leading-5 text-ink/35'>HttpOnly cookie，每次刷新都会轮换。</p>
              </div>
            </div>
            <div className='flex gap-3'>
              <ShieldCheck className='mt-0.5 h-4 w-4 shrink-0 text-ink/35' />
              <div>
                <p className='text-xs text-ink/65'>CSRF 双提交</p>
                <p className='mt-1 text-[0.7rem] leading-5 text-ink/35'>刷新与登出请求必须携带会话绑定的令牌。</p>
              </div>
            </div>
          </div>
          <p className='margin-note mt-7'>如果在公共设备上使用，离开前请退出登录。</p>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]'>
        <div className='paper-card p-6 sm:p-8'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <Server className='h-4 w-4 text-ink/40' />
              <p className='eyebrow'>Runtime / 服务状态</p>
            </div>
            <span className='flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/45'>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  health.isLoading ? 'bg-ochre' : healthOnline ? 'bg-sage' : 'bg-ember'
                }`}
              />
              {health.isLoading ? 'Checking' : healthOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className='mt-6 divide-y divide-ink/10 border-y border-ink/10'>
            <div className='flex items-center justify-between gap-4 py-4'>
              <span className='text-xs text-ink/40'>API</span>
              <span className='max-w-[65%] truncate font-mono text-[0.62rem] text-ink/55'>{API_BASE_URL}</span>
            </div>
            <div className='flex items-center justify-between gap-4 py-4'>
              <span className='text-xs text-ink/40'>Version</span>
              <span className='font-mono text-[0.62rem] text-ink/55'>{health.data?.version ?? '—'}</span>
            </div>
            <div className='flex items-center justify-between gap-4 py-4'>
              <span className='text-xs text-ink/40'>Environment</span>
              <span className='font-mono text-[0.62rem] text-ink/55'>{health.data?.environment ?? '—'}</span>
            </div>
          </div>
          {health.isError && <p className='mt-4 text-xs text-ember-dark'>{healthError}</p>}
        </div>

        <div className='border border-ink/10 bg-paper/30 p-6 sm:p-8'>
          <div className='flex items-center gap-3'>
            <Cpu className='h-4 w-4 text-ink/40' />
            <p className='eyebrow'>Models / 模型</p>
          </div>
          <div className='mt-6'>
            <p className='text-sm text-ink/70'>Qwen3.6-35B-A3B</p>
            <p className='mt-1 text-[0.7rem] text-ink/35'>本地 llama.cpp · 32K context</p>
          </div>
          <div className='mt-4 flex items-center gap-2'>
            <Badge tone='ember'>Phase 3</Badge>
            <span className='text-[0.65rem] text-ink/35'>Provider 路由即将接入</span>
          </div>
          <div className='mt-6 border-t border-ink/10 pt-5'>
            <p className='font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/30'>Official providers</p>
            <div className='mt-3 flex flex-wrap gap-2'>
              {providers.map((provider) => (
                <Badge key={provider}>{provider}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className='flex flex-col justify-between gap-2 border-t border-ink/10 pt-5 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/25 sm:flex-row sm:items-center'>
        <span>TeachAIAgent / Phase 1</span>
        <span>Auth · PostgreSQL · FastAPI</span>
      </div>
    </div>
  );
}
