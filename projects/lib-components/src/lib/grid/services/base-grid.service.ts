import { GridState, PagedResult } from 'lib-servicios';
import { BehaviorSubject, finalize, Observable } from 'rxjs';

export abstract class BaseGridService<T> {
  private dataSub$ = new BehaviorSubject<T[]>([]);
  private totalSub$ = new BehaviorSubject<number>(0);
  private loadingSub$ = new BehaviorSubject<boolean>(false);

  data$ = this.dataSub$.asObservable();
  total$ = this.totalSub$.asObservable();
  loading$ = this.loadingSub$.asObservable();

  state: GridState = {
    page: 1,
    pageSize: 10,
    filters: {}
  };

  protected setLoading(value: boolean) {
    this.loadingSub$.next(value);
  }

  protected setData(data: T[], total: number) {
    this.dataSub$.next(data);
    this.totalSub$.next(total);
  }

  public search(): void {
    this.setLoading(true);
    //
    this.getData(this.state)
      .pipe(finalize(() => this.setLoading(false)))
      .subscribe((res) => {
        this.setData(res.items, res.total);
      });
  }

  abstract getData(state: GridState): Observable<PagedResult<T>>;

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
