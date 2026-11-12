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
    phone: null,
    display_name: '林老师',
    created_at: '2026-10-27T00:00:00Z',
  },
};

const phoneCodeResponse = {
  channel: 'phone' as const,
  target: '138****8000',
  email: null,
  expires_in: 600,
  resend_after: 60,
};

const emailCodeResponse = {
  channel: 'email' as const,
  target: 'teacher@example.com',
  email: 'teacher@example.com',
  expires_in: 600,
  resend_after: 60,
};

describe('LoginForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
    navigation.replace.mockReset();
    navigation.refresh.mockReset();
    navigation.searchParams = new URLSearchParams();
    authMocks.loginUser.mockReset();
    authMocks.registerUser.mockReset();
    authMocks.sendRegistrationCode.mockReset();
  });

  it('shows field errors without calling the API', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /进入备课桌/ }));

    expect(await screen.findByText('请输入手机号或邮箱')).toBeInTheDocument();
    expect(await screen.findByText('请输入密码')).toBeInTheDocument();
    expect(authMocks.loginUser).not.toHaveBeenCalled();
  });

  it('logs in with the identifier field and returns to the requested page', async () => {
    authMocks.loginUser.mockResolvedValue(session);
    navigation.searchParams = new URLSearchParams('next=%2Fknowledge');
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('手机号或邮箱'), 'teacher@example.com');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: /进入备课桌/ }));

    await waitFor(() => {
      expect(authMocks.loginUser).toHaveBeenCalledWith({
        identifier: 'teacher@example.com',
        password: 'Teach1234',
      });
    });
    expect(navigation.replace).toHaveBeenCalledWith('/knowledge');
  });

  it('logs in with a phone number', async () => {
    authMocks.loginUser.mockResolvedValue(session);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('手机号或邮箱'), '13800138000');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: /进入备课桌/ }));

    await waitFor(() => {
      expect(authMocks.loginUser).toHaveBeenCalledWith({
        identifier: '13800138000',
        password: 'Teach1234',
      });
    });
    expect(navigation.replace).toHaveBeenCalledWith('/library');
  });

  it('rejects identifiers that are neither phone nor email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('手机号或邮箱'), 'not-a-phone');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: /进入备课桌/ }));

    expect(await screen.findByText('请输入手机号或邮箱')).toBeInTheDocument();
    expect(authMocks.loginUser).not.toHaveBeenCalled();
  });

  it('enforces the registration password policy', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('手机号'), '13800138000');
    await user.type(screen.getByLabelText('密码'), 'onlyletters');
    await user.click(screen.getByRole('button', { name: /验证并创建账号/ }));

    expect(await screen.findByText('密码需要包含数字')).toBeInTheDocument();
    expect(authMocks.registerUser).not.toHaveBeenCalled();
  });

  it('rejects an invalid phone number before requesting a code', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('手机号'), '12345');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(await screen.findByText('请输入 11 位手机号')).toBeInTheDocument();
    expect(authMocks.sendRegistrationCode).not.toHaveBeenCalled();
  });

  it('sends a phone code without creating the account', async () => {
    authMocks.sendRegistrationCode.mockResolvedValue(phoneCodeResponse);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('手机号'), '138 0013 8000');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(
      await screen.findByText(/验证码已发送至 138\*\*\*\*8000/),
    ).toBeInTheDocument();
    expect(authMocks.sendRegistrationCode).toHaveBeenCalledWith(
      '13800138000',
      'phone',
    );
    expect(authMocks.registerUser).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '60 秒后重发' })).toBeDisabled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('registers with the phone code in one submission', async () => {
    authMocks.sendRegistrationCode.mockResolvedValue(phoneCodeResponse);
    authMocks.registerUser.mockResolvedValue(session);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('手机号'), '13800138000');
    await user.type(screen.getByLabelText(/你的称呼/), '林老师');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));
    expect(await screen.findByText(/验证码已发送至/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/验证码/), '123456');
    await user.click(screen.getByRole('button', { name: /验证并创建账号/ }));

    await waitFor(() => {
      expect(authMocks.registerUser).toHaveBeenCalledWith({
        phone: '13800138000',
        password: 'Teach1234',
        display_name: '林老师',
        code: '123456',
      });
    });
    expect(navigation.replace).toHaveBeenCalledWith('/library');
  });

  it('switches to email registration through the small text toggle', async () => {
    authMocks.sendRegistrationCode.mockResolvedValue(emailCodeResponse);
    authMocks.registerUser.mockResolvedValue(session);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    expect(screen.getByLabelText('手机号')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '使用邮箱注册' }));
    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(await screen.findByText(/验证码已发送至/)).toBeInTheDocument();
    expect(authMocks.sendRegistrationCode).toHaveBeenCalledWith(
      'teacher@example.com',
      'email',
    );

    await user.type(screen.getByLabelText(/验证码/), '123456');
    await user.click(screen.getByRole('button', { name: /验证并创建账号/ }));

    await waitFor(() => {
      expect(authMocks.registerUser).toHaveBeenCalledWith({
        email: 'teacher@example.com',
        password: 'Teach1234',
        display_name: undefined,
        code: '123456',
      });
    });
  });

  it('switches back to phone registration and clears an incompatible contact', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.click(screen.getByRole('button', { name: '使用邮箱注册' }));
    await user.type(screen.getByLabelText('邮箱'), 'teacher@example.com');
    await user.click(screen.getByRole('button', { name: '使用手机号注册' }));

    expect(screen.getByLabelText('手机号')).toHaveValue('');
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
    await user.type(screen.getByLabelText('手机号'), '13800138000');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(await screen.findByText(/发送太频繁/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '42 秒后重发' })).toBeDisabled();
  });

  it('starts the resend cooldown when the SMS send limit is hit', async () => {
    authMocks.sendRegistrationCode.mockRejectedValue(
      new ApiError(429, 'SMS_SEND_RATE_LIMITED', 'Too many requests', {
        retry_after: 55,
      }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('手机号'), '13800138000');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(await screen.findByText(/发送太频繁/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '55 秒后重发' })).toBeDisabled();
  });

  it('keeps the form open when the phone code is rejected', async () => {
    authMocks.sendRegistrationCode.mockResolvedValue(phoneCodeResponse);
    authMocks.registerUser.mockRejectedValue(
      new ApiError(400, 'INVALID_VERIFICATION_CODE', 'Invalid code'),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('手机号'), '13800138000');
    await user.type(screen.getByLabelText('密码'), 'Teach1234');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));
    expect(await screen.findByText(/验证码已发送至/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/验证码/), '123456');
    await user.click(screen.getByRole('button', { name: /验证并创建账号/ }));

    expect(await screen.findByText(/验证码不正确/)).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('reports a registered phone as a form error', async () => {
    authMocks.sendRegistrationCode.mockRejectedValue(
      new ApiError(409, 'PHONE_ALREADY_REGISTERED', 'Phone exists'),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: '创建账号' }));
    await user.type(screen.getByLabelText('手机号'), '13800138000');
    await user.click(screen.getByRole('button', { name: '发送验证码' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('这个手机号已经注册');
  });

  it('shows a friendly message for invalid credentials', async () => {
    authMocks.loginUser.mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Credentials are incorrect'),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('手机号或邮箱'), 'teacher@example.com');
    await user.type(screen.getByLabelText('密码'), 'Wrong1234');
    await user.click(screen.getByRole('button', { name: /进入备课桌/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '手机号/邮箱或密码不正确',
    );
  });
});
