export function clipboardWrite(content) {
  if (!navigator.clipboard) return

  navigator.clipboard.writeText(content)
}