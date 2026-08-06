import { DatePipe, DecimalPipe } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dynamicFormat',
  standalone: true,
})
export class DynamicFormatPipe implements PipeTransform {
  private locale = inject(LOCALE_ID);
  private decimalPipe = new DecimalPipe(this.locale);
  private datePipe = new DatePipe(this.locale);

  transform(value: any, type: string, format?: string): any {
    if (value == null) return '';

    if (type === 'numeric') {
      return this.formatNumber(Number(value), format ?? '1.0-2');
    }

    if (type === 'date') {
      return this.formatDate(value, format ?? 'dd/MM/yyyy');
    }

    return value;
  }

  private formatNumber(value: number, format?: string) {
    switch (format) {
      case '{0:2}':
        return this.decimalPipe.transform(value, '1.2-2');
      case '{0:1}':
        return this.decimalPipe.transform(value, '1.1-1');
      case 'cuit':
        return this.formatCuit(value);
      default:
      return value
    }
  }

  private formatDate(value: any, format?: string) {
    switch (format) {
      case 'ddMMyyyy hh:MM:ss':
        return this.datePipe.transform(value, 'dd/MM/yyyy HH:mm:ss');
      case 'ddMMyyyy hh:MM':
        return this.datePipe.transform(value, 'dd/MM/yyyy HH:mm');
      case 'ddMMyy':
        return this.datePipe.transform(value, 'dd/MM/yy');
      case 'ddMM':
        return this.datePipe.transform(value, 'dd/MM');
      default:
        return this.datePipe.transform(value, 'dd/MM/yyyy');
    }
  }

  private formatCuit(value: number): string {
    const digits = String(Math.trunc(value));

    const limpio = digits.replace(/\D/g, '');

    if (limpio.length !== 11) return limpio;

    return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`;
  }
}
