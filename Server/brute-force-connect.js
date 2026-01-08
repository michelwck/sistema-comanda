
import pg from 'pg';
const { Client } = pg;

const configs = [
    { port: 5433, pass: 'admin' },
    { port: 5433, pass: 'postgres' },
    { port: 5433, pass: 'root' },
    { port: 5433, pass: '123456' },
    { port: 5432, pass: 'admin' },
    { port: 5432, pass: 'postgres' },
    { port: 5432, pass: 'root' },
    { port: 5432, pass: '123456' },
];

async function test() {
    console.log("🔍 Testing connections...");
    for (const conf of configs) {
        const connectionString = `postgresql://postgres:${conf.pass}@127.0.0.1:${conf.port}/sistema_comanda?schema=public`;
        // Note: attempting to connect to 'sistema_comanda' db. If it doesn't exist, we might get "database does not exist" which proves auth worked!
        // If auth fails, we get "password authentication failed".

        const client = new Client({ connectionString });
        try {
            await client.connect();
            console.log(`✅ SUCCESS: Port ${conf.port}, Password '${conf.pass}'`);
            await client.end();
            return; // Found it!
        } catch (err) {
            console.log(`❌ FAILED: Port ${conf.port}, Password '${conf.pass}' - ${err.message}`);
            if (err.message.includes('database "sistema_comanda" does not exist')) {
                console.log(`⚠️ AUTH SUCCESS but DB missing: Port ${conf.port}, Password '${conf.pass}'`);
                // This is also a partial success, means creds are good.
            }
            await client.end().catch(() => { /* ignore close error */ });
        }
    }
    console.log("🏁 Done testing.");
}

test();
