# Teste de QI Profissional - Score Mental

Aplicação Next.js 14 para avaliação de QI profissional com pagamento via Pix (Mercado Pago) e emissão de certificado em PDF.

## 🚀 Deploy em Produção

### Variáveis de Ambiente (Produção - Vercel)

```bash
RESEND_API_KEY=re_sua_api_key_resend
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu_access_token_producao
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua_public_key_producao
MP_WEBHOOK_SECRET=seu_webhook_secret_mercado_pago
NEXT_PUBLIC_BASE_URL=https://scoremental.com.br
```

### Passos para Deploy

1. **Preparar repositório Git**
   ```bash
   git init
   git add .
   git commit -m "feat: projeto completo teste QI Score Mental"
   ```

2. **Configurar Vercel**
   - Conectar repositório ao Vercel
   - Adicionar variáveis de ambiente no dashboard
   - Deploy automático

3. **Configurar Mercado Pago**
   - URL do Webhook: `https://scoremental.com.br/api/mercadopago/webhook`
   - Modo: Produção
   - Pagamentos habilitados: Pix (R$ 6,00)

4. **Configurar Resend**
   - Verificar domínio: `scoremental.com.br`
   - Remetente: `contato@scoremental.com.br`

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js >= 18
- npm

### Instalação
```bash
npm install
```

### Variáveis de Ambiente (Desenvolvimento)
Criar `.env.local`:
```bash
RESEND_API_KEY=re_ch837fv5_NsxWyQFLdxmXvqsR4Qnk3zUc
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-2576324625032452-031020-4f6ffab40b7db02b3ad4c351d8734ec9-492874314
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-e700c500-d8ea-45d4-b37a-b84bba6a8e04
MP_WEBHOOK_SECRET=da5e62fe6b4459c17e85de52f785d559179daf731b7c7572313142948acd19af
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Rodar
```bash
npm run dev
```

## 📁 Estrutura do Projeto

- `/src/app/api/mercadopago/` - Rotas API (checkout, webhook, status)
- `/src/app/sucesso/` - Página de sucesso pós-pagamento
- `/src/lib/` - Utilitários (PDF, idempotência)
- `/data/` - Perguntas do teste de QI

## 🔧 Configurações DNS (Registro.br)

Para configurar o Resend com `contato@scoremental.com.br`, adicione:

### Registros TXT
```
Nome: @
Valor: "v=spf1 include:spf.resend.com -all"
```

### Registros MX
```
Nome: @
Valor: feedback-smtp.eu-west-1.awsapps.com
Prioridade: 10
```

### Registros DKIM (fornecido pelo Resend após verificar domínio)
```
Nome: resend._domainkey
Valor: "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
```

## 📊 Fluxo Completo

1. Usuário faz teste de QI
2. Preenche nome e e-mail
3. Pagamento Pix via Mercado Pago (R$ 6,00)
4. Webhook confirma pagamento
5. Sistema gera certificado PDF
6. E-mail enviado via Resend
7. Redirecionamento para página de sucesso

## 🧪 Testes

- **Desktop:** Fluxo completo via localhost
- **Mobile:** Testar via túnel (cloudflared/ngrok)
- **Produção:** Validar webhook e e-mails

