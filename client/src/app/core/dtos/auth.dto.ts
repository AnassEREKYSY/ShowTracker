export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  user: { id: string; email: string };
  accessToken: string;
}

export interface RegisterResponseDto {
  user: { id: string; email: string; createdAt?: string; updatedAt?: string };
  accessToken: string;
}

export interface RefreshResponseDto {
  accessToken: string;
}

export interface MeResponseDto {
  user: { id: string; email: string };
}
