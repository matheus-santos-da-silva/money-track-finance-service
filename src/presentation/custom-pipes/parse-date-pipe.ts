import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ParseDatePipe
  implements PipeTransform<string | undefined, Date | undefined>
{
  transform(value: string | undefined): Date | undefined {
    if (!value) return undefined;

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException("Formato de data inválido. Use YYYY-MM-DD");
    }
    return date;
  }
}
