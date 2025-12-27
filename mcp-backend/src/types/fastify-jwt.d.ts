import "@fastify/jwt";                                                              // הרחבת טיפוסים של fastify jwt

declare module "@fastify/jwt" {                                                     // הרחבת המודול
  interface FastifyJWT {                                                            // הגדרת JWT של הפרויקט
    payload: { id: string | number; email: string; role: string };                  // הנתונים שנחתמים בטוקן
    user: { id: string | number; email: string; role: string };                     // הנתונים שמופיעים ב request.user אחרי verify
  }                                                                                 // סוף FastifyJWT
}                                                                                   // סוף declare
