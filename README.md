# Banco Central Metodista - Portal Oficial (Em Breve)

Site oficial lúdico em breve do **Banco Central Metodista**, desenvolvido para a **Escola Municipal Metodista de Queimados / RJ** como parte do projeto *“Metodizando o Dinheiro: Meu dinheiro, meu futuro”*.

---

## 📁 Estrutura do Pacote (.ZIP)

- **`src/`**: Código fonte em React + TypeScript + Tailwind CSS
- **`public/`**: Arquivos públicos e imagens
- **`dist/`**: **Site pronto para publicação direta** (se você só quiser subir no GitHub Pages, Vercel, Netlify ou qualquer hospedagem tradicional sem precisar compilar nada!)

---

## 🚀 Opção 1: Publicar Direto (Mais Rápido e Fácil)

Dentro deste arquivo você já tem a pasta **`dist/`** com o site totalmente compilado e pronto:

### No GitHub Pages:
1. Crie um repositório no seu GitHub.
2. Copie os arquivos de dentro da pasta `dist/` para a raiz do seu repositório (ou configure a branch `gh-pages` ou pasta `/dist`).
3. Vá em **Settings > Pages** no GitHub e selecione a branch. O site ficará no ar na hora!

### Na Vercel ou Netlify:
- **Netlify**: Basta arrastar a pasta `dist` no [app.netlify.com/drop](https://app.netlify.com/drop). O site fica online em 5 segundos!
- **Vercel**: Conecte o repositório do GitHub na [vercel.com](https://vercel.com) e clique em **Deploy**.

---

## 💻 Opção 2: Rodar Localmente no seu Computador

Se você quiser editar o código no VS Code:

1. **Instale o Node.js** (versão 18 ou superior): [nodejs.org](https://nodejs.org)
2. Abra a pasta do projeto no terminal ou VS Code.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Abra o link que aparecer no terminal (geralmente `http://localhost:5173`).

### Para gerar um novo build de produção:
```bash
npm run build
```
Os arquivos gerados irão para a pasta `dist/`.

---

## 🌐 Como Conectar Seu Domínio Próprio

Se você já tem um domínio (ex: no **Registro.br**, **Hostinger**, **GoDaddy**, etc.):

### Método 1: Pela Vercel (Recomendado - Grátis e com HTTPS automático)
1. Suba o projeto na [Vercel](https://vercel.com).
2. No painel do seu projeto na Vercel, vá em **Settings > Domains**.
3. Digite seu domínio (ex: `seusite.com.br`).
4. A Vercel mostrará os 2 registros DNS simples para você colocar onde registrou seu domínio:
   - **Registro Tipo A**: Nome/Host `@` apontando para `76.76.21.21`
   - **Registro Tipo CNAME**: Nome/Host `www` apontando para `cname.vercel-dns.com`
5. Em poucos minutos o domínio estará ativo com certificado SSL de segurança gratuito!

### Método 2: Pelo Netlify
1. No Netlify, vá em **Site configuration > Domain management > Add custom domain**.
2. Digite seu domínio e siga as instruções para apontar os DNS do Netlify ou registros CNAME/A.

### Método 3: Hospedagem Tradicional (cPanel / Hostgator / Locaweb)
Se o seu domínio já está ligado a uma hospedagem com cPanel:
1. Abra o **Gerenciador de Arquivos** no cPanel.
2. Vá até a pasta `public_html`.
3. Envie e descompacte o conteúdo da pasta **`dist/`** diretamente dentro de `public_html`.
4. O site abrirá direto no seu domínio imediatamente!

---

## 🌳 Mascote e Identidade
- Mascote: Arvorezinha Metodinho
- Moeda: **Queimacash** (Padrão monetário oficial: `Q$`)
- Cédulas: Q$ 5, Q$ 10, Q$ 20, Q$ 50 e Q$ 100
- Instituição: Escola Municipal Metodista de Queimados / RJ
