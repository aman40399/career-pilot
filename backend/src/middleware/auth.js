import { clerkMiddleware, requireAuth, createClerkClient } from '@clerk/express';
import { ApiError } from './errorHandler.js';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const isDevBypass = () =>
  process.env.NODE_ENV === 'development' &&
  (process.env.DEV_BYPASS_AUTH === 'true' || !process.env.CLERK_SECRET_KEY);

const attachUserToReq = async (req, res, next) => {
  try {
    // Development bypass
    if (isDevBypass()) {
      const adminEmails = (process.env.ADMIN_EMAILS || 'dev@example.com').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      const devEmail = (process.env.DEV_USER_EMAIL || 'dev@example.com').toLowerCase();
      req.user = {
        uid: process.env.DEV_USER_UID || 'dev-user-001',
        email: process.env.DEV_USER_EMAIL || 'dev@example.com',
        name: 'Local Dev User',
        picture: null,
        emailVerified: true,
        isAdmin: adminEmails.length === 0 || adminEmails.includes(devEmail)
      };
      return next();
    }

    if (!req.auth || !req.auth.userId) {
      req.user = null;
      return next();
    }

    const user = await clerkClient.users.getUser(req.auth.userId);
    const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses[0]?.emailAddress;

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const emailLower = email?.toLowerCase();

    req.user = {
      uid: user.id,
      email: email,
      name: user.fullName || user.username || email?.split('@')[0],
      picture: user.imageUrl,
      emailVerified: true,
      isAdmin: adminEmails.includes(emailLower)
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const enforceAuth = (req, res, next) => {
  if (isDevBypass()) {
    return next();
  }
  if (!req.user) {
    return next(new ApiError(401, 'Unauthorized'));
  }
  next();
};

const clerkMiddlewareWrapper = (req, res, next) => {
  if (isDevBypass()) return next();
  try {
    return clerkMiddleware()(req, res, next);
  } catch {
    return next();
  }
};

export const verifyToken = [
  clerkMiddlewareWrapper,
  attachUserToReq,
  enforceAuth
];

export const optionalAuth = [
  clerkMiddlewareWrapper,
  attachUserToReq
];

export const adminOnly = (req, res, next) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!req.user || !adminEmails.includes(req.user.email?.toLowerCase())) {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
};