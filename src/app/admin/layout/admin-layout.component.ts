import { Component, ViewChild, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    LucideAngularModule,
  ],
  template: `
    <mat-sidenav-container class="admin-container">
      <mat-sidenav
        #sidenav
        class="admin-sidenav"
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
        [disableClose]="!isHandset()"
      >
        <div class="sidenav-header">
          <img src="/logo.png" alt="" class="logo-image" width="28" height="28" />
          <span class="sidenav-brand__name">Angatu Admin</span>
        </div>

        <nav class="sidenav-nav" aria-label="Menu administrativo">
          <mat-nav-list>
            @for (item of menuItems; track item.route) {
              <a
                mat-list-item
                class="menu-item"
                [class.active]="isActive(item.route)"
                [attr.aria-current]="isActive(item.route) ? 'page' : null"
                (click)="navigateTo(item.route)"
                (keydown.enter)="navigateTo(item.route)"
                tabindex="0"
              >
                <lucide-icon matListItemIcon [name]="item.icon" [size]="20" />
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          </mat-nav-list>
        </nav>

        <div class="sidenav-footer">
          <button type="button" class="logout-item" (click)="logout()">
            <lucide-icon name="log-out" [size]="20" />
            <span>Sair</span>
          </button>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="admin-content">
        @if (isHandset()) {
          <header class="mobile-topbar">
            <button mat-icon-button aria-label="Abrir menu" (click)="sidenav.open()">
              <lucide-icon name="menu" [size]="20" />
            </button>
            <span class="mobile-topbar__title">Angatu Admin</span>
          </header>
        }
        <main class="admin-main">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  @ViewChild('sidenav') sidenav?: MatSidenav;

  menuItems = [
    { icon: 'layout-dashboard', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'receipt-text', label: 'Comandas', route: '/admin/comandas' },
    { icon: 'package', label: 'Produtos', route: '/admin/produtos' },
  ];

  private breakpointObserver = inject(BreakpointObserver);

  // Below 1024px the sidebar becomes an overlay drawer
  isHandset = toSignal(
    this.breakpointObserver.observe('(max-width: 1023.98px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router,
  ) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
    if (this.isHandset()) {
      this.sidenav?.close();
    }
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  logout(): void {
    this.adminAuthService.logout();
    this.router.navigate(['/admin/login']);
  }
}
