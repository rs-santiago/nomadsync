import { Router } from 'express';
import { requireAuth, authErrorHandler } from '../middlewares/authMiddleware';
import { TripController } from '../controllers/TripController';
import { CreateTripUseCase } from '../../application/use-cases/CreateTripUseCase';
import { ListTripsUseCase } from '../../application/use-cases/ListTripsUseCase';
import { DeleteTripUseCase } from '../../application/use-cases/DeleteTripUseCase';
import { PrismaTripRepository } from '../../infrastructure/database/PrismaTripRepository';
import { UnsplashImageService } from '../../infrastructure/external-apis/UnsplashImageService';
import { GetTripsUseCase } from '../../application/use-cases/GetTripsUseCase';
import { JoinTripUseCase } from '../../application/use-cases/JoinTripUseCase';

const tripRoutes = Router();

// 1. Instanciamos os operários
const tripRepository = new PrismaTripRepository();
const imageService = new UnsplashImageService();

// 2. Instanciamos os cérebros (Casos de Uso)
const createTripUseCase = new CreateTripUseCase(tripRepository, imageService);
const joinTripUseCase = new JoinTripUseCase(tripRepository);
const listTripsUseCase = new ListTripsUseCase(tripRepository);
const deleteTripUseCase = new DeleteTripUseCase(tripRepository);
const getTripUseCase = new GetTripsUseCase(tripRepository);

// 3. Entregamos os cérebros para o Garçom (Controller)
const tripController = new TripController(createTripUseCase, joinTripUseCase, listTripsUseCase, getTripUseCase, deleteTripUseCase);

// 4. Definimos as rotas! (Repare que mudamos de .handle para .handleCreate)
tripRoutes.post('/', requireAuth , (req: any, res) => tripController.handleCreate(req, res));
tripRoutes.get('/', requireAuth , (req: any, res) => tripController.handleList(req, res));
tripRoutes.get('/:id', requireAuth , (req, res) => tripController.handleGet(req, res));
tripRoutes.post('/:id/join', requireAuth , (req: any, res) => tripController.handleJoin(req, res));
tripRoutes.delete('/:id', requireAuth , (req, res) => tripController.handleDelete(req, res));

tripRoutes.use(authErrorHandler);

export { tripRoutes };