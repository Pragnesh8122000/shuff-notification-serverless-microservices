import { EncryptedData } from '../web/interfaces/commonUtilsInterfaces.js';
import crypto from 'crypto';

export const encryptLoginToken = (data: object): EncryptedData => {
    try {

        const secret = process.env.CRYPTO_SECRET as string;
        const algorithm = process.env.ALGORITHM as string;
        const rounds = parseInt(process.env.ROUNDS as string, 10);
        const keySize = parseInt(process.env.KEY_SIZE as string, 10);

        const salt = crypto.createHash('sha1').update(secret).digest('hex');
        const iv = crypto.randomBytes(16);
        const key = crypto.pbkdf2Sync(secret, Buffer.from(salt, 'hex'), rounds, keySize, 'sha512');
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

        let encryptedValue = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encryptedValue += cipher.final('hex');

        const encryptedData: EncryptedData = {
            iv: iv.toString('hex'),
            value: encryptedValue,
        };

        return encryptedData;
    } catch (error) {
        throw error;
    }
};

export const decryptLoginToken = (data: EncryptedData): string => {
    try {

        const secret = process.env.CRYPTO_SECRET as string;
        const algorithm = process.env.ALGORITHM as string;        
        const rounds = parseInt(process.env.ROUNDS as string, 10);
        const keySize = parseInt(process.env.KEY_SIZE as string, 10);

        const iv = Buffer.from(data.iv, 'hex');
        const salt = crypto.createHash('sha1').update(secret).digest('hex');
        const key = crypto.pbkdf2Sync(secret, Buffer.from(salt, 'hex'), rounds, keySize, 'sha512');
        
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decryptedData = decipher.update(data.value, 'hex', 'utf8');
        decryptedData += decipher.final('utf8');

        return decryptedData;
    } catch (error) {
        throw error;
    }
};