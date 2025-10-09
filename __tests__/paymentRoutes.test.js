const request = require('supertest');
const app = require('../app');
const Transaction = require('../Models/Transaction');
const User = require('../Models/userModel');
const jwt = require('jsonwebtoken');

// Mock Transaction
jest.mock('../Models/Transaction', () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({
      _id: 'mock-transaction-id',
      sender: 'mock-user-id',
      amount: 100,
      currency: 'USD',
      provider: 'Bank Transfer',
      recipientAccount: '1234567890',
      swiftCode: 'ABCDEFGH'
    })
  }));
});

// Mock User with proper method chaining
jest.mock('../Models/userModel', () => ({
  findById: jest.fn()
}));

jest.mock('jsonwebtoken');

describe('Payment Routes', () => {
  let mockUser;
  let validToken;

  beforeEach(() => {
    // Mock user data
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com'
    };

    validToken = 'mock-valid-token';

    // Mock JWT verification
    jwt.verify.mockReturnValue({ id: mockUser._id });
    
    // Mock the method chain: User.findById().select("-password")
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/payments should create transaction with valid data', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        amount: 100,
        currency: 'USD',
        provider: 'Bank Transfer',
        recipientAccount: '1234567890',
        swiftCode: 'ABCDEFGH'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Transaction recorded');
  });

  test('POST /api/payments should handle database errors', async () => {
    // Mock Transaction to throw error on save
    Transaction.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error('Database connection failed'))
    }));

    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        amount: 100,
        currency: 'USD',
        provider: 'Bank Transfer',
        recipientAccount: '1234567890',
        swiftCode: 'ABCDEFGH'
      });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Server error');
  });

  test('POST /api/payments should reject invalid token', async () => {
    // Mock invalid token
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        amount: 100,
        currency: 'USD',
        provider: 'Bank Transfer',
        recipientAccount: '1234567890',
        swiftCode: 'ABCDEFGH'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Not authorized');
  });

  test('POST /api/payments should reject when user not found', async () => {
    // Mock User.findById().select() to return null (user not found)
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        amount: 100,
        currency: 'USD',
        provider: 'Bank Transfer',
        recipientAccount: '1234567890',
        swiftCode: 'ABCDEFGH'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'User not found');
  });

  test('POST /api/payments should reject invalid input', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        amount: -100, // Invalid negative amount
        currency: 'USDD', // Invalid currency code
        provider: 'Bank Transfer',
        recipientAccount: '123', // Too short account number
        swiftCode: 'ABC' // Too short SWIFT code
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid input detected');
  });
});