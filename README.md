# MeuMed · protótipo PWA (Onda 1 do MVP)

Protótipo de alta fidelidade do app da Clínica Cabeça & Pescoço, a partir do Canvas MVP da Lean Inception.
HTML, CSS e JavaScript puros, sem build e sem dependências. Dados fictícios guardados no navegador.

## Como rodar

```bash
python -m http.server 5173
```

Abra http://localhost:5173. Para instalar como app: botão **Instalar** no topo (Chrome/Edge) ou
"Adicionar à Tela de Início" (iPhone). Service worker exige `localhost` ou HTTPS.

## Funcionalidades da Onda 1

| Funcionalidade | Onde | Observação |
|---|---|---|
| Lembrete automático | Perfil › Lembretes | 24h, 2h e 30 min antes; notificação do aparelho + aviso no app |
| Agenda do médico em tempo real | Agendar | Horários se ocupam ao vivo (simulado), aviso por leitor de tela |
| Remarcar ou cancelar com 1 clique | Detalhe da consulta | Próximos horários livres em 1 toque, com "Desfazer" |
| Teleconsulta por vídeo | Consulta › Entrar na sala | Teste de câmera/microfone real; médico simulado; legendas e chat |
| Pagamento Pix e cartão | Pagamento | Pix com QR e copia e cola; cartão com Luhn e até 3x (teste: 4111 1111 1111 1111) |
| Enviar fotos e exames | Consulta › Enviar exames | Arrastar, câmera do celular, PDF; arquivos em IndexedDB |
| Check-in online | Consulta presencial | Abre 72h antes; dados, sintomas, apoio (Libras, cadeira), consentimento LGPD |
| Chat interno e externo com IA | Chat | Assistente com intenções e alerta de emergência (192), recepção, WhatsApp, entrada por voz |
| Relatório contábil | Relatório contábil | Bruto, taxas, líquido, a receber, por semana, forma e profissional; CSV e PDF |

## Acessibilidade (botão no topo ou Alt+A)

Tamanho do texto, tema claro/escuro, alto contraste, espaçamento para dislexia, destaque de links,
guia de leitura, cursor ampliado, pausar animações, escala de cinza, VLibras, leitor de voz da tela
e "ouvir ao tocar". Fonte Atkinson Hyperlegible, alvos de toque ≥ 44px, navegação por teclado,
foco visível e regiões `aria-live`.

## O que está simulado (trocar em produção)

- Pagamentos: gateway com Pix (webhook) e tokenização de cartão PCI-DSS.
- Teleconsulta: WebRTC (Daily, Twilio, Jitsi ou similar) conforme Resolução CFM 2.314/2022.
- Assistente: LLM com guardrails clínicos; hoje é por regras.
- Agenda e lembretes: backend com agenda real e push server (Web Push/VAPID).
- Persistência: hoje localStorage e IndexedDB no aparelho.

## Estrutura

```
index.html            casca do app e painel de acessibilidade
styles.css            design system (tokens claro, escuro e alto contraste)
app.js                roteador, telas e lógica da Onda 1
sw.js                 service worker (offline e clique na notificação)
manifest.webmanifest  manifesto PWA (ícones, atalhos)
icons/                ícones SVG e PNG (192, 512, maskable)
```
