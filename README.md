# Sistema de Comandas - Full Stack

Sistema de gerenciamento de comandas para bares e clubes com sincronização em tempo real.

## 🚀 Quick Start

Veja o arquivo [SETUP.md](./SETUP.md) para instruções detalhadas de instalação.

## 🛠️ Stack Tecnológica

### Frontend
- Vite
- JavaScript Vanilla
- Socket.io Client

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- Socket.io

## 📁 Estrutura do Projeto

```
sistema-comanda/
├── src/                    # Frontend
│   ├── components/         # Componentes da UI
│   ├── services/          # API e Socket.io
│   ├── main.js            # Lógica principal
│   └── style.css          # Estilos
├── Server/                # Backend
│   ├── src/
│   │   ├── controllers/   # Lógica de negócio
│   │   ├── routes/        # Rotas da API
│   │   ├── middleware/    # Middlewares
│   │   └── server.js      # Servidor Express
│   └── prisma/
│       ├── schema.prisma  # Schema do banco
│       └── seed.js        # Dados iniciais
└── SETUP.md              # Guia de instalação

```

## 🔌 API Endpoints

### Comandas
- `GET /api/tabs` - Listar comandas
- `POST /api/tabs` - Criar comanda
- `PUT /api/tabs/:id` - Atualizar comanda
- `DELETE /api/tabs/:id` - Deletar comanda
- `POST /api/tabs/:id/items` - Adicionar item
- `PUT /api/tabs/:id/items/:itemId` - Atualizar item
- `DELETE /api/tabs/:id/items/:itemId` - Remover item

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Deletar cliente

## 🔄 Eventos Socket.io

- `tab:created` - Nova comanda criada
- `tab:updated` - Comanda atualizada
- `tab:deleted` - Comanda deletada
- `tab:item:added` - Item adicionado
- `tab:item:updated` - Item atualizado
- `tab:item:deleted` - Item removido
- `product:created` - Produto criado
- `product:updated` - Produto atualizado
- `product:deleted` - Produto deletado
- `client:created` - Cliente criado
- `client:updated` - Cliente atualizado
- `client:deleted` - Cliente deletado

## 📱 Funcionalidades

- ✅ Criar e gerenciar comandas
- ✅ Adicionar itens às comandas
- ✅ Busca rápida de produtos
- ✅ Cadastro de clientes e produtos
- ✅ Sincronização em tempo real entre dispositivos
- ✅ Persistência de dados no PostgreSQL
- ✅ Interface responsiva (mobile e desktop)

## 🎯 Atalhos de Teclado

- `F6` - Criar nova comanda
- `↑/↓` - Navegar entre comandas
- `Enter` - Abrir comanda selecionada
- `ESC` - Fechar modal/voltar

## 📄 Licença

ISC
