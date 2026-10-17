import { GetStatementQueryDTO } from "src/domain/DTO/transactions/get-statement-query-DTO";
import { GetStatementResponseDTO } from "src/domain/DTO/transactions/get-statement-response-DTO";

export abstract class GetStatementProtocol {
  abstract find(
    user_id: string,
    query: GetStatementQueryDTO,
  ): Promise<GetStatementResponseDTO>;
}
