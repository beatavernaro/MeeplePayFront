import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-footer-nav',
  standalone: true,
  imports: [CommonModule, MatIconModule, LucideAngularModule],
  template: `
    <nav class="footer-nav" aria-label="Navegação principal">
      <div class="footer-nav__inner">
        <button
          type="button"
          class="nav-btn"
          [class.active]="currentRoute === 'cardapio'"
          [attr.aria-current]="currentRoute === 'cardapio' ? 'page' : null"
          (click)="onNavClick('cardapio')"
        >
          <lucide-icon name="book-open" [size]="20" />
          <span class="nav-btn__label">Cardápio</span>
        </button>

        <button
          type="button"
          class="nav-btn"
          [class.active]="currentRoute === 'carrinho'"
          [attr.aria-current]="currentRoute === 'carrinho' ? 'page' : null"
          (click)="onNavClick('carrinho')"
        >
          <lucide-icon name="shopping-bag" [size]="20" />
          <span class="nav-btn__label">Comanda</span>
          @if (totalItens > 0) {
            <span class="nav-btn__badge" [attr.aria-label]="totalItens + ' itens'">{{ totalItens }}</span>
          }
        </button>
      </div>
    </nav>
  `,
  styleUrl: './footer-nav.component.scss',
})
export class FooterNavComponent {
  @Input() currentRoute: string = '';
  @Input() totalItens: number = 0;
  @Output() navClick = new EventEmitter<string>();

  onNavClick(route: string): void {
    this.navClick.emit(route);
  }
}
