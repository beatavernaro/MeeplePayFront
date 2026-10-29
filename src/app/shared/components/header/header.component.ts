import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  template: `
    <header class="app-header">
      <div class="app-header__inner">
        <div class="app-header__row">
          <h1 class="app-header__title">{{ titulo || 'Olá, ' + nomeCliente }}</h1>
          @if (numeroComanda) {
            <span class="comanda-badge">
              <mat-icon aria-hidden="true">receipt_long</mat-icon>
              Comanda #{{ numeroComanda }}
            </span>
          }
        </div>

        @if (showSearchField) {
          <div class="search-field" role="search">
            <mat-icon class="search-field__icon" aria-hidden="true">search</mat-icon>
            <label for="header-search" class="sr-only">Buscar produtos</label>
            <input
              id="header-search"
              class="search-field__input"
              type="search"
              autocomplete="off"
              [formControl]="searchControl"
              placeholder="Buscar produtos..."
              (input)="onSearchChange($event)"
            />
          </div>
        }
      </div>
      <ng-content />
    </header>
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
