import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-filter',
  templateUrl: './filter.html',
  imports: [MatExpansionModule, MatIconModule],
})
export class FilterComponent {}
