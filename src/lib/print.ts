// ============================================================================
// Impressão simples: abre uma janela com HTML formatado e dispara o print.
// Usado para a alocação de quartos (cola na porta) e a escala de serviço.
// ============================================================================

/** Escapa texto para inclusão segura no HTML impresso. */
export function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const ESTILO = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #212529; margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 18px 0 8px; }
  .sub { color: #666; font-size: 12px; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .card { border: 1px solid #ccc; border-radius: 8px; padding: 12px 14px; page-break-inside: avoid; }
  .card h3 { margin: 0 0 8px; font-size: 15px; display: flex; justify-content: space-between; }
  ul { margin: 0; padding-left: 18px; }
  li { font-size: 13px; margin: 3px 0; }
  .tag { font-size: 10px; color: #666; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; text-align: left; }
  th { background: #f1f3f5; }
  /* Uma "folha" por página A4 (ex.: alocação de quarto colada na porta). */
  .folha { min-height: 96vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; padding: 24px; }
  .folha:last-child { page-break-after: auto; }
  .folha .titulo { font-size: 46px; font-weight: 800; margin: 0 0 6px; }
  .folha .subtitulo { font-size: 18px; color: #666; margin-bottom: 40px; }
  .folha .membro { font-size: 38px; font-weight: 700; line-height: 1.15; margin: 14px 0; }
  .folha .papel { display: block; font-size: 15px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: .12em; }
  @media print { body { margin: 0; } button { display: none; } }
`

/** Abre a janela de impressão com o conteúdo dado. */
export function imprimirHtml(titulo: string, conteudo: string): void {
  const win = window.open('', '_blank', 'width=980,height=720')
  if (!win) {
    alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.')
    return
  }
  win.document.write(
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<title>' + esc(titulo) + '</title><style>' + ESTILO + '</style></head><body>' +
      conteudo +
      '<script>window.onload=function(){setTimeout(function(){window.print()},150)}<\/script>' +
      '</body></html>',
  )
  win.document.close()
}
