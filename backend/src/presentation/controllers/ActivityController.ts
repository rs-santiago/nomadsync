import { Request, Response } from 'express';
import { CreateActivityUseCase } from '../../application/use-cases/CreateActivityUseCase';
import { DeleteActivityUseCase } from '../../application/use-cases/DeleteActivityUseCase';
import { Server } from 'socket.io';

export class ActivityController {
  constructor(
    private createUseCase: CreateActivityUseCase,
    private deleteUseCase: DeleteActivityUseCase,
    private io: Server // 👈 Recebemos o servidor de socket aqui
  ) {}

  handleCreate = async (req: any, res: Response) => { 
    try {
      const { title, type, destinationId, tripId } = req.body;
      const activity = await this.createUseCase.execute({ title, type, destinationId });

      if (tripId) {
        console.log(`🔈 Emitindo evento 'activityAdded' para tripId ${tripId}`);
        // Agora o 'this.io' nunca mais será undefined!
        this.io.to(tripId).emit('activityAdded', { tripId, activity }); 
      }

      return res.status(201).json(activity);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  handleDelete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { tripId } = req.query; // Passamos o tripId via query para o socket saber a sala
      
      await this.deleteUseCase.execute(id as string || ""); // Garantimos que seja uma string

      // 📢 AVISO REAL-TIME
      if (tripId) {
        this.io.to(String(tripId)).emit('activityRemoved', { tripId, activityId: id });
      }

      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}