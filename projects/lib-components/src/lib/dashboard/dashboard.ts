import { Component, Input, OnInit } from "@angular/core";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router } from "@angular/router";
import { IconKey, ICONS } from "../types/icons";

export interface Cards {
  title: string;
  subtitle?: string;
  value?: string | number;
  href: string;
  icon: IconKey;
  iconBg?: string;     
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    imports: [MatIconModule]
})
export class DashboardComponent {
    @Input() cards: Cards[] = []
    ICONS = ICONS

    constructor(private router: Router,
        private route: ActivatedRoute
    ){}

    onClick(href: string){
        this.router.navigate([href], {relativeTo: this.route})
    }
}