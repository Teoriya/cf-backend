import mongoose from 'mongoose';
import { getConfig } from '../config';

async function dbConnect(): Promise<void> {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(getConfig().mongoURI || '', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as mongoose.ConnectOptions);

        const db = mongoose.connection;
        db.on('error', (error:Error) => {
            console.error('Connection error:', error);
            throw error;
        });

        db.once('open', () => {
            console.log('Connected to MongoDB');
        });
    } catch (error) {
        throw error;
    }
}

export default dbConnect;
