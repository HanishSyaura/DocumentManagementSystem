const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const auditLogService = require('../services/auditLogService')

// Directory for storing backups
const BACKUP_DIR = path.join(__dirname, '../../backups')

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR)
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
  }
}

// Get database connection details from environment
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL
  
  // Parse MySQL connection string
  // Format: mysql://user:password@host:port/database
  const match = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
  
  if (!match) {
    throw new Error('Invalid DATABASE_URL format')
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  }
}

// Create a new backup
exports.createBackup = async (req, res) => {
  try {
    const { name, description } = req.body
    const userId = req.user.id

    if (!name) {
      return res.status(400).json({ message: 'Backup name is required' })
    }

    await ensureBackupDir()

    // Generate unique backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${timestamp}.sql`
    const filePath = path.join(BACKUP_DIR, fileName)

    // Get database config
    const dbConfig = getDatabaseConfig()

    // Create MySQL backup using mysqldump
    // Use -p with password directly for better Windows compatibility
    // Note: This shows password in process list briefly, but is more reliable
    const isWindows = process.platform === 'win32'
    const escapedFilePath = isWindows ? filePath : filePath.replace(/"/g, '\\"')
    
    // Build command with password flag for reliability
    const command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} --result-file="${escapedFilePath}"`
    
    await execAsync(command, {
      timeout: 120000, // 2 minute timeout
      windowsHide: true,
      shell: isWindows ? 'cmd.exe' : '/bin/sh'
    })

    // Get file size
    const stats = await fs.stat(filePath)

    // Create backup record in database
    const backup = await prisma.backup.create({
      data: {
        name,
        description: description || '',
        fileName,
        filePath,
        size: stats.size,
        status: 'completed',
        createdById: userId
      }
    })

    // Convert BigInt to string for JSON serialization
    const backupResponse = {
      ...backup,
      size: backup.size.toString()
    }

    // Audit log
    await auditLogService.log({
      userId,
      action: 'backup.created',
      entity: 'Backup',
      entityId: backup.id,
      description: `Created backup: ${name}`,
      metadata: { fileName, size: stats.size },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      message: 'Backup created successfully',
      backup: backupResponse
    })
  } catch (error) {
    console.error('Backup creation error:', error)
    res.status(500).json({ 
      message: 'Failed to create backup',
      error: error.message 
    })
  }
}

// List all backups
exports.listBackups = async (req, res) => {
  try {
    const backups = await prisma.backup.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Convert BigInt to string for JSON serialization
    const backupsResponse = backups.map(b => ({
      ...b,
      size: b.size.toString()
    }))

    res.json({ backups: backupsResponse })
  } catch (error) {
    console.error('List backups error:', error)
    res.status(500).json({ 
      message: 'Failed to list backups',
      error: error.message 
    })
  }
}

// Download a backup
exports.downloadBackup = async (req, res) => {
  try {
    const { id } = req.params

    const backup = await prisma.backup.findUnique({
      where: { id: parseInt(id) }
    })

    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' })
    }

    // Check if file exists
    try {
      await fs.access(backup.filePath)
    } catch {
      return res.status(404).json({ message: 'Backup file not found on disk' })
    }

    // Send file
    res.download(backup.filePath, backup.fileName)
  } catch (error) {
    console.error('Download backup error:', error)
    res.status(500).json({ 
      message: 'Failed to download backup',
      error: error.message 
    })
  }
}

// Restore from a backup
exports.restoreBackup = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const backup = await prisma.backup.findUnique({
      where: { id: parseInt(id) }
    })

    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' })
    }

    // Check if file exists
    try {
      await fs.access(backup.filePath)
    } catch {
      return res.status(404).json({ message: 'Backup file not found on disk' })
    }

    // Get database config
    const dbConfig = getDatabaseConfig()

    // Restore MySQL backup using mysql
    // WARNING: This will drop and recreate all tables
    const isWindows = process.platform === 'win32'
    
    // On Windows, use -e with source command; on Linux use input redirection
    let command
    if (isWindows) {
      // Windows: use source command within mysql
      const normalizedPath = backup.filePath.replace(/\\/g, '/')
      command = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} -e "source ${normalizedPath}"`
    } else {
      command = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} < "${backup.filePath}"`
    }
    
    await execAsync(command, {
      timeout: 300000, // 5 minute timeout for restore
      windowsHide: true,
      shell: isWindows ? 'cmd.exe' : '/bin/sh'
    })

    // Audit log
    await auditLogService.log({
      userId,
      action: 'backup.restored',
      entity: 'Backup',
      entityId: backup.id,
      description: `Restored backup: ${backup.name}`,
      metadata: { fileName: backup.fileName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      message: 'Backup restored successfully'
    })
  } catch (error) {
    console.error('Restore backup error:', error)
    res.status(500).json({ 
      message: 'Failed to restore backup',
      error: error.message 
    })
  }
}

// Delete a backup
exports.deleteBackup = async (req, res) => {
  try {
    const { id } = req.params

    const backup = await prisma.backup.findUnique({
      where: { id: parseInt(id) }
    })

    if (!backup) {
      return res.status(404).json({ message: 'Backup not found' })
    }

    // Delete file from disk
    try {
      await fs.unlink(backup.filePath)
    } catch (error) {
      console.error('Failed to delete backup file:', error)
      // Continue even if file deletion fails
    }

    // Delete backup record from database
    await prisma.backup.delete({
      where: { id: parseInt(id) }
    })

    // Audit log
    await auditLogService.log({
      userId: req.user.id,
      action: 'backup.deleted',
      entity: 'Backup',
      entityId: parseInt(id),
      description: `Deleted backup: ${backup.name}`,
      metadata: { fileName: backup.fileName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      message: 'Backup deleted successfully'
    })
  } catch (error) {
    console.error('Delete backup error:', error)
    res.status(500).json({ 
      message: 'Failed to delete backup',
      error: error.message 
    })
  }
}
