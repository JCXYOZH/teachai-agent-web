import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from '@/components/auth/login-form';
import { ApiError } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(),
}));

const authMocks = vi.hoisted(() => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  sendRegistrationCode: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
    refresh: navigation.refresh,
  }),
  useSearchParams: () => navigation.searchParams,
}));

vi.mock('@/lib/api/auth', () => authMocks);
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const session = {
  access_token: 'access-token',
  token_type: 'bearer' as const,
  expires_in: 900,
  user: {
    id: 'user-1',
    email: 'teacher@example.com',
    display_name: '林老师',
    created_at: '2026-10-27T00:00:00Z',
  },
};

describe('LoginForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
    navigation.replace.mockReset();
    navigation.refresh.mockReset();
    authMocks.loginUser.mockReset();
    authMocks.registerUser.mockReset();
    authMocks.sendRegistrationCode.mockReset();
  });

  it('shows field errors without calling the API', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /进入备课桌/ }));

    expect(await screen.findByText('请输入邮箱')).toBeInTheDocument();
    expect(await screen.findByText('请输入密码')).toBeInTheDocument();
    expect(authMocks.loginUser).not.toHaveBeenCalled();
  });

  it('logs in and returns to the requested page', async () => {
    authMocks.loginUser.mockResolvedValue(session);
    navigation.searchParams = new URLSearchParams('next=%2Fknowledge');
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: /进入备课桌/ }));

    await waitFor(() => {
      expect(authMocks.loginUser).toHaveBeenCalledWith({
        email: 'teacher@example.com',
        password: 'Teach1234',
      });
    });
    expect(navigation.replace).toHaveBeenCalledWith('/knowledge');
    navigation.searchParams = new URLSearchParams();
  });

  it('enforces the registration password policy', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.type(screen.getByLabelText('密码'), 'onlyletters');
    await user.click(screen.getByRole('button', { name: /验证并创建账号/ }));

    expect(await screen.findByText('密码需要包含数字')).toBeInTheDocument();
    expect(authMocks.registerUser).not.toHaveBeenCalled();
  });

  it('sends a code without creating the account', async () => {
    authMocks.sendRegistrationCode.mockResolvedValue({
      email: 'teacher@example.com',
      expires_in: 600,
      resend_after: 60,
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(
      await screen.findByText(/验证码已发送至 teacher@example\.com/),
    ).toBeInTheDocument();
    expect(authMocks.sendRegistrationCode).toHaveBeenCalledWith('teacher@example.com');
    expect(authMocks.registerUser).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '60 秒后重发' })).toBeDisabled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('registers with the emailed code in one submission', async () => {
    authMocks.sendRegistrationCode.mockResolvedValue({
      email: 'teacher@example.com',
      expires_in: 600,
      resend_after: 60,
    });
    authMocks.registerUser.mockResolvedValue(session);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.type(screen.getByLabelText(/你的称呼/), '林老师');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));
    expect(await screen.findByText(/验证码已发送至/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/验证码/), '123456');
    await user.click(screen.getByRole('button', { name: /验证并创建账号/ }));

    await waitFor(() => {
      expect(authMocks.registerUser).toHaveBeenCalledWith({
        email: 'teacher@example.com',
        password: 'Teach1234',
        display_name: '林老师',
        code: '123456',
      });
    });
    expect(navigation.replace).toHaveBeenCalledWith('/library');
  });

  it('shows the resend cooldown when a code was sent moments ago', async () => {
    authMocks.sendRegistrationCode.mockRejectedValue(
      new ApiError(429, 'VERIFICATION_RESEND_TOO_SOON', 'Please wait', {
        retry_after: 42,
      }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(await screen.findByText(/发送太频繁/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '42 秒后重发' })).toBeDisabled();
  });

  it('keeps the form open when the emailed code is rejected', async () => {
    authMocks.sendRegistrationCode.mockResolvedValue({
      email: 'teacher@example.com',
      expires_in: 600,
      resend_after: 60,
    });
    authMocks.registerUser.mockRejectedValue(
      new ApiError(400, 'INVALID_VERIFICATION_CODE', 'Invalid code'),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));
    expect(await screen.findByText(/验证码已发送至/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/验证码/), '123456');
    await user.click(screen.getByRole('button', { name: /验证并创建账号/ }));

    expect(await screen.findByText(/验证码不正确/)).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('shows a friendly message for invalid credentials', async () => {
    authMocks.loginUser.mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect'),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.type(screen.getByLabelText('密码'), 'Wrong1234');
    await user.click(screen.getByRole('button', { name: /进入备课桌/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('邮箱或密码不正确');
  });
});
