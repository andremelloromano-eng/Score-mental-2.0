# fundosite1 — Base de fundo para site futuro

Essência do fundo das páginas: **só o gradiente escuro + partículas flutuantes**. Para reutilizar noutro projeto parecido.

## O que está aqui

| Ficheiro | Uso |
|----------|-----|
| **PROMPT-INICIAL.md** | Prompt para dar ao Cursor/assistente ao criar um novo site com esta base. |
| **ParticlesBackground.tsx** | Componente React (Framer Motion) das partículas do fundo. |
| **estilo-fundo.css** | Estilo do `body` (gradiente). Colar no teu `globals.css`. |
| **layout-exemplo.txt** | Como importar e usar no `layout.tsx` do Next.js. |

## Como usar noutro projeto

1. Copia o **prompt** de `PROMPT-INICIAL.md` e usa-o ao criar o novo site.
2. Ou copia à mão: `ParticlesBackground.tsx` para `src/components/`, o CSS de `estilo-fundo.css` para o teu CSS global, e o exemplo de `layout-exemplo.txt` no teu `layout.tsx`.
3. Instala `framer-motion` no projeto novo.

## Resumo

- Fundo: gradiente radial `#1f2937` → `#020617`.
- Partículas: ~140 pontos, tons cinza/azul, movimento em várias direções (Framer Motion).
- Conteúdo: dentro de um `div` com `relative z-10` para ficar por cima das partículas.

Base guardada a partir do projeto “Teste de QI Profissional”.
