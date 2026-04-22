// Frontend API client for GCSS billing endpoints.

function getApiBase(): string {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.headers || {}),
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed (${res.status})`);
    }
    return (await res.json()) as T;
}

// ── Catalog types ──────────────────────────────────────────────────────

export type BillingCycle = {
    id: number;
    years: number;
    labelEn: string;
    labelZh: string;
    multiplier: number;
    isActive: boolean;
    sortOrder: number;
};

export type SupportTier = {
    id: number;
    labelEn: string;
    labelZh: string;
    descriptionEn: string;
    descriptionZh: string;
    priceCents: number;
    pricingType: 'fixed' | 'per_day' | 'per_month';
    isActive: boolean;
    sortOrder: number;
};

export type ServerTier = {
    id: number;
    labelEn: string;
    labelZh: string;
    maxChargers: number;
    priceCents: number;
    isActive: boolean;
    sortOrder: number;
};

export type PromoCode = {
    id: number;
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    isActive: boolean;
    maxRedemptions: number;
    redeemedCount: number;
    validFrom?: string;
    validUntil?: string;
    createdAt: string;
};

export type Catalog = {
    billingCycles: BillingCycle[];
    supportTiers: SupportTier[];
    serverTiers: ServerTier[];
};

export type Invoice = {
    id: number;
    orderId?: number;
    userId: number;
    invoiceNumber: string;
    provider: string;
    providerInvoiceId?: string;
    hostedInvoiceUrl?: string;
    productLabel: string;
    amountCents: number;
    currency: string;
    status: string;
    paidAt?: string;
    createdAt: string;
};

export type Order = {
    id: number;
    userId: number;
    orderNumber: string;
    billingCycleId?: number;
    supportTierId?: number;
    serverTierId?: number;
    promoCodeId?: number;
    productLabel: string;
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    currency: string;
    billingAddress: string;
    provider: string;
    providerSessionId?: string;
    providerPaymentId?: string;
    status: string;
    orderStage: string;
    serverStage: string;
    paidAt?: string;
    createdAt: string;
    updatedAt: string;
};

// ── Public catalog ─────────────────────────────────────────────────────

export async function apiGetCatalog(): Promise<Catalog> {
    return await fetchJson<Catalog>(`${getApiBase()}/products/catalog`, { method: 'GET' });
}

export async function apiApplyPromoCode(code: string): Promise<{
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
}> {
    return await fetchJson(`${getApiBase()}/promo-codes/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
}

// ── Checkout ───────────────────────────────────────────────────────────

export type CheckoutInput = {
    billingCycleId: number;
    supportTierId: number;
    serverTierId: number;
    supportDays?: number;
    promoCode?: string;
    billingAddress: Record<string, string>;
    provider: 'stripe' | 'pingxx' | 'paypal';
    successUrl: string;
    cancelUrl: string;
};

export async function apiCheckout(
    token: string,
    input: CheckoutInput
): Promise<{ url: string; sessionId: string; orderNumber: string }> {
    return await fetchJson(`${getApiBase()}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(input),
    });
}

// ── User invoices + orders ─────────────────────────────────────────────

export async function apiListInvoices(token: string): Promise<Invoice[]> {
    const res = await fetchJson<{ invoices: Invoice[] }>(`${getApiBase()}/user/invoices`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.invoices || [];
}

export async function apiListOrders(token: string): Promise<Order[]> {
    const res = await fetchJson<{ orders: Order[] }>(`${getApiBase()}/user/orders`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.orders || [];
}

export async function apiGetOrderByNumber(token: string, orderNumber: string): Promise<Order> {
    const res = await fetchJson<{ order: Order }>(`${getApiBase()}/user/orders/${encodeURIComponent(orderNumber)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.order;
}

export async function apiPayPalCapture(token: string, paypalOrderId: string): Promise<{ status: string; order: Order }> {
    return await fetchJson(`${getApiBase()}/billing/paypal/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paypalOrderId }),
    });
}

// ── Admin catalog ──────────────────────────────────────────────────────

export async function apiAdminListBillingCycles(token: string): Promise<BillingCycle[]> {
    const res = await fetchJson<{ items: BillingCycle[] }>(`${getApiBase()}/admin/products/billing-cycles`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.items || [];
}

export async function apiAdminSaveBillingCycle(token: string, b: Partial<BillingCycle>): Promise<BillingCycle> {
    const url = b.id ? `${getApiBase()}/admin/products/billing-cycles/${b.id}` : `${getApiBase()}/admin/products/billing-cycles`;
    const res = await fetchJson<{ item: BillingCycle }>(url, {
        method: b.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(b),
    });
    return res.item;
}

export async function apiAdminDeleteBillingCycle(token: string, id: number): Promise<void> {
    await fetchJson(`${getApiBase()}/admin/products/billing-cycles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function apiAdminListSupportTiers(token: string): Promise<SupportTier[]> {
    const res = await fetchJson<{ items: SupportTier[] }>(`${getApiBase()}/admin/products/support-tiers`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.items || [];
}

export async function apiAdminSaveSupportTier(token: string, t: Partial<SupportTier>): Promise<SupportTier> {
    const url = t.id ? `${getApiBase()}/admin/products/support-tiers/${t.id}` : `${getApiBase()}/admin/products/support-tiers`;
    const res = await fetchJson<{ item: SupportTier }>(url, {
        method: t.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(t),
    });
    return res.item;
}

export async function apiAdminDeleteSupportTier(token: string, id: number): Promise<void> {
    await fetchJson(`${getApiBase()}/admin/products/support-tiers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function apiAdminListServerTiers(token: string): Promise<ServerTier[]> {
    const res = await fetchJson<{ items: ServerTier[] }>(`${getApiBase()}/admin/products/server-tiers`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.items || [];
}

export async function apiAdminSaveServerTier(token: string, t: Partial<ServerTier>): Promise<ServerTier> {
    const url = t.id ? `${getApiBase()}/admin/products/server-tiers/${t.id}` : `${getApiBase()}/admin/products/server-tiers`;
    const res = await fetchJson<{ item: ServerTier }>(url, {
        method: t.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(t),
    });
    return res.item;
}

export async function apiAdminDeleteServerTier(token: string, id: number): Promise<void> {
    await fetchJson(`${getApiBase()}/admin/products/server-tiers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function apiAdminListPromoCodes(token: string): Promise<PromoCode[]> {
    const res = await fetchJson<{ items: PromoCode[] }>(`${getApiBase()}/admin/promo-codes`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.items || [];
}

export async function apiAdminSavePromoCode(token: string, p: Partial<PromoCode>): Promise<PromoCode> {
    const url = p.id ? `${getApiBase()}/admin/promo-codes/${p.id}` : `${getApiBase()}/admin/promo-codes`;
    const res = await fetchJson<{ item: PromoCode }>(url, {
        method: p.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(p),
    });
    return res.item;
}

export async function apiAdminDeletePromoCode(token: string, id: number): Promise<void> {
    await fetchJson(`${getApiBase()}/admin/promo-codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}
