import { GridState, HttpRef, PagedResult } from 'lib-servicios';
import { BehaviorSubject, finalize, Observable } from 'rxjs';

export abstract class BaseGridService<T> {
  private dataSub$ = new BehaviorSubject<T[]>([]);
  private totalSub$ = new BehaviorSubject<number>(0);

  public ref: HttpRef = { loading: false }

  data$ = this.dataSub$.asObservable();
  total$ = this.totalSub$.asObservable();

  state: GridState = {
    page: 1,
    pageSize: 10,
    filters: {}
  };

  protected setData(data: T[], total: number) {
    this.dataSub$.next(data);
    this.totalSub$.next(total);
  }

  public search(): void {
    //
    this.getData(this.state, this.ref)
      .subscribe((res) => {
        this.setData(res.items, res.total);
      });
  }

  abstract getData(state: GridState, ref?: HttpRef): Observable<PagedResult<T>>;

  public setSort(field: string, direction: 'asc' | 'desc' | null) {
    if (!direction) {
      this.state.sort = undefined;
    } else {
      this.state.sort = { field, direction };
    }
    this.search();
  }

  public setFilter(field: string, value: any) {
    if (!this.state.filters) this.state.filters = {};

    if (!value) delete this.state.filters[field];
    else this.state.filters[field] = value;

    this.search();
  }
}
