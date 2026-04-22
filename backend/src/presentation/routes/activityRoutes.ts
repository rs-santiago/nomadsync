import { Router } from 'express';
import { Server } from 'socket.io';
import { PrismaActivityRepository } from '../../infrastructure/database/PrismaActivityRepository';
import { CreateActivityUseCase } from '../../application/use-cases/CreateActivityUseCase';
import { DeleteActivityUseCase } from '../../application/use-cases/DeleteActivityUseCase';
import { ActivityController } from '../controllers/ActivityController';

export const activityRoutes = (io: Server) => {
  const router = Router();
  const repo = new PrismaActivityRepository();
  const createUC = new CreateActivityUseCase(repo);
  const deleteUC = new DeleteActivityUseCase(repo);
  const controller = new ActivityController(createUC, deleteUC, io);

  router.post('/', (req, res) => controller.handleCreate(req, res));
  router.delete('/:id', (req, res) => controller.handleDelete(req, res));

  return router;
};