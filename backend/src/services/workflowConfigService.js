const prisma = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class WorkflowConfigService {
  /**
   * Get all workflows with their steps
   */
  async getAllWorkflows() {
    const workflows = await prisma.workflow.findMany({
      include: {
        documentType: {
          select: {
            id: true,
            name: true
          }
        },
        steps: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            stepOrder: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match frontend format
    return workflows.map(workflow => ({
      id: workflow.id,
      workflowName: workflow.name,
      documentType: workflow.documentType.name,
      documentTypeId: workflow.documentType.id,
      description: workflow.description || '',
      steps: workflow.steps.length,
      stepsDetail: workflow.steps.map(s => s.stepName),
      status: workflow.isActive ? 'Active' : 'Inactive',
      workflowSteps: workflow.steps.map(step => ({
        id: step.id,
        stepName: step.stepName,
        stepOrder: step.stepOrder,
        role: step.role.name,
        roleId: step.roleId,
        timeout: step.dueInDays || 3,
        isRequired: step.isRequired
      })),
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt
    }));
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(workflowId) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        documentType: {
          select: {
            id: true,
            name: true
          }
        },
        steps: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            stepOrder: 'asc'
          }
        }
      }
    });

    if (!workflow) {
      throw new NotFoundError('Workflow');
    }

    return {
      id: workflow.id,
      workflowName: workflow.name,
      documentType: workflow.documentType.name,
      documentTypeId: workflow.documentType.id,
      description: workflow.description || '',
      steps: workflow.steps.length,
      stepsDetail: workflow.steps.map(s => s.stepName),
      status: workflow.isActive ? 'Active' : 'Inactive',
      workflowSteps: workflow.steps.map(step => ({
        id: step.id,
        stepName: step.stepName,
        stepOrder: step.stepOrder,
        role: step.role.name,
        roleId: step.roleId,
        timeout: step.dueInDays || 3,
        isRequired: step.isRequired
      })),
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt
    };
  }

  /**
   * Create new workflow with steps
   */
  async createWorkflow(data) {
    const { workflowName, documentTypeId, description, status, workflowSteps } = data;

    // Validate required fields
    if (!workflowName || !documentTypeId || !workflowSteps || workflowSteps.length === 0) {
      throw new BadRequestError('Workflow name, document type, and at least one step are required');
    }

    // Check if workflow already exists for this document type
    const existing = await prisma.workflow.findUnique({
      where: { documentTypeId: parseInt(documentTypeId) }
    });

    if (existing) {
      throw new BadRequestError('A workflow already exists for this document type. Please update the existing workflow or choose a different document type.');
    }

    // Verify document type exists
    const documentType = await prisma.documentType.findUnique({
      where: { id: parseInt(documentTypeId) }
    });

    if (!documentType) {
      throw new NotFoundError('Document type');
    }

    // Create workflow with steps
    const workflow = await prisma.workflow.create({
      data: {
        name: workflowName,
        description: description || null,
        documentTypeId: parseInt(documentTypeId),
        isActive: status === 'Active',
        steps: {
          create: workflowSteps.map((step, index) => ({
            stepOrder: index + 1,
            stepName: step.stepName || `Step ${index + 1}`,
            roleId: parseInt(step.roleId || step.role),
            isRequired: step.isRequired !== false,
            dueInDays: step.timeout ? parseInt(step.timeout) : null
          }))
        }
      },
      include: {
        documentType: {
          select: {
            id: true,
            name: true
          }
        },
        steps: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            stepOrder: 'asc'
          }
        }
      }
    });

    return this.getWorkflowById(workflow.id);
  }

  /**
   * Update workflow
   */
  async updateWorkflow(workflowId, data) {
    const { workflowName, description, status, workflowSteps } = data;

    // Check if workflow exists
    const existing = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { steps: true }
    });

    if (!existing) {
      throw new NotFoundError('Workflow');
    }

    // Delete existing steps and create new ones
    await prisma.workflowStep.deleteMany({
      where: { workflowId }
    });

    const workflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        name: workflowName,
        description: description || null,
        isActive: status === 'Active',
        steps: {
          create: workflowSteps.map((step, index) => ({
            stepOrder: index + 1,
            stepName: step.stepName || `Step ${index + 1}`,
            roleId: parseInt(step.roleId || step.role),
            isRequired: step.isRequired !== false,
            dueInDays: step.timeout ? parseInt(step.timeout) : null
          }))
        }
      },
      include: {
        documentType: {
          select: {
            id: true,
            name: true
          }
        },
        steps: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            stepOrder: 'asc'
          }
        }
      }
    });

    return this.getWorkflowById(workflow.id);
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId) {
    // Check if workflow exists
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new NotFoundError('Workflow');
    }

    // Check if any documents are using this workflow
    const documentsCount = await prisma.document.count({
      where: { documentTypeId: workflow.documentTypeId }
    });

    if (documentsCount > 0) {
      throw new BadRequestError(`Cannot delete workflow. ${documentsCount} document(s) are using this workflow's document type. Please deactivate the workflow instead.`);
    }

    // Delete workflow (steps will be cascade deleted)
    await prisma.workflow.delete({
      where: { id: workflowId }
    });

    return { success: true };
  }

  /**
   * Toggle workflow active status
   */
  async toggleWorkflowStatus(workflowId) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new NotFoundError('Workflow');
    }

    const updated = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        isActive: !workflow.isActive
      }
    });

    return this.getWorkflowById(updated.id);
  }

  /**
   * Get workflow for document type
   */
  async getWorkflowByDocumentType(documentTypeId) {
    const workflow = await prisma.workflow.findUnique({
      where: { documentTypeId: parseInt(documentTypeId) },
      include: {
        documentType: true,
        steps: {
          include: {
            role: true
          },
          orderBy: {
            stepOrder: 'asc'
          }
        }
      }
    });

    return workflow;
  }
}

module.exports = new WorkflowConfigService();
