import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule],
  template: `
    <header class="app-header">
      <div class="app-header__inner">
        <div class="app-header__row">
          <h1 class="app-header__title">{{ titulo() || 'Olá, ' + nomeCliente() }}</h1>
          @if (numeroComanda()) {
            <span class="comanda-badge">
              <lucide-icon name="receipt-text" [size]="16" />
              Comanda #{{ numeroComanda() }}
            </span>
          }
        </div>

        @if (showSearchField()) {
          <div class="search-field" role="search">
            <lucide-icon class="search-field__icon" name="search" />
            <label for="header-search" class="sr-only">Buscar produtos</label>
            <input
              id="header-search"
              class="search-field__input"
              type="search"
              autocomplete="off"
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
  readonly nomeCliente = input('Cliente');
  readonly titulo = input('');
  readonly numeroComanda = input<number | null>();
  readonly showSearchField = input(true);
  readonly searchChange = output<string>();

  onSearchChange(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
