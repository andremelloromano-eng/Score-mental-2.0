# Efeitos visuais

Esta pasta concentra **componentes e lógica de efeitos** do projeto para facilitar manutenção e reuso.

## O que colocar aqui

- Partículas (fundo, overlay sobre cards/opções)
- Efeitos 3D / tilt (ex.: TiltCard)
- Animações de UI (ex.: glow da barra de progresso, timer)
- Outros efeitos visuais reutilizáveis

## Uso

Importe com alias `@/effects/...` (configurado no `tsconfig.json`).

Exemplo: `import { ParticlesOverlay } from "@/effects/ParticlesBackground";`

## Estado atual

Os efeitos ainda estão em `src/components/` (ex.: `ParticlesBackground.tsx`). Novos efeitos podem ser criados diretamente aqui; a migração dos existentes pode ser feita quando for conveniente.
