export abstract class DeleteExpenseProtocol {
  abstract delete(id: string): Promise<void>;
}