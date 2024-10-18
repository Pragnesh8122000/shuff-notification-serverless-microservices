import crypto from "crypto";

export const generateRandomCode = () => {
    const randomNumber = Math.floor(Math.random() * 900000) + 100000;
    return randomNumber.toString();
};

export const generateUniqueBatchKey = () => {
    const timestamp = Date.now().toString(36);
    const randomString = crypto.randomBytes(6).toString('hex');
    const batchKey = `${timestamp}-${randomString}`;
    return batchKey;
  }