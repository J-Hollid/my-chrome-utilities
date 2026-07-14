export function canonicalRulePropertyPath(path: string): string {
  const segments = path.replaceAll(".", "/").split("/").map((segment) => segment.trim()).filter(Boolean);
  return `/${segments.join("/")}`;
}
