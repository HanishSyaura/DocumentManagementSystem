const prisma = require('../config/database')
const notificationService = require('./notificationService')

class ReviewApprovalReminderService {
  startOfHour(value = new Date()) {
    const date = new Date(value)
    date.setMinutes(0, 0, 0)
    return date
  }

  startOfDay(value = new Date()) {
    const date = new Date(value)
    date.setHours(0, 0, 0, 0)
    return date
  }

  startOfWeek(value = new Date()) {
    const date = this.startOfDay(value)
    const day = date.getDay()
    const offset = (day + 6) % 7
    date.setDate(date.getDate() - offset)
    return date
  }

  getDigestFrequency(notifications) {
    const raw = String(notifications?.digestFrequency || 'daily').trim().toLowerCase()
    return ['realtime', 'hourly', 'daily', 'weekly'].includes(raw) ? raw : 'daily'
  }

  isReminderDue(lastReminderSentAt, digestFrequency, now = new Date()) {
    if (digestFrequency === 'realtime') {
      return false
    }

    if (!lastReminderSentAt) {
      return true
    }

    const lastSent = new Date(lastReminderSentAt)
    if (Number.isNaN(lastSent.getTime())) {
      return true
    }

    if (digestFrequency === 'hourly') {
      return this.startOfHour(lastSent).getTime() !== this.startOfHour(now).getTime()
    }

    if (digestFrequency === 'weekly') {
      return this.startOfWeek(lastSent).getTime() !== this.startOfWeek(now).getTime()
    }

    return this.startOfDay(lastSent).getTime() !== this.startOfDay(now).getTime()
  }

  getReminderMeta(assignmentType) {
    if (assignmentType === 'REVIEW') {
      return {
        type: 'reviewRequired',
        title: 'Review Reminder',
        stages: ['REVIEW'],
        actionLabel: 'review'
      }
    }

    if (assignmentType === 'FIRST_APPROVAL' || assignmentType === 'SECOND_APPROVAL') {
      return {
        type: 'approvalRequired',
        title: 'Approval Reminder',
        stages: assignmentType === 'FIRST_APPROVAL' ? ['FIRST_APPROVAL'] : ['SECOND_APPROVAL'],
        actionLabel: 'approval'
      }
    }

    return null
  }

  isAssignmentStillPending(assignment, meta) {
    const document = assignment?.document
    if (!document || !meta) return false
    if (!meta.stages.includes(document.stage)) return false

    if (assignment.assignmentType === 'FIRST_APPROVAL') {
      return document.firstApproverId === assignment.userId
    }

    if (assignment.assignmentType === 'SECOND_APPROVAL') {
      return document.secondApproverId === assignment.userId
    }

    return true
  }

  formatPendingDuration(createdAt, now = new Date()) {
    const created = new Date(createdAt)
    if (Number.isNaN(created.getTime())) {
      return 'some time'
    }

    const diffMs = Math.max(0, now.getTime() - created.getTime())
    const hourMs = 60 * 60 * 1000
    const dayMs = 24 * hourMs
    const days = Math.floor(diffMs / dayMs)
    const hours = Math.floor(diffMs / hourMs)

    if (days >= 1) {
      return `${days} day(s)`
    }

    if (hours >= 1) {
      return `${hours} hour(s)`
    }

    return 'less than 1 hour'
  }

  buildReminderMessage(document, actionLabel, pendingDuration, digestFrequency) {
    return `Reminder: Document "${document.title}" (${document.fileCode}) is still awaiting your ${actionLabel}. Pending for ${pendingDuration}. Frequency: ${digestFrequency}.`
  }

  async processPendingAssignmentReminders(now = new Date()) {
    const assignments = await prisma.documentAssignment.findMany({
      where: {
        assignmentType: {
          in: ['REVIEW', 'FIRST_APPROVAL', 'SECOND_APPROVAL']
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            preferences: {
              select: {
                notifications: true
              }
            }
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            fileCode: true,
            stage: true,
            reviewerId: true,
            firstApproverId: true,
            secondApproverId: true
          }
        }
      }
    })

    for (const assignment of assignments) {
      try {
        if (!assignment.user || assignment.user.status !== 'ACTIVE') {
          continue
        }

        const meta = this.getReminderMeta(assignment.assignmentType)
        if (!this.isAssignmentStillPending(assignment, meta)) {
          continue
        }

        const notifications = assignment.user.preferences?.notifications
        const digestFrequency = this.getDigestFrequency(notifications)
        if (!this.isReminderDue(assignment.lastReminderSentAt, digestFrequency, now)) {
          continue
        }

        const pendingDuration = this.formatPendingDuration(assignment.createdAt, now)
        const link = `/documents/${assignment.documentId}`
        const message = this.buildReminderMessage(
          assignment.document,
          meta.actionLabel,
          pendingDuration,
          digestFrequency
        )

        await notificationService.sendNotification(
          assignment.userId,
          meta.type,
          meta.title,
          message,
          link,
          {
            title: assignment.document.title,
            fileCode: assignment.document.fileCode,
            pendingDuration,
            reminderFrequency: digestFrequency,
            link: notificationService.buildAbsoluteLink(link)
          }
        )

        await prisma.documentAssignment.update({
          where: { id: assignment.id },
          data: { lastReminderSentAt: now }
        })
      } catch (error) {
        console.error(
          `Failed to process reminder for assignment ${assignment.id}:`,
          error
        )
      }
    }
  }

  scheduleProcessing() {
    const run = async () => {
      try {
        await this.processPendingAssignmentReminders()
        console.log('Review and approval reminder processor completed')
      } catch (error) {
        console.error('Review and approval reminder processor failed:', error)
      }
    }

    run()
    setInterval(run, 60 * 60 * 1000)
  }
}

module.exports = new ReviewApprovalReminderService()
