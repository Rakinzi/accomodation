import { PrismaClient } from '@prisma/client'

/** @type {Object.<string, import('@prisma/client').PrismaClient>} */
const globalForPrisma = global

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma