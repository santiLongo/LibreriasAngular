import { Component } from "@angular/core";
import { DialogService, DialogSize, EventBusService } from "lib-servicios";
import { DialogComponent, EditarUsuarioData } from "./dialog/dialog.component";
import { ButtonComponent, CoreViewComponent } from "lib-components";

@Component({
    selector: 'app-test-dialog',
    templateUrl: './test-dialog.component.html',
    imports: [
        CoreViewComponent,
        ButtonComponent
    ]
})
export class TestDialogComponent {
    constructor(private dialgService: DialogService, private event: EventBusService){

    }

    open(size: DialogSize){

        const payload = {
            size: size,
            nombre: "mail@mail.com",
            email: "Usuario"
        };

        this.event.emit('levantar-dialog', payload);
        /*
        this.dialgService.open(DialogComponent, {
            data: <EditarUsuarioData>{
                email: "mail@mail.com",
                nombre: "Usuario"
            },
            size: size,
        })
        */
    }
}