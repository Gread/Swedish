# Extensão do Omarchy

Pratique as cartas pela barra do [Omarchy](https://omarchy.org):

- **Ícone na barra** (󰗊): aceso enquanto você não fez nenhuma carta no dia.
- **Painel**: a cena do dia (a próxima carta ainda não montada), as cartas
  para revisar, busca em português ou sueco, filtros e a lista completa. A
  lista vem das próprias cartas do app; um lote novo aparece sozinho depois do
  build.
- **Cena**: abre numa janela encaixada logo abaixo da barra, com as cores do
  tema do Omarchy. Esc fecha. Roda fora do shell: o WebGL não roda dentro
  dele, e uma cena travada não leva junto a barra nem a tela de bloqueio.
- **Lembrete**: de hora em hora, das 9h às 22h, enquanto você não montar nem
  revisar nenhuma carta no dia. "Praticar" abre o painel.

## Instalação

```bash
omarchy/bin/swedish install
```

Faz o build (`npm run build:omarchy`), liga o plugin `gread.swedish` na barra,
instala `swedish-server.service` e `swedish-reminder.timer` (systemd do
usuário) e acrescenta a regra da janela da cena em `~/.config/hypr/hyprland.lua`.

Depois de puxar cartas novas: `swedish build`.

## Como funciona

| Peça | O quê |
|---|---|
| `server.py` | servidor local (127.0.0.1:47823, só biblioteca padrão): entrega `dist/`, guarda o progresso em `~/.local/state/swedish/progress.json` e registra os dias praticados |
| `src/omarchy/` | modo `?omarchy` do app: só a cena (montar ou revisar), progresso no servidor, cores do tema |
| `tools/omarchy/export-cards.ts` | exporta os metadados das cartas para `dist/cards.json` |
| `Panel.qml`, `BarWidget.qml`, `Model.js` | o painel e o ícone da barra |
| `bin/swedish` | abre/fecha a janela da cena, lembrete, build e instalação |

O progresso da extensão é separado do progresso do app no celular (que fica no
navegador).
