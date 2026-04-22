import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { CreateTripUseCase } from '../../application/use-cases/CreateTripUseCase';
import { ListTripsUseCase } from '../../application/use-cases/ListTripsUseCase';
import { DeleteTripUseCase } from '../../application/use-cases/DeleteTripUseCase';
import { GetTripsUseCase } from '../../application/use-cases/GetTripsUseCase';
import { JoinTripUseCase } from '../../application/use-cases/JoinTripUseCase';

export class TripController {
  constructor(
    private createTripUseCase: CreateTripUseCase,
    private joinTripUseCase: JoinTripUseCase,
    private listTripsUseCase: ListTripsUseCase,     // 👈 Injetado
    private getTripsUseCase: GetTripsUseCase,     // 👈 Injetado
    private deleteTripUseCase: DeleteTripUseCase,
  ) {}

  // POST /trips
  async handleCreate(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, startDate, endDate } = req.body;
      const ownerId = req.auth.userId;
      const trip = await this.createTripUseCase.execute({ 
        title, startDate, endDate, ownerId: ownerId || "user_padrao" 
      });
      return res.status(201).json(trip);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
  async handleJoin(req: AuthenticatedRequest, res: Response) {
    try {
    const userId = req.auth.userId; // ID de quem clicou no link
    const tripId = req.params.id as string || null;   // ID da viagem
      const ownerId = req.auth.userId;
      const trip = await this.joinTripUseCase.execute({ 
        userId,
        tripId
      });
      return res.status(201).json(trip);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET /trips
  async handleList(req: AuthenticatedRequest, res: Response) {
    try {
      const ownerId = req.auth.userId;
      const trips = await this.listTripsUseCase.execute(ownerId);
      return res.status(200).json(trips);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // DELETE /trips/:id
  async handleDelete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.deleteTripUseCase.execute(id as string | null); // Passamos o ID para o caso de uso
      return res.status(204).send(); // 204 = No Content (Deletado com sucesso)
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async handleGet(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const trip = await this.getTripsUseCase.execute(id as string || ""); // Garantimos que seja uma string
      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada." });
      }
      return res.status(200).json(trip);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}