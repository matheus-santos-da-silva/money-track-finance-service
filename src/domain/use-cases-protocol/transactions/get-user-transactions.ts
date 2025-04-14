import { GetUserTransactionsInputDTO } from "src/domain/DTO/transactions/get-transactions-input-DTO";
import { GetUserTransactionsResponseDTO } from "src/domain/DTO/transactions/get-user-transactions-response-DTO";

export abstract class GetUserTransactionsProtocol {
  abstract find(
    data: GetUserTransactionsInputDTO
  ): Promise<GetUserTransactionsResponseDTO>;
}
