export interface ApiResponse<T> {
  data: T;
  ok: boolean;
  hayErrores: boolean;
  error: string | null;
  errores: string[];
  isSessionAlive: boolean;
}

export interface HttpRef {
  loading: boolean
}

export class ApiNovedades {
  errores: string[];
  advertencias: string[]
  oks: string[];

  cantidadErrores(): number {
    return this.errores.length;
  }

  cantidadAdvertencias(): number {
    return this.advertencias.length;
  }

  cantidadOks(): number {
    return this.oks.length;
  }

  tengoNovedades(): boolean {
    return (
      this.cantidadAdvertencias() > 0 ||
      this.cantidadErrores() > 0 ||
      this.cantidadOks() > 0
    );
  }
}

export class ApiNovedadesResponse<T> extends ApiNovedades{
data: T;
}

export interface ExtraParamsHttp {
  useNovedades?: boolean;
  queryParams?: any;
}