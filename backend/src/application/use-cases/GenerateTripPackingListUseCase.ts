import { IAIService } from '../../domain/services/IAIService';
import { ITripRepository } from '../../domain/repositories/ITripRepository';

export class GenerateTripPackingListUseCase {
  constructor(
    private aiService: IAIService,
    private tripRepository: ITripRepository 
  ) {}

  async execute(tripId: string) {
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) throw new Error("Viagem não encontrada");

    // 1. Pega os nomes dos destinos
    const destinationNames = trip.destinations.map((d: any) => d.name).join(' e ');
    
    // 2. Extrai os títulos das atividades para a IA saber o que a pessoa vai fazer
    const allActivities = trip.destinations
      .flatMap((dest: any) => dest.activities)
      .map((a: any) => a.title);

    // 3. Descobre o mês da viagem para calcular o clima!
    let monthName = "época atual";
    if (trip.startDate) {
      // Pega o nome do mês em português (ex: "Janeiro", "Julho")
      monthName = new Date(trip.startDate).toLocaleString('pt-BR', { month: 'long' });
    }

    // Se não tiver destino cadastrado, evita chamar a IA à toa
    if (!destinationNames) {
      throw new Error("Adicione pelo menos um destino para gerar a bagagem.");
    }

    // 4. Manda pra IA fazer a mágica
    return await this.aiService.generatePackingList(destinationNames, monthName, allActivities);
  }
}