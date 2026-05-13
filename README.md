# 💊 MedControl

Microsaas de controle de medicamentos com alertas inteligentes, modo cuidador e relatório PDF para médicos.

## 🚀 Deploy rápido (Supabase + Vercel + GitHub)

### 1. Supabase — Banco de dados

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute o arquivo `supabase-schema.sql` completo
3. Vá em **Storage** → verifique que o bucket `medication-photos` foi criado
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (Settings > API) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. VAPID Keys — Notificações Push

```bash
npx web-push generate-vapid-keys
```

Copie as chaves geradas para as variáveis de ambiente.

### 3. GitHub — Repositório

```bash
git init
git add .
git commit -m "feat: MedControl initial setup"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/medcontrol.git
git push -u origin main
```

### 4. Vercel — Deploy

1. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repositório
2. Configure as **Environment Variables**:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave pública VAPID |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID |
| `VAPID_EMAIL` | `mailto:seu@email.com` |
| `NEXT_PUBLIC_APP_URL` | URL do Vercel (ex: `https://medcontrol.vercel.app`) |
| `CRON_SECRET` | Qualquer string secreta aleatória |

3. Clique em **Deploy** ✅

### 5. Ícones PWA (após deploy)

Crie os ícones e coloque em `/public/icons/`:
- `icon-192x192.png`
- `icon-512x512.png`
- `badge-72x72.png`

Use [favicon.io](https://favicon.io) ou [realfavicongenerator.net](https://realfavicongenerator.net)

---

## 💳 Integração Asaas (quando ativar pagamentos)

A estrutura está pronta. Para ativar:

1. Crie conta em [asaas.com](https://www.asaas.com)
2. Adicione no `.env`:
   ```
   ASAAS_API_KEY=seu_token_aqui
   ASAAS_WEBHOOK_SECRET=string_secreta
   NEXT_PUBLIC_ASAAS_ENV=sandbox  # depois: production
   ```
3. Crie a rota `/api/payment/create-subscription` (template abaixo)
4. Configure o webhook no painel Asaas apontando para:
   `https://seu-dominio.vercel.app/api/webhooks/asaas`

### Template da rota de assinatura:

```typescript
// src/app/api/payment/create-subscription/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user!.id).single()

  // 1. Criar ou recuperar cliente Asaas
  const baseUrl = process.env.NEXT_PUBLIC_ASAAS_ENV === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'

  let customerId = profile.asaas_customer_id
  if (!customerId) {
    const res = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY!,
      },
      body: JSON.stringify({
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
      }),
    })
    const customer = await res.json()
    customerId = customer.id
    await supabase.from('profiles')
      .update({ asaas_customer_id: customerId }).eq('id', user!.id)
  }

  // 2. Criar cobrança/assinatura
  const res = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD', // ou PIX, BOLETO
      value: 19.90,
      nextDueDate: new Date().toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description: 'MedControl Pro — Assinatura Mensal',
    }),
  })
  const subscription = await res.json()

  return NextResponse.json({ paymentUrl: subscription.invoiceUrl })
}
```

---

## 🏗️ Arquitetura

```
medcontrol/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout + PWA
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Nav + Header
│   │   │   ├── page.tsx                # Doses de hoje
│   │   │   ├── medications/
│   │   │   │   ├── page.tsx            # Lista de medicamentos
│   │   │   │   ├── new/page.tsx        # Cadastrar medicamento
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Detalhe do medicamento
│   │   │   │       └── edit/page.tsx   # Editar medicamento
│   │   │   ├── history/page.tsx        # Calendário + PDF
│   │   │   ├── caregiver/page.tsx      # Modo cuidador
│   │   │   ├── settings/page.tsx       # Configurações
│   │   │   └── upgrade/page.tsx        # Plano Pro (Asaas)
│   │   ├── invite/[token]/page.tsx     # Aceitar convite de cuidador
│   │   └── api/
│   │       ├── doses/
│   │       │   ├── generate/route.ts   # Gerar doses pendentes
│   │       │   └── [id]/confirm/       # Confirmar dose (SW)
│   │       ├── notifications/
│   │       │   ├── send/route.ts       # Enviar push (cron a cada 5min)
│   │       │   └── subscription/       # Salvar push subscription
│   │       ├── cron/daily/route.ts     # Cron diário (gerar doses, marcar perdidas)
│   │       └── webhooks/asaas/         # Webhook de pagamento
│   ├── components/                     # Componentes reutilizáveis
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   ├── supabase/server.ts
│   │   ├── push.ts                     # Web Push utils
│   │   ├── pdf-report.ts               # Gerador de PDF
│   │   └── utils.ts
│   ├── types/index.ts                  # TypeScript types
│   └── middleware.ts                   # Auth middleware
├── public/
│   ├── sw.js                           # Service Worker
│   ├── manifest.json                   # PWA manifest
│   └── icons/                          # Ícones (criar manualmente)
├── supabase-schema.sql                 # Schema completo do banco
├── vercel.json                         # Cron jobs
└── .env.local.example                  # Template de variáveis
```

## 📦 Funcionalidades

| Feature | Free | Pro |
|---------|------|-----|
| Medicamentos | 3 | Ilimitados |
| Alertas push | ✅ | ✅ |
| Histórico | 30 dias | Completo |
| Cuidadores | 1 | Ilimitados |
| Relatório PDF | ❌ | ✅ |
| Controle de estoque | ❌ | ✅ |
| Alertas de estoque | ❌ | ✅ |

## 🔒 Segurança

- Auth via Supabase (email/senha)
- Row Level Security (RLS) em todas as tabelas
- Middleware protege todas as rotas `/dashboard`
- Push notifications via VAPID (sem servidor de terceiros)
- Webhooks verificados por secret token

## 🛠️ Dev local

```bash
npm install
cp .env.local.example .env.local
# Preencha as variáveis
npm run dev
```
