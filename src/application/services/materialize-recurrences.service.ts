import { Injectable } from "@nestjs/common";
import {
  materializationHorizon,
  occurrenceDates,
} from "src/shared/transactions/recurrence";
import { RecurringSeriesRepositoryProtocol } from "src/infra/database/repositories/recurring-series/protocols/recurring-series-repository-protocol";

// Gera, sob demanda, as ocorrências que faltam das séries recorrentes do usuário até
// o fim do período consultado (no máximo RECURRENCE_HORIZON_MONTHS à frente de hoje). É idempotente:
// só gera datas depois de generated_until e o banco ignora duplicatas.
@Injectable()
export class MaterializeRecurrencesService {
  constructor(
    private readonly seriesRepository: RecurringSeriesRepositoryProtocol,
  ) {}

  async run(user_id: string, requestedUntil: Date, now = new Date()): Promise<void> {
    const horizon = materializationHorizon(requestedUntil, now);
    const series = await this.seriesRepository.findActiveByUser(user_id);

    for (const item of series) {
      if (item.generated_until.getTime() >= horizon.getTime()) continue;

      const dates = occurrenceDates({
        anchor: item.anchor_date,
        frequency: item.frequency as "MONTHLY" | "YEARLY",
        after: item.generated_until,
        upTo: horizon,
      });

      await this.seriesRepository.appendOccurrences(item, dates);
    }
  }
}
