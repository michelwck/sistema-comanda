import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

console.log('🔍 Testando conexão PostgreSQL...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

try {
    await client.connect();
    console.log('✅ Conexão bem-sucedida!');

    const result = await client.query('SELECT version()');
    console.log('📊 Versão do PostgreSQL:', result.rows[0].version);

    await client.end();
} catch (error) {
    console.error('❌ Erro na conexão:');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('Detalhes:', error);
    process.exit(1);
}
