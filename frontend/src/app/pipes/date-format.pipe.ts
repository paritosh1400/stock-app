import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'customDateFormat'
})
export class CustomDateFormatPipe implements PipeTransform {

  transform(value: number): string {
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value * 1000, 'MMM dd, yyyy') || '';
  }

}
