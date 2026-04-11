import type { ReactNode } from 'react';

// Inline SVG logos for the homepage "Global Payment Matrix" section.
// Keyed by brand name so region definitions can reference them by string.
export const PAYMENT_ICONS: Record<string, ReactNode> = {
  Visa: (
    <svg width="40" height="14" viewBox="0 0 40 14">
      <path d="M16.2 0.5L13.5 13.5H10.8L13.5 0.5H16.2ZM27.8 8.8L29.2 4.9L30 8.8H27.8ZM30.8 13.5H33.5L31.2 0.5H28.9C28.3 0.5 27.8 0.9 27.5 1.4L23.2 13.5H26L26.6 11.6H30L30.8 13.5ZM23.5 9.1C23.5 5.5 18.5 5.3 18.5 3.7C18.5 3.2 19 2.6 20.1 2.5C20.6 2.4 22.1 2.4 23.6 3.1L24.2 0.9C23.4 0.6 22.3 0.3 21 0.3C18.3 0.3 16.4 1.7 16.4 3.8C16.4 5.4 17.8 6.2 18.9 6.8C20 7.3 20.4 7.7 20.3 8.2C20.3 9 19.3 9.3 18.4 9.3C16.8 9.3 15.8 8.9 15.1 8.6L14.5 10.8C15.2 11.1 16.6 11.4 18 11.4C20.9 11.4 23.5 10.1 23.5 9.1ZM10.2 0.5L6 13.5H3.2L1.2 2.7C1.1 2.2 1 2 0.5 1.7C-0.2 1.3 0.8 1 0.8 1L1.2 0.8L4.5 0.5L7.2 10.1L10.2 0.5Z" fill="#1A1F71" />
    </svg>
  ),
  Mastercard: (
    <svg width="36" height="22" viewBox="0 0 36 22">
      <circle cx="13" cy="11" r="10" fill="#EB001B" />
      <circle cx="23" cy="11" r="10" fill="#F79E1B" />
      <path d="M18 3.2a10 10 0 010 15.6 10 10 0 000-15.6z" fill="#FF5F00" />
    </svg>
  ),
  PayPal: (
    <svg width="20" height="22" viewBox="0 0 20 24">
      <path d="M16.6 3.3C15.8 2.3 14.2 1.8 12 1.8H5.4c-.5 0-.9.3-1 .8L2 18.7c0 .4.3.7.6.7h4.5l1.1-7.1-.1.2c.1-.5.5-.8 1-.8h2c4 0 7.1-1.6 8-6.3v-.4c-.1 0-.1 0 0 0 .2-1.5 0-2.5-.5-3.7z" fill="#003087" />
      <path d="M17.1 7.1c-.9 4.7-4 6.3-8 6.3h-2c-.5 0-.9.3-1 .8L4.8 22c0 .3.2.6.5.6h3.8c.4 0 .8-.3.8-.7l.8-5.1c.1-.4.5-.7.9-.7h.5c3.5 0 6.3-1.4 7.1-5.6.3-1.7.2-3.1-.6-4.1-.1-.1-.3-.2-.5-.3z" fill="#0070E0" />
    </svg>
  ),
  Alipay: (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#1677FF" />
      <path d="M18.5 15.2c-1.8-.7-3.8-1.6-4.2-1.8.8-1.2 1.4-2.6 1.8-4.2h-3.4V7.8h4.2V7h-4.2V4.8h-1.6c-.2 0-.3.1-.3.3V7H6.7v.8h4.1v1.4H7.4v.8h6.8c-.3 1-1 2.2-1.8 3.2-1.3-.8-2.8-1.4-4.4-1.6-2.3-.3-3.6.8-3.8 2 0 1.6 1.4 2.8 3.8 2.4 1.4-.2 2.8-1 4-2.2 1.2.8 4.6 2.2 6 2.8V15.2z" fill="white" />
    </svg>
  ),
  'WeChat Pay': (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#07C160" />
      <path d="M15.6 8.4c-.2 0-.4 0-.6.1.1-.4.1-.7.1-1.1 0-3-2.7-5.4-6-5.4S3.1 4.4 3.1 7.4c0 1.7 1 3.3 2.5 4.3l-.6 1.9 2.2-1.1c.6.2 1.2.3 1.9.3h.3c-.1-.4-.2-.8-.2-1.2 0-2.7 2.4-4.8 5.4-4.8.3 0 .7 0 1-.1zM7.4 5.5c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9zm4.2 0c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9zm4 9.7l1.8.9-.5-1.5c1.2-.8 2-2 2-3.4 0-2.4-2.2-4.3-4.8-4.3s-4.8 1.9-4.8 4.3 2.2 4.3 4.8 4.3c.6 0 1.1-.1 1.5-.3zm-2.4-4.7c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7zm3.4 0c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z" fill="white" />
    </svg>
  ),
  'Apple Pay': (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#000" />
      <path d="M15.2 6.4c.5-.6.8-1.5.7-2.4-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.4-.8 2.3.8.1 1.6-.4 2.2-1zm.7 1.2c-1.2-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.6-1.3 0-2.5.8-3.1 1.9-1.3 2.3-.4 5.6 1 7.4.6.9 1.4 1.9 2.4 1.9 1 0 1.3-.6 2.5-.6 1.1 0 1.4.6 2.5.6s1.7-1 2.3-1.9c.7-1.1 1-2.1 1-2.2-1.1-.4-2-1.6-2-3 0-1.2.7-2.3 1.7-2.9-.7-.9-1.7-1.3-2.9-1.3z" fill="white" />
    </svg>
  ),
  'Google Pay': (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
      <path d="M12.2 11.8v2.4h3.4c-.2 1-1.3 3-3.4 3-2 0-3.7-1.7-3.7-3.8s1.7-3.8 3.7-3.8c1.2 0 1.9.5 2.4 1l1.6-1.6C15.1 8 13.8 7.2 12.2 7.2 9 7.2 6.4 9.8 6.4 13s2.6 5.8 5.8 5.8c3.3 0 5.6-2.4 5.6-5.7 0-.4 0-.7-.1-1h-5.5z" fill="#4285F4" />
    </svg>
  ),
  Stripe: (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#635BFF" />
      <path d="M11 8.2c0-.6.5-.9 1.3-.9.9 0 2 .3 2.9.8V5.6c-1-.4-2-.5-2.9-.5-2.4 0-4 1.3-4 3.4 0 3.3 4.6 2.8 4.6 4.2 0 .7-.6 1-1.5 1-1 0-2.3-.4-3.4-1v2.6c1.2.5 2.3.7 3.4.7 2.5 0 4.2-1.2 4.2-3.4 0-3.6-4.6-3-4.6-4.4z" fill="white" />
    </svg>
  ),
  GrabPay: <TextLogo bg="#00B14F" fg="white" text="G" fontSize={8} />,
  TrueMoney: <TextLogo bg="#F37021" fg="white" text="TM" fontSize={7} />,
  GCash: <TextLogo bg="#007DFE" fg="white" text="GC" fontSize={7} />,
  'M-PESA': <TextLogo bg="#4DB848" fg="white" text="M-P" fontSize={6} />,
  Neosurf: <TextLogo bg="#E31937" fg="white" text="NS" fontSize={6} />,
  Skrill: <TextLogo bg="#862165" fg="white" text="S" fontSize={7} />,
  PIX: (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#32BCAD" />
      <path d="M14.5 8.5l-2.5 2.5-2.5-2.5L7 11l2.5 2.5L7 16l2.5 2.5L12 16l2.5 2.5L17 16l-2.5-2.5L17 11l-2.5-2.5z" fill="white" />
    </svg>
  ),
  JCB: <TextLogo bg="#0E4C96" fg="white" text="JCB" fontSize={7} fontWeight={800} />,
  // New additions for the regional layout
  DragonPay: <TextLogo bg="#003E7E" fg="white" text="DP" fontSize={7} />,
  Boost: <TextLogo bg="#EE2E24" fg="white" text="B" fontSize={8} />,
  SEPA: <TextLogo bg="#00458B" fg="white" text="SEPA" fontSize={5} fontWeight={800} />,
  TrustPay: <TextLogo bg="#00A1DE" fg="white" text="TP" fontSize={7} />,
};

function TextLogo({
  bg,
  fg,
  text,
  fontSize,
  fontWeight = 700,
}: {
  bg: string;
  fg: string;
  text: string;
  fontSize: number;
  fontWeight?: number;
}) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill={bg} />
      <text x="12" y="15" textAnchor="middle" fill={fg} fontSize={fontSize} fontWeight={fontWeight}>
        {text}
      </text>
    </svg>
  );
}

// Regions in the order they appear on the homepage.
export const PAYMENT_REGIONS: { id: string; methods: string[] }[] = [
  {
    id: 'asia',
    methods: ['Alipay', 'WeChat Pay', 'GrabPay', 'GCash', 'TrueMoney', 'DragonPay', 'Boost', 'JCB'],
  },
  { id: 'europe', methods: ['Stripe', 'SEPA', 'TrustPay', 'Skrill', 'Neosurf'] },
  { id: 'oceania', methods: ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'] },
  { id: 'africa', methods: ['M-PESA', 'PayPal'] },
  { id: 'southAmerica', methods: ['PIX', 'Visa', 'Mastercard'] },
  { id: 'northAmerica', methods: ['Stripe', 'Apple Pay', 'Google Pay', 'PayPal'] },
];
