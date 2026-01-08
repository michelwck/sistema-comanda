
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('DEBUG PATH:', path.join(__dirname, '.env'));
console.log('DATABASE_URL:', process.env.DATABASE_URL);
