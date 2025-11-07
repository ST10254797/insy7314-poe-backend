const validateInput = require('../Middleware/validateInput');

describe('validateInput Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('Successful validation', () => {
    it('should call next() for valid input', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '1234567890123',
        AccNumber: '12345678',
        userName: 'john_doe123',
        password: 'Pass123!@#'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle AccNumber as number', () => {
      mockReq.body = {
        fullName: 'Jane Doe',
        IDNumber: '9876543210987',
        AccNumber: 12345678, // number instead of string
        userName: 'jane_doe',
        password: 'Test123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Missing required fields', () => {
    it('should return 400 if fullName is missing', () => {
      mockReq.body = {
        IDNumber: '1234567890123',
        AccNumber: '12345678',
        userName: 'john_doe',
        password: 'Pass123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'All fields are required'
      });
    });

    it('should return 400 if IDNumber is missing', () => {
      mockReq.body = {
        fullName: 'John Smith',
        AccNumber: '12345678',
        userName: 'john_doe',
        password: 'Pass123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'All fields are required'
      });
    });

    it('should return 400 if all fields are missing', () => {
      mockReq.body = {};

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'All fields are required'
      });
    });
  });

  describe('Invalid format validation', () => {
    it('should reject invalid fullName with numbers', () => {
      mockReq.body = {
        fullName: 'John123', // contains numbers
        IDNumber: '1234567890123',
        AccNumber: '12345678',
        userName: 'john_doe',
        password: 'Pass123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input format'
      });
    });

    it('should reject invalid IDNumber (too short)', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '123456789012', // 12 digits instead of 13
        AccNumber: '12345678',
        userName: 'john_doe',
        password: 'Pass123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input format'
      });
    });

    it('should reject invalid AccNumber (too short)', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '1234567890123',
        AccNumber: '1234567', // 7 digits instead of 8-12
        userName: 'john_doe',
        password: 'Pass123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input format'
      });
    });

    it('should reject invalid userName (special characters)', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '1234567890123',
        AccNumber: '12345678',
        userName: 'john@doe', // contains @
        password: 'Pass123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input format'
      });
    });

    it('should reject invalid password (too short)', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '1234567890123',
        AccNumber: '12345678',
        userName: 'john_doe',
        password: 'Pass12!' // 7 characters instead of 8-12
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input format'
      });
    });

    it('should reject invalid password (too long)', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '1234567890123',
        AccNumber: '12345678',
        userName: 'john_doe',
        password: 'Pass123!@#$%^' // 13 characters instead of 8-12
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input format'
      });
    });

    it('should reject userName that is too short', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '1234567890123',
        AccNumber: '12345678',
        userName: 'joe', // 3 characters instead of 4-20
        password: 'Pass123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input format'
      });
    });
  });

  describe('Edge cases', () => {
    it('should accept valid special characters in password', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '1234567890123',
        AccNumber: '12345678',
        userName: 'john_doe',
        password: 'P@ssw0rd!' // valid special characters
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept maximum length account number', () => {
      mockReq.body = {
        fullName: 'John Smith',
        IDNumber: '1234567890123',
        AccNumber: '123456789012', // 12 digits
        userName: 'john_doe',
        password: 'Pass123!'
      };

      validateInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});