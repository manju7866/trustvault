import { app } from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` 🛡️  TRUSTVAULT SECURITY ENGINE BOOTED SUCCESSFULLY`);
    console.log(` 🚀 Running securely on isolated port: ${PORT}`);
    console.log(`==================================================`);
});
