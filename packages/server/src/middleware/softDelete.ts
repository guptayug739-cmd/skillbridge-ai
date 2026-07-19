import { Prisma } from '@prisma/client';

const SOFT_DELETE_MODELS = [
  'User',
  'Freelancer',
  'Client',
  'Project',
  'Proposal',
  'Contract',
  'Milestone',
  'Portfolio',
  'Resume',
  'Message',
  'Notification',
  'Review',
  'Dispute',
  'Withdrawal',
  'Education',
  'SavedProject',
];

export function softDeleteMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const modelName = params.model;

    if (modelName && SOFT_DELETE_MODELS.includes(modelName)) {
      if (params.action === 'delete') {
        params.action = 'update';
        params.args.data = { deletedAt: new Date() };
      }

      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (!params.args.data) {
          params.args.data = {};
        }
        params.args.data.deletedAt = new Date();
      }

      if (params.action === 'findMany' || params.action === 'findFirst') {
        if (!params.args.where) {
          params.args.where = {};
        }
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      }

      if (params.action === 'count') {
        if (!params.args.where) {
          params.args.where = {};
        }
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      }
    }

    return next(params);
  };
}
