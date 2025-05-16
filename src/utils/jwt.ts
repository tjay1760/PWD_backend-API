import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import { TokenType } from '../types/models';
import AuthToken from '../models/AuthToken';

// Secret keys
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const REFRESH_TOKEN_SECRET = `${ACCESS_TOKEN_SECRET}_refresh`;

// Token expiration
const ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// Generate tokens
export const generateAccessToken = (user: IUser): string => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role,
      county: user.county
    }, 
    ACCESS_TOKEN_SECRET, 
    { expiresIn: ACCESS_TOKEN_EXPIRATION }
  );
};

export const generateRefreshToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id }, 
    REFRESH_TOKEN_SECRET, 
    { expiresIn: REFRESH_TOKEN_EXPIRATION }
  );
};

// Save token to database
export const saveToken = async (
  userId: string, 
  token: string, 
  type: TokenType,
  expiresIn: string
): Promise<void> => {
  // Calculate expiration date
  const expiresInMs = ms(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  // Create new token document
  await AuthToken.create({
    user_id: userId,
    token,
    type,
    expires_at: expiresAt
  });
};

// Verify tokens
export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Revoke token
export const revokeToken = async (token: string): Promise<void> => {
  await AuthToken.deleteOne({ token });
};

// Helper function to convert time strings like '15m', '1h', '7d' to milliseconds
function ms(val: string): number {
  const regex = /^(\d+)([smhdw])$/;
  const match = val.match(regex);
  
  if (!match) return 0;
  
  const num = parseInt(match[1], 10);
  const type = match[2];
  
  switch (type) {
    case 's': return num * 1000;
    case 'm': return num * 1000 * 60;
    case 'h': return num * 1000 * 60 * 60;
    case 'd': return num * 1000 * 60 * 60 * 24;
    case 'w': return num * 1000 * 60 * 60 * 24 * 7;
    default: return 0;
  }
}