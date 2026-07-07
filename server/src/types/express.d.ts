// Lets the authenticate middleware attach the logged-in user's id to the
// request, so controllers can read `req.userId` with proper typing.
export {};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
