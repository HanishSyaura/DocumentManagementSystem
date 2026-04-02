const prisma = require('../config/database');

/**
 * Generate the next Employee ID in the sequence EMPxxxxx
 * @returns {Promise<string>} The next employee ID
 */
const generateEmployeeId = async () => {
  try {
    // Find the user with the latest employeeId
    // We look for IDs starting with 'EMP' to ensure we follow the pattern
    const latestUser = await prisma.user.findFirst({
      where: {
        employeeId: {
          startsWith: 'EMP'
        }
      },
      orderBy: {
        employeeId: 'desc'
      },
      select: {
        employeeId: true
      }
    });

    if (!latestUser || !latestUser.employeeId) {
      return 'EMP00001';
    }

    // Extract the numeric part
    const currentId = latestUser.employeeId;
    const numericPart = currentId.substring(3); // Remove 'EMP'
    
    // Parse to integer and increment
    const nextNumber = parseInt(numericPart, 10) + 1;
    
    // Pad with zeros to ensure 5 digits
    const nextId = `EMP${nextNumber.toString().padStart(5, '0')}`;
    
    return nextId;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    // Fallback in case of error, though this might cause collision if not handled
    return `EMP${Date.now().toString().slice(-5)}`;
  }
};

module.exports = { generateEmployeeId };
