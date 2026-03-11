# Textos e conteúdo da interface

Esta pasta concentra **textos da UI**, copy e constantes de mensagens (não os dados das perguntas do teste, que ficam em `src/data/`).

## O que colocar aqui

- Títulos e descrições de seções (hero, intro, resultado)
- Mensagens de botões, labels, placeholders
- Textos de erro, sucesso, tooltips
- Qualquer copy que queira alterar sem mexer na lógica

## Formato sugerido

- `ui-strings.ts` ou `ui-strings.json` com chaves por seção
- Ou arquivos por contexto: `hero.ts`, `quiz.ts`, `resultado.ts`

## Uso

Importe com alias `@/content/...`.

Exemplo: `import { HERO_TITLE } from "@/content/hero";`
