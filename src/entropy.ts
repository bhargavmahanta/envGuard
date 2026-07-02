export function shannonEntropy(value: string): number {
  if (value.length === 0) {
    return 0;
  }

  const counts = new Map<string, number>();
  for (const char of value) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

export function isHighEntropy(value: string, threshold: number): boolean {
  const normalized = value.trim();
  if (normalized.length < 20) {
    return false;
  }

  const hasLetters = /[A-Za-z]/.test(normalized);
  const hasNumbers = /\d/.test(normalized);
  const hasSymbols = /[_+/=.-]/.test(normalized);

  return hasLetters && (hasNumbers || hasSymbols) && shannonEntropy(normalized) >= threshold;
}
