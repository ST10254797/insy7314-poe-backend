const {
  registerUser,
  loginUser,
  initiateEnableMFA,
  verifyEnableMFA,
  refreshToken,
  logout
} = require('../Controllers/authController');
const User = require('../Models/userModel');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const { generateToken, createRefreshToken } = require('../utils/generateToken');

// Mock dependencies
jest.mock('../Models/userModel');
jest.mock('speakeasy');
jest.mock('qrcode');
jest.mock('jsonwebtoken');
jest.mock('../utils/generateToken');

describe('Auth Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: {},
      cookies: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      mockReq.body = {
        fullName: 'Test User',
        IDNumber: '123456789',
        AccNumber: '987654321',
        userName: 'testuser',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue({
        _id: 'user123',
        fullName: 'Test User',
        userName: 'testuser'
      });

      await registerUser(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ userName: 'testuser' });
      expect(User.create).toHaveBeenCalledWith({
        fullName: 'Test User',
        IDNumber: '123456789',
        AccNumber: '987654321',
        userName: 'testuser',
        password: 'password123'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User registered successfully'
      });
    });

    it('should return 400 if username already exists', async () => {
      mockReq.body = {
        userName: 'existinguser'
      };

      User.findOne.mockResolvedValue({ _id: 'existing123' }); // User exists

      await registerUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Username already exists'
      });
    });

    it('should return 500 on server error', async () => {
      mockReq.body = {
        userName: 'testuser'
      };

      User.findOne.mockRejectedValue(new Error('Database error'));

      await registerUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      mockReq.body = {
        userName: 'testuser',
        AccNumber: '123456789',
        password: 'password123'
      };

      const mockUser = {
        _id: 'user123',
        userName: 'testuser',
        mfaEnabled: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        refreshTokens: [],
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('access-token-123');
      createRefreshToken.mockReturnValue('refresh-token-123');

      await loginUser(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        userName: 'testuser',
        AccNumber: '123456789'
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'access-token-123'
      });
    });

    it('should return 400 for invalid username or account number', async () => {
      mockReq.body = {
        userName: 'wronguser',
        AccNumber: 'wrongacc'
      };

      User.findOne.mockResolvedValue(null);

      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid username or account number'
      });
    });

    it('should return 400 for invalid password', async () => {
      mockReq.body = {
        userName: 'testuser',
        AccNumber: '123456789',
        password: 'wrongpassword'
      };

      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockUser);

      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid password'
      });
    });
  });

  describe('initiateEnableMFA', () => {
    it('should initiate MFA setup successfully', async () => {
      mockReq.user = { _id: 'user123' };
      
      const mockUser = {
        _id: 'user123',
        userName: 'testuser',
        mfaTempSecret: undefined,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);
      speakeasy.generateSecret.mockReturnValue({
        base32: 'mfa-secret-123',
        otpauth_url: 'otpauth://totp/...'
      });
      qrcode.toDataURL.mockResolvedValue('data:image/png;base64,qr-code-data');

      await initiateEnableMFA(mockReq, mockRes);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(speakeasy.generateSecret).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'MFA initiation successful',
        qrImageUrl: 'data:image/png;base64,qr-code-data',
        secret: 'mfa-secret-123'
      });
    });

    it('should return 401 if user not authorized', async () => {
      mockReq.user = null;

      await initiateEnableMFA(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authorized'
      });
    });
  });

  describe('verifyEnableMFA', () => {
    it('should verify and enable MFA successfully', async () => {
      mockReq.user = { _id: 'user123' };
      mockReq.body = { token: '123456' };

      const mockUser = {
        _id: 'user123',
        mfaTempSecret: 'temp-secret-123',
        mfaSecret: undefined,
        mfaEnabled: false,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);
      speakeasy.totp.verify.mockReturnValue(true);

      await verifyEnableMFA(mockReq, mockRes);

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'temp-secret-123',
        encoding: 'base32',
        token: '123456',
        window: 1
      });
      expect(mockUser.mfaSecret).toBe('temp-secret-123');
      expect(mockUser.mfaEnabled).toBe(true);
      expect(mockUser.mfaTempSecret).toBeUndefined();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'MFA enabled successfully'
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockReq.cookies.refreshToken = 'valid-refresh-token';

      const mockUser = {
        _id: 'user123',
        refreshTokens: [
          {
            token: 'valid-refresh-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('new-access-token');

      await refreshToken(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        'refreshTokens.token': 'valid-refresh-token'
      });
      expect(generateToken).toHaveBeenCalledWith({
        id: 'user123',
        role: 'customer'
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        token: 'new-access-token'
      });
    });
  });

  describe('logout', () => {
    it('should logout user and clear refresh token', async () => {
      mockReq.cookies.refreshToken = 'refresh-token-to-remove';

      const mockUser = {
        refreshTokens: [
          { token: 'refresh-token-to-remove' },
          { token: 'other-token' }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      await logout(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        'refreshTokens.token': 'refresh-token-to-remove'
      });
      expect(mockUser.refreshTokens).toHaveLength(1);
      expect(mockUser.refreshTokens[0].token).toBe('other-token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: false // assuming test environment
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Logged out'
      });
    });
  });
});