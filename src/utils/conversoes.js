// Telefone digitado (com ou sem máscara) -> número, ou null se vazio.
export function telefoneParaNumero(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '');
  return digitos ? Number(digitos) : null;
}

// Valor digitado ("50", "50,00", "R$ 1.500,00") -> número, ou null se inválido.
export function valorParaNumero(texto) {
  let s = String(texto ?? '').replace(/[^\d,.-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}