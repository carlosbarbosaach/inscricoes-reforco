# Sistema de Inscrições

Next.js + Firebase/Firestore, pronto para Vercel.

## Funcionalidades
- Link público para alunos
- Terça ou sexta
- Nome completo + turma
- 35 vagas por horário
- Vagas em tempo real
- Bloqueio de duplicidade
- Transação para impedir ultrapassar o limite
- Painel `/admin`
- Lista por dia e impressão

## 1. Instalar
```bash
npm install
cp .env.example .env.local
npm run dev
```

## 2. Firebase
Crie um projeto no Firebase e ative **Cloud Firestore**.

Crie a coleção `horarios` com 2 documentos. IDs sugeridos: `terca` e `sexta`.

### horarios/terca
```json
{"dia":"Terças-feiras","horario":"14h às 14h50","limite":35,"inscritos":0,"ativo":true,"ordem":1}
```
### horarios/sexta
```json
{"dia":"Sextas-feiras","horario":"14h às 14h50","limite":35,"inscritos":0,"ativo":true,"ordem":2}
```

Publique as regras de `firestore.rules`.

## 3. Credenciais
No Firebase > Configurações do projeto > Seus apps > Web, copie as variáveis `NEXT_PUBLIC_*`.

Para Firebase Admin, crie uma conta de serviço e use `project_id`, `client_email` e `private_key` nas variáveis sem `NEXT_PUBLIC_`.

## 4. Vercel
Envie o projeto para GitHub, importe na Vercel e cadastre todas as variáveis do `.env.example` em **Settings > Environment Variables**.

Depois faça o deploy.

## URLs
- `/` inscrição dos alunos
- `/admin` painel administrativo
