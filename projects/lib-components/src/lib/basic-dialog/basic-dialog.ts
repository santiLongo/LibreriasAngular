import { NgStyle } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";

type DialogSize = 's' | 'm' | 'l' | 'xl' | 'full';

@Component({
    selector: 'app-basic-dialog',
    templateUrl: './basic-dialog.html',
    styleUrl: './basic-dialog.css',
    imports: [MatDialogModule, NgStyle]
})
export class BasicDialogComponent{
    @Input() title = '';
    @Input() size: DialogSize = 'm';
    @Input() height: string | null = null;
    @Input() width: string | null = null;
    @Input() centered = true;

    resolvedWidth = '600px';

    ngOnInit() {
        if (this.width) {
        this.resolvedWidth = this.width;
        return;
        }

        const map: Record<DialogSize, string> = {
        s: '400px',
        m: '600px',
        l: '800px',
        xl: '1100px',
        full: '95vw',
        };

        this.resolvedWidth = map[this.size];
    }
}

