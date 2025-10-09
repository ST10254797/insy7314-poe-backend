const request = require('supertest');
const app = require('../app');
const User = require('../Models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock dependencies at the TOP LEVEL
jest.mock('../Models/userModel');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('../utils/generateToken', () => jest.fn(() => 'mock-token'));

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register should create user', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'user123',
      fullName: 'Test User',
      IDNumber: '1234567890123',
      AccNumber: 1234567890,
      userName: 'testuser'
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test User',
        IDNumber: '1234567890123',
        AccNumber: 1234567890,
        userName: 'testuser',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'User registered successfully');
  });

  test('POST /api/auth/register should reject existing username', async () => {
    User.findOne.mockResolvedValue({
      userName: 'testuser',
      fullName: 'Existing User'
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test User',
        IDNumber: '1234567890123',
        AccNumber: 1234567890,
        userName: 'testuser',
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Username already exists');
  });

  test('POST /api/auth/login should authenticate user', async () => {
    const mockUser = {
      _id: 'user123',
      fullName: 'Test User',
      userName: 'testuser',
      AccNumber: 1234567890,
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userName: 'testuser',
        AccNumber: 1234567890,
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token', 'mock-token');
    expect(response.body).toHaveProperty('message', 'Login successful');
  });

  test('POST /api/auth/login should reject invalid credentials', async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userName: 'wronguser',
        AccNumber: 9999999999,
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid username or account number');
  });

  test('POST /api/auth/login should reject wrong password', async () => {
    const mockUser = {
      _id: 'user123',
      userName: 'testuser',
      AccNumber: 1234567890,
      comparePassword: jest.fn().mockResolvedValue(false)
    };

    User.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userName: 'testuser',
        AccNumber: 1234567890,
        password: 'wrongpassword'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid password');
  });
});