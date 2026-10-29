import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Observable, map } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface OpcoesSnackbar {
  acao?: string;
  duracao?: number;
}

/**
 * Snackbars de sucesso/erro e diálogo de confirmação com a aparência padrão do app.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificacaoService {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  sucesso(mensagem: string, opcoes?: OpcoesSnackbar): MatSnackBarRef<TextOnlySnackBar> {
    return this.abrir(mensagem, 'success-snackbar', opcoes);
  }

  erro(mensagem: string, opcoes?: OpcoesSnackbar): MatSnackBarRef<TextOnlySnackBar> {
    return this.abrir(mensagem, 'error-snackbar', opcoes);
  }

  /** Emite true se o usuário confirmar e false se cancelar ou fechar. */
  confirmar(data: ConfirmDialogData, width?: string): Observable<boolean> {
    return this.dialog
      .open(ConfirmDialogComponent, { data, width })
      .afterClosed()
      .pipe(map((resultado) => resultado === true));
  }

  private abrir(
    mensagem: string,
    panelClass: string,
    { acao = 'Fechar', duracao = 3000 }: OpcoesSnackbar = {},
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(mensagem, acao, { duration: duracao, panelClass: [panelClass] });
  }
}
