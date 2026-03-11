# Sons do site

Pasta para ficheiros de áudio usados na interface.

## Ficheiros (imersivo e moderno — elementos roxos padronizados)

| Ficheiro                          | Uso | Volume |
|-----------------------------------|-----|--------|
| `deep-ui-pulse.wav`               | Botões de ação: Iniciar Teste, Receber relatório, Continuar (confirmar ação importante). | 0.08 |
| `ambient-airy-notification.wav`   | Modais/alertas (ex. 50% do teste concluído) — sopro/vidro leve, informação fluida. | 0.05 |
| `secure-confirmation.wav`        | Botão «Pagar US$ 1 e receber por e-mail» — clique duplo rápido, sensação de segurança. | 0.08 |
| `haptic-tap.wav`                  | Opções ABCD — feedback quase inaudível. | 0.05 |
| `transition-slide.wav`            | Mudança de pergunta — digital slide abafado. | — |
| `success.wav`                     | Ao chegar à tela de pagamento. | — |
| `shimmer.wav`                     | Hover no título. | — |
| `card-pulsar.wav`                 | Mouse enter nos cards da intro. | — |

Todos os `.wav` por `node scripts/create-sounds.js`. Volumes 0.05 ou 0.08 para manter elegância.

## Formato

- Preferir **MP3** ou **WAV** para compatibilidade.
- Duração curta (0,1–0,3 s) para hovers, para não cansar.
- Volume moderado; o projeto pode reduzir ainda mais em código.

## Uso no projeto

O hover dos TiltCards usa um tom gerado por Web Audio por defeito. Se colocares aqui um ficheiro com o nome esperado (ex.: `hover.mp3`), o componente pode ser configurado para o usar em vez do tom gerado.
