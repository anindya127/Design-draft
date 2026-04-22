'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type CaptchaProvider = 'none' | 'turnstile' | 'tencent';

export type CaptchaValue =
  | { provider: 'turnstile'; token: string }
  | { provider: 'tencent'; ticket: string; randstr: string }
  | null;

type Props = {
  provider: CaptchaProvider;
  turnstileSiteKey?: string;
  tencentAppId?: string;
  onChange: (value: CaptchaValue) => void;
  disabled?: boolean;
  strings: {
    verify: string;
    verified: string;
    loading: string;
    errorGeneric: string;
  };
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, any>) => string | number;
      reset: (widgetId?: string | number) => void;
    };
    TencentCaptcha?: new (
      appId: string,
      cb: (res: { ret: number; ticket?: string; randstr?: string; msg?: string }) => void,
      opts?: Record<string, any>
    ) => { show: () => void };
  }
}

function ensureScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve();
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.getAttribute('data-loaded') === '1') return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.defer = true;
    s.addEventListener(
      'load',
      () => {
        s.setAttribute('data-loaded', '1');
        resolve();
      },
      { once: true }
    );
    s.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.appendChild(s);
  });
}

export default function CaptchaWidget({
  provider,
  turnstileSiteKey,
  tencentAppId,
  onChange,
  disabled,
  strings,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'verified' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string>('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | number | null>(null);
  const tencentInstanceRef = useRef<{ show: () => void } | null>(null);

  const canRenderTurnstile = provider === 'turnstile' && !!turnstileSiteKey;
  const canUseTencent = provider === 'tencent' && !!tencentAppId;

  const label = useMemo(() => {
    if (status === 'loading') return strings.loading;
    if (status === 'verified') return strings.verified;
    return strings.verify;
  }, [status, strings.loading, strings.verified, strings.verify]);

  useEffect(() => {
    // Reset whenever provider changes.
    setStatus('idle');
    setErrorText('');
    onChange(null);

    if (provider === 'none') return;

    if (provider === 'turnstile') {
      if (!turnstileSiteKey) return;
      let cancelled = false;

      const run = async () => {
        try {
          setStatus('loading');
          await ensureScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', 'gcss-turnstile');
          if (cancelled) return;
          if (!containerRef.current) return;
          if (!window.turnstile?.render) throw new Error('Turnstile not available');

          // Clear old content before rendering.
          containerRef.current.innerHTML = '';

          const widgetId = window.turnstile.render(containerRef.current, {
            sitekey: turnstileSiteKey,
            callback: (token: string) => {
              setErrorText('');
              setStatus('verified');
              onChange({ provider: 'turnstile', token });
            },
            'error-callback': () => {
              setStatus('error');
              setErrorText(strings.errorGeneric);
              onChange(null);
            },
            'expired-callback': () => {
              setStatus('idle');
              onChange(null);
            },
          });
          turnstileWidgetIdRef.current = widgetId;
        } catch {
          if (cancelled) return;
          setStatus('error');
          setErrorText(strings.errorGeneric);
          onChange(null);
        }
      };

      void run();
      return () => {
        cancelled = true;
        try {
          if (turnstileWidgetIdRef.current != null && window.turnstile?.reset) {
            window.turnstile.reset(turnstileWidgetIdRef.current);
          }
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      };
    }

    if (provider === 'tencent') {
      if (!tencentAppId) return;
      let cancelled = false;
      const run = async () => {
        try {
          setStatus('idle');
          await ensureScript('https://ssl.captcha.qq.com/TCaptcha.js', 'gcss-tencent-captcha');
          if (cancelled) return;
          if (!window.TencentCaptcha) throw new Error('TencentCaptcha not available');

          tencentInstanceRef.current = new window.TencentCaptcha(
            tencentAppId,
            (res) => {
              if (res?.ret === 0 && res.ticket && res.randstr) {
                setErrorText('');
                setStatus('verified');
                onChange({ provider: 'tencent', ticket: res.ticket, randstr: res.randstr });
                return;
              }
              // User cancelled or failure.
              setStatus('idle');
              onChange(null);
              if (res?.ret && res.ret !== 2) {
                setErrorText(res.msg || strings.errorGeneric);
              }
            },
            { needFeedBack: 0 }
          );
        } catch {
          if (cancelled) return;
          setStatus('error');
          setErrorText(strings.errorGeneric);
          onChange(null);
        }
      };

      void run();
      return () => {
        cancelled = true;
        tencentInstanceRef.current = null;
      };
    }
  }, [provider, turnstileSiteKey, tencentAppId, onChange, strings.errorGeneric]);

  if (provider === 'none') return null;

  if (provider === 'turnstile') {
    if (!turnstileSiteKey) return null;
    return (
      <div>
        <div ref={containerRef} />
        {status === 'error' && errorText ? <div className="form-help form-help--error">{errorText}</div> : null}
      </div>
    );
  }

  if (provider === 'tencent') {
    if (!tencentAppId) return null;
    return (
      <div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setErrorText('');
            setStatus('loading');
            try {
              tencentInstanceRef.current?.show();
            } finally {
              // Tencent shows a modal; switch back to idle until callback confirms.
              setStatus('idle');
            }
          }}
          disabled={!!disabled}
        >
          {label}
        </button>
        {status === 'verified' ? <div className="form-help form-help--success">{strings.verified}</div> : null}
        {errorText ? <div className="form-help form-help--error">{errorText}</div> : null}
      </div>
    );
  }

  return null;
}
