import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-footer-nav',
  imports: [LucideAngularModule],
  template: `
    <nav class="footer-nav" aria-label="Navegação principal">
      <div class="footer-nav__inner">
        <button
          type="button"
          class="nav-btn"
          [class.active]="currentRoute() === 'cardapio'"
          [attr.aria-current]="currentRoute() === 'cardapio' ? 'page' : null"
          (click)="navClick.emit('cardapio')"
        >
          <lucide-icon name="book-open" [size]="20" />
          <span class="nav-btn__label">Cardápio</span>
        </button>

        <button
          type="button"
          class="nav-btn"
          [class.active]="currentRoute() === 'carrinho'"
          [attr.aria-current]="currentRoute() === 'carrinho' ? 'page' : null"
          (click)="navClick.emit('carrinho')"
        >
          <lucide-icon name="shopping-bag" [size]="20" />
          <span class="nav-btn__label">Comanda</span>
          @if (totalItens() > 0) {
            <span class="nav-btn__badge" [attr.aria-label]="totalItens() + ' itens'">{{ totalItens() }}</span>
          }
        </button>
      </div>
    </nav>
  `,
  styleUrl: './footer-nav.component.scss',
})
export class FooterNavComponent {
  readonly currentRoute = input('');
  readonly totalItens = input(0);
  readonly navClick = output<string>();
}
