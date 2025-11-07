const { getUserTransactions } = require('../Controllers/userController');
const Transaction = require('../Models/Transaction');

// Mock the Transaction model
jest.mock('../Models/Transaction');

describe('userController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { 
        _id: 'user123',
        fullName: 'Test User',
        userName: 'testuser'
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getUserTransactions', () => {
    it('should return user transactions successfully', async () => {
      const mockTransactions = [
        {
          _id: 'trans1',
          amount: 100,
          currency: 'USD',
          sender: {
            _id: 'user123',
            fullName: 'Test User',
            userName: 'testuser'
          },
          recipientAccount: '987654321'
        },
        {
          _id: 'trans2', 
          amount: 50,
          currency: 'EUR',
          sender: {
            _id: 'user123',
            fullName: 'Test User',
            userName: 'testuser'
          },
          recipientAccount: '123456789'
        }
      ];

      Transaction.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockTransactions)
        })
      });

      await getUserTransactions(mockReq, mockRes);

      expect(Transaction.find).toHaveBeenCalledWith({ sender: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockTransactions);
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = null;

      await getUserTransactions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unauthorized: User not found"
      });
      expect(Transaction.find).not.toHaveBeenCalled();
    });

    it('should return 401 if user ID is missing', async () => {
      mockReq.user = {};

      await getUserTransactions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unauthorized: User not found"
      });
    });

    it('should return 500 on database error', async () => {
      mockReq.user = { _id: 'user123' };

      Transaction.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      });

      await getUserTransactions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error fetching transactions",
        error: "Database connection failed"
      });
    });

    it('should populate sender fields correctly', async () => {
      mockReq.user = { _id: 'user123' };

      const mockPopulate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });
      
      Transaction.find.mockReturnValue({
        populate: mockPopulate
      });

      await getUserTransactions(mockReq, mockRes);

      expect(mockPopulate).toHaveBeenCalledWith("sender", "fullName userName");
    });
  });
});