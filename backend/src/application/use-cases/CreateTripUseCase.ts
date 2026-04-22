import { ITripRepository } from '../../domain/repositories/ITripRepository';
import { IImageService } from '../services/IImageService';

interface Input {
  title: string;
  startDate?: string;
  endDate?: string;
  ownerId: string;
}

export class CreateTripUseCase {
  // O construtor recebe as dependências (Injeção de Dependência)
  constructor(
    private tripRepository: ITripRepository,
    private imageService: IImageService
  ) {}

  async execute(input: Input) {
    // 1. Validação de Negócio
    if (!input.title || input.title.trim() === '') {
      throw new Error("O título da viagem é obrigatório.");
    }

    if (!input.ownerId) {
      throw new Error("O ID do dono da viagem é obrigatório.");
    }

    // 2. Busca a foto de capa automaticamente
    const imageUrl = await this.imageService.getCoverImage(input.title);

    // 3. Formata as datas e manda salvar
    const trip = await this.tripRepository.create({
      title: input.title,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      imageUrl,
      ownerId: input.ownerId
    });

    return trip;
  }
}