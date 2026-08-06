import { Component, Input } from "@angular/core";

@Component({
    standalone: true,
    selector: 'app-core-view',
    templateUrl: './core-view.html',
    styleUrls: ['./core-view.css']
})
export class CoreViewComponent{
    @Input('title') title: string;
}