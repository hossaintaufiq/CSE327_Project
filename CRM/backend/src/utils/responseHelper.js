/**
 * API Response Utilities
 * 
 * Standard response format for all API endpoints.
 * Use these helpers to ensure consistent response structure.
 * 
 * Success: { success: true, data: {...}, meta?: {...} }
 * Error: { success: false, error: { code, message, details? } }
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {Object} [options] - Additional options
 * @param {number} [options.status=200] - HTTP status code
 * @param {string} [options.message] - Optional success message
 * @param {Object} [options.meta] - Optional metadata (pagination, etc.)
 */
export function sendSuccess(res, data, options = {}) {
  const { status = 200, message, meta } = options;
  
  const response = { success: true, data };
  
  if (message) {
    response.message = message;
  }
  
  if (meta) {
    response.meta = meta;
  }
  
  return res.status(status).json(response);
}

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {Object} options - Error options
 * @param {number} [options.status=500] - HTTP status code
 * @param {string} [options.code='SERVER_ERROR'] - Error code
 * @param {string} [options.message='Internal Server Error'] - Error message
 * @param {Object} [options.details] - Additional error details
 */
export function sendError(res, options = {}) {
  const { 
    status = 500, 
    code = 'SERVER_ERROR', 
    message = 'Internal Server Error',
    details 
  } = options;
  
  const response = {
    success: false,
    error: { code, message }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(status).json(response);
}

/**
 * Create an error object with status and code
 * Use with throw in services/controllers
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {string} [code] - Error code
 * @returns {Error} Error object with status and code
 */
export function createError(message, status = 500, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code || (
    status === 400 ? 'BAD_REQUEST' :
    status === 401 ? 'UNAUTHORIZED' :
    status === 403 ? 'FORBIDDEN' :
    status === 404 ? 'NOT_FOUND' :
    status === 409 ? 'CONFLICT' :
    status === 422 ? 'VALIDATION_ERROR' :
    'SERVER_ERROR'
  );
  return error;
}

/**
 * Async handler wrapper for controllers
 * Catches errors and passes them to the error handler
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Shorthand error response function (legacy compatibility)
 * @param {Object} res - Express response object
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {number} [status=500] - HTTP status code
 */
export function errorResponse(res, code, message, status = 500) {
  return sendError(res, { code, message, status });
}

/**
 * Shorthand success response function (legacy compatibility)
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {number} [status=200] - HTTP status code
 */
export function successResponse(res, data, status = 200) {
  return sendSuccess(res, data, { status });
}

/**
 * Shorthand not found response function
 * @param {Object} res - Express response object
 * @param {string} [message='Resource not found'] - Error message
 */
export function notFoundResponse(res, message = 'Resource not found') {
  return sendError(res, { code: 'NOT_FOUND', message, status: 404 });
}

export default {
  sendSuccess,
  sendError,
  createError,
  asyncHandler,
  errorResponse,
  successResponse,
  notFoundResponse,
};
