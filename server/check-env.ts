
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

// Simulation of how server/index.ts loads env
dotenv.config({ path: '.env.local' });

console.log('Checking JWT_SECRET...');

if (!process.env.JWT_SECRET) {
    console.error('ERROR: JWT_SECRET is missing or empty!');
} else {
    console.log('JWT_SECRET is present (length: ' + process.env.JWT_SECRET.length + ')');
    try {
        const token = jwt.sign({ id: 'test' }, process.env.JWT_SECRET);
        console.log('Success: Token generated.');
    } catch (err: any) {
        console.error('Error generating token:', err.message);
    }
}
