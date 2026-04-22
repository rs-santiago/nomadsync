import { Request, Response } from 'express';
import { CreateDestinationUseCase } from '../../application/use-cases/CreateDestinationUseCase';
import { ListDestinationsUseCase } from '../../application/use-cases/ListDestinationsUseCase';
import { DeleteDestinationUseCase } from '../../application/use-cases/DeleteDestinationUseCase';

export class DestinationController {
  constructor(
    private createUseCase: CreateDestinationUseCase,
    private listUseCase: ListDestinationsUseCase,
    private deleteUseCase: DeleteDestinationUseCase
  ) {}

  async handleCreate(req: Request, res: Response) {
    try {
      const { name, startDate, endDate, tripId } = req.body;
      const destination = await this.createUseCase.execute({ name, startDate, endDate, tripId });
      return res.status(201).json(destination);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async handleList(req: Request, res: Response) {
    try {
      const { tripId } = req.params; // Pegamos o ID da viagem pela URL
      const destinations = await this.listUseCase.execute(tripId as string || ""); // Garantimos que seja uma string
      return res.status(200).json(destinations);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async handleDelete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.deleteUseCase.execute(id as string || ''); // Garantimos que seja uma string ou null
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}