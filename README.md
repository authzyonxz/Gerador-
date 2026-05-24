# 🔑 Bot de Keys Proxy Android
**Desenvolvido por ruanzada7**

---

## 📋 COMANDOS

| Comando | Quem usa | Descrição |
|---------|----------|-----------|
| `/addsaldo` | 👑 Dono | Adiciona saldo a um membro |
| `/saldo` | Todos | Ver saldo atual |
| `/panel` | Todos | Painel de compra de keys |
| `/adicionar` | 👑 Dono | Adiciona keys ao estoque |
| `/estoque` | 👑 Dono | Ver estoque completo |

---

## ⚙️ INSTALAÇÃO PASSO A PASSO

### 1. Instale o Node.js
Baixe em: https://nodejs.org (versão 18 ou superior)

### 2. Baixe os arquivos do bot
Coloque todos os arquivos numa pasta (ex: `meu-bot`)

### 3. Instale as dependências
Abra o terminal na pasta e rode:
```
npm install
```

### 4. Configure o arquivo `.env`
Abra o arquivo `.env` e preencha:

```
TOKEN=seu_token_do_bot
OWNER_ID=seu_id_do_discord
```

**Como pegar seu ID do Discord:**
1. Vá em Configurações → Avançado → Ative "Modo Desenvolvedor"
2. Clique com botão direito no seu perfil
3. Clique em "Copiar ID do usuário"

### 5. Configure o Bot no Discord Developer Portal
1. Acesse: https://discord.com/developers/applications
2. Selecione seu bot → **Bot**
3. Ative os Intents: `SERVER MEMBERS INTENT` e `MESSAGE CONTENT INTENT`
4. Em **OAuth2 → URL Generator**: marque `bot` + `applications.commands`
5. Permissões: `Send Messages`, `Read Messages`, `Use Slash Commands`
6. Copie o link gerado e adicione o bot ao seu servidor

### 6. Inicie o bot
```
npm start
```

---

## 🔑 COMO USAR

### Adicionar saldo a um membro:
```
/addsaldo membro:@usuario valor:1000
```

### Adicionar keys ao estoque:
```
/adicionar plano:Key 1 Dia - R$15 keys:KEY-ABCD-1234
                                        KEY-EFGH-5678
                                        KEY-IJKL-9012
```
*(cada key em uma linha)*

### Ver o painel de compras:
```
/panel
```
Membros clicam nos botões, o bot debita o saldo e entrega a key **só para eles (privado)**.

---

## 💾 NOTA SOBRE DADOS
Os saldos e estoques ficam **na memória RAM** — reiniciar o bot apaga tudo.

Para manter os dados permanentemente, recomendo usar o **banco de dados SQLite** (me peça para adicionar essa funcionalidade!).

---

*Sistema desenvolvido por ruanzada7*
