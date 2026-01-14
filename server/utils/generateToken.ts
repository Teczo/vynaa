import jwt from 'jsonwebtoken';

const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: '15m', // Short-lived access token
    });
};

export default generateToken;
