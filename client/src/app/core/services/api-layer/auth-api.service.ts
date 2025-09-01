import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {LoginRequestDto, LoginResponseDto,RegisterRequestDto, RegisterResponseDto,RefreshResponseDto, MeResponseDto } from '../../dtos/auth.dto';


import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private base = environment.apiBaseUrl + '/auth';

  constructor(private http: HttpClient) {}

  register$(dto: RegisterRequestDto): Observable<RegisterResponseDto> {
    return this.http.post<RegisterResponseDto>(`${this.base}/register`, dto, { withCredentials: true });
  }

  login$(dto: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.base}/login`, dto, { withCredentials: true });
  }

  refresh$(): Observable<RefreshResponseDto> {
    return this.http.post<RefreshResponseDto>(`${this.base}/refresh`, {}, { withCredentials: true });
  }

  logout$(allDevices = false) {
    return this.http.post<{ success: true }>(
      `${this.base}/logout`,
      allDevices ? { allDevices: true } : {},
      { withCredentials: true },
    );
  }

  me$(): Observable<MeResponseDto> {
    return this.http.get<MeResponseDto>(`${environment.apiBaseUrl}/me`);
  }
}
