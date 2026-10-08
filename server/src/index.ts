import 'dotenv/config';
import { createApp } from './app';

const PORT = Number(process.env.PORT ?? 4000);
createApp().listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
