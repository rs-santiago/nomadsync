import { Router } from 'express';
import { PrismaDestinationRepository } from '../../infrastructure/database/PrismaDestinationRepository';
import { CreateDestinationUseCase } from '../../application/use-cases/CreateDestinationUseCase';
import { ListDestinationsUseCase } from '../../application/use-cases/ListDestinationsUseCase';
import { DeleteDestinationUseCase } from '../../application/use-cases/DeleteDestinationUseCase';
import { DestinationController } from '../controllers/DestinationController';
import { MapboxLocationService } from '../../infrastructure/services/MapboxLocationService';
import { UnsplashPhotoService } from '../../infrastructure/services/UnsplashPhotoService';

const destinationRoutes = Router();

// 1. Instanciamos o banco
const destinationRepository = new PrismaDestinationRepository();
// Instancia os novos serviços
const locationService = new MapboxLocationService();
const photoService = new UnsplashPhotoService();

// 2. Instanciamos os Casos de Uso
const createUseCase = new CreateDestinationUseCase(destinationRepository, locationService, photoService);
const listUseCase = new ListDestinationsUseCase(destinationRepository);
const deleteUseCase = new DeleteDestinationUseCase(destinationRepository);

// 3. Montamos o Controlador
const destinationController = new DestinationController(createUseCase, listUseCase, deleteUseCase);

// 4. Definimos os endpoints
destinationRoutes.post('/', (req, res) => destinationController.handleCreate(req, res));
destinationRoutes.get('/trip/:tripId', (req, res) => destinationController.handleList(req, res));
destinationRoutes.delete('/:id', (req, res) => destinationController.handleDelete(req, res));

export { destinationRoutes };