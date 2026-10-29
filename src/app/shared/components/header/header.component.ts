import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    LucideAngularModule,
    ReactiveFormsModule,
  ],
  template: `
    <header class="app-header">
      <div class="app-header__inner">
        <div class="app-header__row">
          <h1 class="app-header__title">{{ titulo || 'Olá, ' + nomeCliente }}</h1>
          @if (numeroComanda) {
            <span class="comanda-badge">
              <lucide-icon name="receipt-text" [size]="16" />
              Comanda #{{ numeroComanda }}
            </span>
          }
        </div>

        @if (showSearchField) {
          <div class="search-field" role="search">
            <lucide-icon class="search-field__icon" name="search" />
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
