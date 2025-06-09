export abstract class DeleteIncomeProtocol {
  abstract delete(id: string): Promise<void>;
}
