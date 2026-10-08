import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

export type ImgSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' | 'h632';

export function img(path: string | null | undefined, size: ImgSize = 'w342'): string | null {
  return path ? `${environment.imageBase}/${size}${path}` : null;
}

/** {{ poster | img:'w342' }} */
@Pipe({ name: 'img', standalone: true })
export class ImgPipe implements PipeTransform {
  transform(path: string | null | undefined, size: ImgSize = 'w342') { return img(path, size); }
}

export function duration(min: number | null | undefined): string {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** 125 -> "2h 5m" */
@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(min: number | null | undefined) { return duration(min); }
}

/** S1 · E4 */
export const epLabel = (s: number, e: number) => `S${s} · E${e}`;
