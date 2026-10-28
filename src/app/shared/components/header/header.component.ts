import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="header-container">
      <mat-toolbar class="custom-toolbar">
        <div class="toolbar-content">
          <div class="header-greeting">
            <h2 class="greeting-text">{{ titulo || 'Olá, ' + nomeCliente }}</h2>
            @if (numeroComanda) {
              <span class="comanda-badge">Comanda #{{ numeroComanda }}</span>
            }
          </div>

          @if (showSearchField) {
            <div class="search-wrapper">
              <mat-icon class="search-icon">search</mat-icon>
              <input
                class="search-input"
                [formControl]="searchControl"
                placeholder="Buscar produtos..."
                (input)="onSearchChange($event)"
              />
            </div>
          }
        </div>
      </mat-toolbar>
    </div>
  `,
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() nomeCliente: string = 'Cliente';
  @Input() titulo: string = '';
  @Input() numeroComanda?: number | null;
  @Input() showSearchField: boolean = true;
  @Output() searchChange = new EventEmitter<string>();

  searchControl = new FormControl('');

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }
}
