import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

type NavItem = { icon: string; label: string; link: string; };

@Component({
  selector: 'app-side-bar',
  standalone: true,
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
  imports: [CommonModule, RouterLink, RouterLinkActive, MatListModule, MatIconModule, MatButtonModule, MatTooltipModule],
})
export class SidebarComponent {
  @Output() navigate = new EventEmitter<void>();

  items: NavItem[] = [
    { icon: 'movie',        label: 'Movies',    link: '/movies' },
    { icon: 'person',       label: 'Actors',    link: '/actors' },
    { icon: 'whatshot',     label: 'Popular',   link: '/popular' },
    { icon: 'trending_up',  label: 'Trend',     link: '/trend' },
    { icon: 'favorite',     label: 'Favorites', link: '/favorites' },
    { icon: 'bookmark',     label: 'Watchlist', link: '/watchlist' },
  ];
}
