# Javis

Assistente de voz da **iFC3D Forja** — conversa, tira dúvidas e mexe nos apps da empresa pelo celular.

## Como funciona

O Javis é um botão dourado que fica dentro de cada app da iFC3D (publicados no Claude). Ele:

- ouve pelo microfone (ou pelo ditado do teclado) e responde falando, em português;
- consulta e altera os dados do app em que está aberto, sempre pedindo confirmação antes de mudar algo;
- usa o Claude para entender os pedidos.

## Arquivos

| Arquivo | O que é |
|---|---|
| `javis-core.js` | Núcleo do Javis: botão, painel de conversa, voz (fala e escuta) e ligação com o Claude. Igual em todos os apps. |
| `adapter-os.js` | Ferramentas do Javis no app de **Ordens de Serviço** (listar, detalhar, mudar status, nova OS, estoque de chapas e fitas). |
| `os-javis.html` | App de Ordens de Serviço completo, já com o Javis. |

## Apps

- [x] Ordens de Serviço
- [ ] Orçamentos
- [ ] Pedido de Compra
- [ ] Controle de Qualidade

## Voz

O Javis usa as vozes instaladas no celular. Para voz masculina:

- **iPhone:** Ajustes › Acessibilidade › Conteúdo Falado › Vozes › Português (Brasil) › Felipe.
- **Android:** Configurações › Acessibilidade › Conversão de texto em voz › Mecanismo do Google › Instalar dados de voz › Português (Brasil).

Sem voz masculina, o Javis engrossa a voz feminina automaticamente (ajuste em ⚙ › Tom).

---
iFC3D Forja — Do projeto à realidade.
