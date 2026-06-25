const expiryTrackingService = require('./expiryTrackingService')

class ExpiryReminderService {
  scheduleDailyProcessing() {
    const run = async () => {
      try {
        await expiryTrackingService.processDailyStatusAndReminders()
        console.log('Expiry tracking daily processor completed')
      } catch (error) {
        console.error('Expiry tracking daily processor failed:', error)
      }
    }

    run()
    setInterval(run, 24 * 60 * 60 * 1000)
  }
}

module.exports = new ExpiryReminderService()
