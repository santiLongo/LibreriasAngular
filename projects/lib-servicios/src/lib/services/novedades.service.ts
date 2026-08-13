import { Injectable } from "@angular/core";
import { DialogService } from "./dialog.service";
import { ApiNovedades } from "../models";
import { Observable } from "rxjs";
import { NovedadesDialogComponent } from "../components/novedades-dialog/novedades-dialog.component";

@Injectable({
    providedIn: 'root'
})
export class NovedadesDialogService {
    constructor(private dialog: DialogService){

    }


    openNovedades$(novedades: ApiNovedades): Observable<void> {
        return this.dialog.open(NovedadesDialogComponent, {
            data: novedades
        }).afterClosed();
    }
}