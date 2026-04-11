# Guia de Implementação — Funil Freemium ScoreMental

## Contexto do Projeto

**Site:** https://scoremental.com.br
**Produto:** Teste de QI Profissional (23 questões)
**Stack:** Site web (HTML/CSS/JS ou framework a definir)
**Modelo atual:** Cobrança de R$6,00 via Pix antes de liberar resultado
**Problema:** 2.140 visitantes, 0 vendas (conversão 0%)

---

## Novo Modelo: Funil Freemium

### Visão Geral do Fluxo

```
[Landing Page] → [Teste Gratuito - 23 questões] → [Página de Resultado]
                                                          │
                                                    ┌─────┴─────┐
                                                    │           │
                                              GRÁTIS         PAGO
                                                │              │
                                          ┌─────┴─────┐       │
                                          │           │       │
                                     QI Final    Certificado   Relatório
                                    (na tela)    (PDF simples) Premium 12pg
                                                              R$ 9,90
```

---

## Estrutura Detalhada de Cada Etapa

### ETAPA 1 — Landing Page (já existe, ajustes mínimos)

**Mudanças necessárias:**
- Remover menção a pagamento na landing page
- Trocar o CTA de "Iniciar teste agora" mantendo o texto, mas removendo "Pix R$ 6,00"
- Adicionar frase: "100% gratuito • Resultado na hora"
- Manter: "Aproximadamente 12 minutos • 23 questões"
- Manter toda a estrutura visual atual (dark mode, FAQ, etc.)

**Novo rodapé do CTA:**
```
🔒 Ambiente Seguro | ✅ 100% Gratuito | ⚡ Resultado Imediato
```

---

### ETAPA 2 — Teste (23 questões - mantém como está)

Nenhuma alteração necessária no fluxo de questões.

---

### ETAPA 3 — Página de Resultado (NOVA - parte mais importante)

Esta é a página que aparece APÓS o usuário completar as 23 questões. É onde acontece a monetização.

#### Layout da Página de Resultado

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              🎉 Teste Concluído!                         │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              SEU RESULTADO                          │ │
│  │                                                     │ │
│  │         ┌───────────┐    ┌───────────┐              │ │
│  │         │  QI: 115  │    │ Percentil │              │ │
│  │         │           │    │   84º     │              │ │
│  │         └───────────┘    └───────────┘              │ │
│  │                                                     │ │
│  │  Pontuação: 15/23 questões corretas                 │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  📄 CERTIFICADO GRATUITO                            │ │
│  │                                                     │ │
│  │  Seu certificado está pronto para download.         │ │
│  │                                                     │ │
│  │  [ 🔽 Baixar Certificado PDF ]  ← botão verde      │ │
│  │                                                     │ │
│  │  Compartilhe no LinkedIn e destaque seu perfil!     │ │
│  │  [ Compartilhar no LinkedIn ]  ← botão azul         │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ═══════════════════════════════════════════════════════  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  🔓 RELATÓRIO PREMIUM — Desbloqueie sua análise     │ │
│  │                                                     │ │
│  │  Seu certificado mostra O QUE você alcançou.        │ │
│  │  O relatório mostra POR QUÊ e COMO melhorar.       │ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────┐    │ │
│  │  │  PREVIEW DO RELATÓRIO (borrado/blur)        │    │ │
│  │  │                                             │    │ │
│  │  │  ░░░ Dashboard de Resultados ░░░            │    │ │
│  │  │  ░░░ Gráfico de áreas cognitivas ░░░       │    │ │
│  │  │  ░░░ Percepção Visual: ██░░ 60% ░░░        │    │ │
│  │  │  ░░░ Raciocínio Abstrato: ███░ 80% ░░░     │    │ │
│  │  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │    │ │
│  │  └─────────────────────────────────────────────┘    │ │
│  │                                                     │ │
│  │  O que está incluso:                                │ │
│  │                                                     │ │
│  │  ✅ Dashboard completo com scores por área          │ │
│  │  ✅ Análise detalhada de 5 competências cognitivas  │ │
│  │  ✅ Comparação populacional (Curva de Gauss)        │ │
│  │  ✅ Guia de Carreira personalizado                  │ │
│  │  ✅ Detalhamento questão por questão                │ │
│  │  ✅ 12 páginas de conteúdo exclusivo                │ │
│  │                                                     │ │
│  │         ┌───────────────────────────┐               │ │
│  │         │  🔓 DESBLOQUEAR POR       │               │ │
│  │         │     R$ 9,90               │               │ │
│  │         │                           │               │ │
│  │         │   Pagamento via Pix       │               │ │
│  │         │   Entrega imediata        │               │ │
│  │         └───────────────────────────┘               │ │
│  │                                                     │ │
│  │  🔒 Pagamento seguro • Entrega em segundos          │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  💬 DEPOIMENTOS                                     │ │
│  │                                                     │ │
│  │  "O relatório me ajudou a entender onde focar       │ │
│  │   meu desenvolvimento profissional." — Ana, SP      │ │
│  │                                                     │ │
│  │  "Coloquei o certificado no LinkedIn e recebi       │ │
│  │   3 mensagens de recrutadores." — Carlos, RJ        │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Copywriting — Textos Prontos para Usar

### Headline da seção premium:
```
Seu certificado mostra O QUE você alcançou.
O Relatório Premium mostra POR QUÊ — e como ir além.
```

### Descrição curta:
```
12 páginas de análise profissional com breakdown de 5 áreas cognitivas,
comparação populacional, guia de carreira e detalhamento questão por questão.
```

### CTA principal:
```
Desbloquear Relatório Premium — R$ 9,90
```

### Texto abaixo do CTA:
```
⚡ Entrega imediata no seu e-mail • 🔒 Pagamento seguro via Pix
```

### Texto de urgência (opcional):
```
Seu resultado ficará disponível por 24 horas.
Após esse período, você precisará refazer o teste.
```

---

## Especificações Técnicas

### Certificado Gratuito (PDF simplificado)
- **Conteúdo:** Apenas a página 12 do PDF atual (certificado)
- **Dados exibidos:** Nome/email, QI final, percentil, data, ID de autenticação
- **Formato:** PDF de 1 página, mesmo design atual
- **Entrega:** Download direto na página de resultado (sem necessidade de email)

### Relatório Premium (PDF completo — produto pago)
- **Conteúdo:** Todas as 12 páginas do PDF atual
- **Inclui:** Dashboard, análises detalhadas das 5 áreas, curva de Gauss, guia de carreira, detalhamento Q&A, certificado
- **Formato:** PDF de 12 páginas, mesmo design atual
- **Entrega:** Via e-mail após confirmação do Pix
- **Preço:** R$ 9,90

### Preview Borrado (CSS)
```css
.premium-preview {
  position: relative;
  overflow: hidden;
}

.premium-preview .content {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
}

.premium-preview .overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.7) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Botão de Compartilhamento LinkedIn
```javascript
// URL de compartilhamento no LinkedIn
const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://scoremental.com.br')}&title=${encodeURIComponent('Acabei de completar meu Teste de QI Profissional!')}`;
```

---

## Checklist de Implementação

### Fase 1 — Mudanças na Landing Page
- [ ] Remover referência a Pix/pagamento da landing
- [ ] Atualizar rodapé do CTA para "100% Gratuito"
- [ ] Ajustar o contador social proof (se necessário)

### Fase 2 — Criar Página de Resultado
- [ ] Seção: Resultado (QI + Percentil + Pontuação)
- [ ] Seção: Certificado gratuito com botão de download
- [ ] Seção: Botão de compartilhar no LinkedIn
- [ ] Seção: Preview borrado do relatório premium
- [ ] Seção: Lista de benefícios do relatório
- [ ] Seção: CTA de compra (R$ 9,90 via Pix)
- [ ] Seção: Depoimentos/social proof

### Fase 3 — Backend
- [ ] Gerar certificado PDF (1 página) gratuitamente após teste
- [ ] Separar geração do relatório completo (12 páginas) para após pagamento
- [ ] Integrar pagamento Pix para R$ 9,90
- [ ] Enviar relatório premium por e-mail após confirmação

### Fase 4 — Otimizações Futuras
- [ ] Adicionar timer de urgência ("resultado disponível por 24h")
- [ ] A/B testar preços (R$ 9,90 vs R$ 14,90 vs R$ 19,90)
- [ ] Criar sequência de e-mail para quem baixou certificado mas não comprou relatório
- [ ] Adicionar opção de pagamento via cartão de crédito
- [ ] SEO: criar blog com conteúdo sobre QI e desenvolvimento profissional

---

## Notas para o Claude Code (VS Code)

Ao usar este documento como referência no Claude Code:

1. **Comece pela landing page** — são as mudanças mais simples (remover menção a pagamento)
2. **Depois crie a página de resultado** — use o layout acima como base
3. **O preview borrado** — use CSS `filter: blur()` sobre uma imagem ou mockup do relatório
4. **Mantenha o dark mode** — o site já usa dark mode profissional, mantenha a consistência
5. **Mobile first** — a maioria do tráfego vem do TikTok/Instagram, então é tudo mobile

---

*Documento gerado para uso como referência de implementação no VS Code com Claude Code.*
