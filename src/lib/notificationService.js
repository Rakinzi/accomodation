// /lib/services/notificationService.js
import { prisma } from "@/lib/prisma"

/**
 * Create a notification when a tenant leaves a property
 * @param {Object} params Parameters for creating the notification
 * @param {string} params.studentId ID of the student who left
 * @param {string} params.studentName Name of the student who left
 * @param {string} params.propertyId ID of the property
 * @param {string} params.propertyLocation Location of the property
 * @param {number} params.roomNumber Room number the student left
 * @param {string} params.landlordId ID of the landlord who owns the property
 */
export async function createTenantLeftNotification({
  studentId,
  studentName,
  propertyId,
  propertyLocation,
  roomNumber,
  landlordId
}) {
  try {
    // Create metadata object with all relevant information
    const metadata = JSON.stringify({
      studentId,
      studentName,
      propertyId,
      propertyLocation,
      roomNumber,
      landlordId
    })

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type: 'TENANT_LEFT',
        title: 'Student Left Room',
        message: `${studentName} has left room ${roomNumber} at ${propertyLocation}`,
        metadata,
        recipientId: landlordId, // The direct recipient is the landlord
        read: false
      }
    })

    return notification
  } catch (error) {
    console.error('[CREATE_TENANT_LEFT_NOTIFICATION]', error)
    throw error
  }
}