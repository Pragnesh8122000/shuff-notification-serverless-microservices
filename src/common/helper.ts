export const generateRandomCode = () => {
    const randomNumber = Math.floor(Math.random() * 900000) + 100000;
    return randomNumber.toString();
};